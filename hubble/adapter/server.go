/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package main

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Kubernetes name rules (RFC 1123), so a query can't smuggle anything else into a filter.
const (
	maxNamespaceLength = 63
	maxPodNameLength   = 253
)

var (
	namespacePattern = regexp.MustCompile(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`)
	podNamePattern   = regexp.MustCompile(`^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$`)
)

// FlowSource is where the server gets flows from.
type FlowSource interface {
	Flows(ctx context.Context, namespace, pod string, limit uint64) (Snapshot, error)
}

// Limits bound what a single request may ask of Relay.
type Limits struct {
	// DefaultFlows is how many flows a request gets when it doesn't say.
	DefaultFlows uint64
	// MaxFlows is the most flows a request may ask for.
	MaxFlows uint64
	// Timeout is how long Relay gets to answer.
	Timeout time.Duration
}

type server struct {
	source FlowSource
	limits Limits
	log    *slog.Logger
}

// NewHandler returns the adapter's HTTP API:
//
//	GET /healthz                               liveness and readiness
//	GET /v1/flows?namespace=NS[&pod=POD][&limit=N]   recent flows as JSON
func NewHandler(source FlowSource, limits Limits, log *slog.Logger) http.Handler {
	s := &server{source: source, limits: limits, log: log}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.healthz)
	mux.HandleFunc("GET /v1/flows", s.flows)
	return mux
}

func (s *server) healthz(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintln(w, "ok")
}

func (s *server) flows(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	namespace := query.Get("namespace")
	pod := query.Get("pod")
	if len(namespace) > maxNamespaceLength || !namespacePattern.MatchString(namespace) {
		s.writeError(w, r, http.StatusBadRequest, "namespace must be a valid Kubernetes namespace name")
		return
	}
	if pod != "" && (len(pod) > maxPodNameLength || !podNamePattern.MatchString(pod)) {
		s.writeError(w, r, http.StatusBadRequest, "pod must be a valid Kubernetes pod name")
		return
	}
	limit := s.limits.DefaultFlows
	if raw := query.Get("limit"); raw != "" {
		parsed, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || parsed == 0 || parsed > s.limits.MaxFlows {
			s.writeError(w, r, http.StatusBadRequest, fmt.Sprintf("limit must be a number from 1 to %d", s.limits.MaxFlows))
			return
		}
		limit = parsed
	}

	ctx, cancel := context.WithTimeout(r.Context(), s.limits.Timeout)
	defer cancel()
	snapshot, err := s.source.Flows(ctx, namespace, pod, limit)
	if err != nil {
		// The browser going away is not a Relay problem and has nobody left to answer.
		if errors.Is(r.Context().Err(), context.Canceled) {
			return
		}
		s.log.Error("reading flows from Relay failed", "namespace", namespace, "pod", pod, "error", err)
		s.writeError(w, r, relayErrorStatus(err), "Hubble Relay could not be read: "+status.Convert(err).Message())
		return
	}
	s.writeJSON(w, r, http.StatusOK, snapshot)
}

// relayErrorStatus turns a failed Relay call into the HTTP status that describes it.
func relayErrorStatus(err error) int {
	switch status.Code(err) {
	case codes.Unavailable:
		return http.StatusServiceUnavailable
	case codes.DeadlineExceeded:
		return http.StatusGatewayTimeout
	default:
		if errors.Is(err, context.DeadlineExceeded) {
			return http.StatusGatewayTimeout
		}
		return http.StatusBadGateway
	}
}

func (s *server) writeError(w http.ResponseWriter, r *http.Request, code int, message string) {
	s.writeJSON(w, r, code, map[string]string{"error": message})
}

// writeJSON sends body as JSON, gzipped when the client accepts it. A pod's flows are
// often a megabyte of JSON that gzip makes about 30 times smaller, and the plugin asks
// for them again every few seconds.
func (s *server) writeJSON(w http.ResponseWriter, r *http.Request, code int, body any) {
	header := w.Header()
	header.Set("Content-Type", "application/json")
	// Flows are a point in time: a cached answer would show old traffic as current.
	header.Set("Cache-Control", "no-store")
	header.Add("Vary", "Accept-Encoding")
	if !acceptsGzip(r) {
		w.WriteHeader(code)
		if err := json.NewEncoder(w).Encode(body); err != nil {
			s.log.Warn("writing the response failed", "error", err)
		}
		return
	}

	header.Set("Content-Encoding", "gzip")
	w.WriteHeader(code)
	zw := gzip.NewWriter(w)
	if err := json.NewEncoder(zw).Encode(body); err != nil {
		s.log.Warn("writing the response failed", "error", err)
	}
	if err := zw.Close(); err != nil {
		s.log.Warn("writing the response failed", "error", err)
	}
}

// acceptsGzip reports whether the request's Accept-Encoding allows gzip, like
// "gzip, deflate, br". A "gzip;q=0" entry turns it off.
func acceptsGzip(r *http.Request) bool {
	for _, value := range r.Header.Values("Accept-Encoding") {
		for _, entry := range strings.Split(value, ",") {
			coding, params, _ := strings.Cut(strings.TrimSpace(entry), ";")
			if !strings.EqualFold(strings.TrimSpace(coding), "gzip") {
				continue
			}
			quality := strings.ReplaceAll(strings.TrimSpace(params), " ", "")
			return quality != "q=0" && quality != "q=0.0" && quality != "q=0.00" && quality != "q=0.000"
		}
	}
	return false
}
