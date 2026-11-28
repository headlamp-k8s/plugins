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
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var testLimits = Limits{DefaultFlows: 2000, MaxFlows: 5000, Timeout: time.Second}

// fakeSource records what the handler asked for.
type fakeSource struct {
	snapshot  Snapshot
	err       error
	calls     int
	namespace string
	pod       string
	limit     uint64
}

func (f *fakeSource) Flows(_ context.Context, namespace, pod string, limit uint64) (Snapshot, error) {
	f.calls++
	f.namespace, f.pod, f.limit = namespace, pod, limit
	return f.snapshot, f.err
}

func get(t *testing.T, source FlowSource, target string) *httptest.ResponseRecorder {
	t.Helper()
	handler := NewHandler(source, testLimits, slog.New(slog.NewTextHandler(io.Discard, nil)))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, target, nil))
	return recorder
}

func TestFlowsReturnsTheSnapshotAsJSON(t *testing.T) {
	source := &fakeSource{snapshot: Snapshot{
		Flows:      []Flow{{Protocol: "TCP", Verdict: "FORWARDED", Source: Peer{IP: "10.0.0.5", Port: 41000}}},
		LostEvents: 2,
	}}
	response := get(t, source, "/v1/flows?namespace=shop&pod=web-1&limit=100")

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", response.Code, response.Body)
	}
	if got := response.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q", got)
	}
	if got := response.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("Cache-Control = %q", got)
	}
	if source.namespace != "shop" || source.pod != "web-1" || source.limit != 100 {
		t.Errorf("asked for %q/%q limit %d", source.namespace, source.pod, source.limit)
	}
	var body Snapshot
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Flows) != 1 || body.Flows[0].Source.Port != 41000 || body.LostEvents != 2 {
		t.Errorf("body = %+v", body)
	}
}

func TestFlowsAreGzippedWhenTheClientAcceptsIt(t *testing.T) {
	source := &fakeSource{snapshot: Snapshot{Flows: []Flow{{Protocol: "UDP"}}, LostEvents: 1}}
	handler := NewHandler(source, testLimits, slog.New(slog.NewTextHandler(io.Discard, nil)))

	for encoding, want := range map[string]bool{
		"gzip, deflate, br":    true,
		"br;q=1.0, GZIP;q=0.5": true,
		"gzip;q=0":             false,
		"deflate":              false,
		"":                     false,
	} {
		request := httptest.NewRequest(http.MethodGet, "/v1/flows?namespace=shop", nil)
		if encoding != "" {
			request.Header.Set("Accept-Encoding", encoding)
		}
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, request)

		if got := recorder.Header().Get("Content-Encoding") == "gzip"; got != want {
			t.Errorf("Accept-Encoding %q: gzipped = %v, want %v", encoding, got, want)
			continue
		}
		if !strings.Contains(recorder.Header().Get("Vary"), "Accept-Encoding") {
			t.Errorf("Accept-Encoding %q: no Vary header, a cache could mix up the two answers", encoding)
		}
		var reader io.Reader = recorder.Body
		if want {
			zr, err := gzip.NewReader(recorder.Body)
			if err != nil {
				t.Fatal(err)
			}
			reader = zr
		}
		var body Snapshot
		if err := json.NewDecoder(reader).Decode(&body); err != nil {
			t.Fatalf("Accept-Encoding %q: %v", encoding, err)
		}
		if len(body.Flows) != 1 || body.LostEvents != 1 {
			t.Errorf("Accept-Encoding %q: body = %+v", encoding, body)
		}
	}
}

func TestFlowsUsesTheDefaultLimitForAWholeNamespace(t *testing.T) {
	source := &fakeSource{}
	get(t, source, "/v1/flows?namespace=shop")
	if source.pod != "" || source.limit != testLimits.DefaultFlows {
		t.Errorf("asked for pod %q limit %d", source.pod, source.limit)
	}
}

func TestFlowsRejectsBadQueriesBeforeAskingRelay(t *testing.T) {
	queries := map[string]string{
		"no namespace":              "",
		"namespace with a slash":    "namespace=shop/web",
		"uppercase namespace":       "namespace=Shop",
		"namespace too long":        "namespace=" + strings.Repeat("a", 64),
		"pod with a slash":          "namespace=shop&pod=web/1",
		"pod with a space":          "namespace=shop&pod=web%201",
		"limit of zero":             "namespace=shop&limit=0",
		"limit over the maximum":    "namespace=shop&limit=5001",
		"limit that isn't a number": "namespace=shop&limit=many",
		"negative limit":            "namespace=shop&limit=-5",
	}
	for name, query := range queries {
		source := &fakeSource{}
		response := get(t, source, "/v1/flows?"+query)
		if response.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want 400", name, response.Code)
		}
		if source.calls != 0 {
			t.Errorf("%s: Relay was asked anyway", name)
		}
		var body map[string]string
		if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil || body["error"] == "" {
			t.Errorf("%s: body %q has no error message", name, response.Body)
		}
	}
}

func TestFlowsMapsRelayFailuresToGatewayStatuses(t *testing.T) {
	failures := map[int]error{
		http.StatusServiceUnavailable: status.Error(codes.Unavailable, "no peers"),
		http.StatusGatewayTimeout:     status.Error(codes.DeadlineExceeded, "too slow"),
		http.StatusBadGateway:         status.Error(codes.InvalidArgument, "bad filter"),
	}
	for want, err := range failures {
		response := get(t, &fakeSource{err: err}, "/v1/flows?namespace=shop")
		if response.Code != want {
			t.Errorf("%v: status = %d, want %d", err, response.Code, want)
		}
		if !strings.Contains(response.Body.String(), status.Convert(err).Message()) {
			t.Errorf("%v: body %q doesn't say why", err, response.Body)
		}
	}

	response := get(t, &fakeSource{err: context.DeadlineExceeded}, "/v1/flows?namespace=shop")
	if response.Code != http.StatusGatewayTimeout {
		t.Errorf("a timed out context gave %d, want 504", response.Code)
	}
}

func TestFlowsWritesNothingWhenTheClientLeft(t *testing.T) {
	handler := NewHandler(&fakeSource{err: errors.New("cancelled")}, testLimits, slog.New(slog.NewTextHandler(io.Discard, nil)))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/v1/flows?namespace=shop", nil).WithContext(ctx))
	if recorder.Body.Len() != 0 {
		t.Errorf("wrote %q to a client that left", recorder.Body)
	}
}

func TestOnlyGETIsServed(t *testing.T) {
	handler := NewHandler(&fakeSource{}, testLimits, slog.New(slog.NewTextHandler(io.Discard, nil)))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/v1/flows?namespace=shop", nil))
	if recorder.Code != http.StatusMethodNotAllowed {
		t.Errorf("POST gave %d, want 405", recorder.Code)
	}
}

func TestHealthz(t *testing.T) {
	response := get(t, &fakeSource{}, "/healthz")
	if response.Code != http.StatusOK || strings.TrimSpace(response.Body.String()) != "ok" {
		t.Errorf("healthz gave %d %q", response.Code, response.Body)
	}
}

func TestParseOptions(t *testing.T) {
	o, err := parseOptions(nil)
	if err != nil {
		t.Fatal(err)
	}
	if o.listenAddress != ":8080" || o.relayAddress != "hubble-relay.kube-system.svc:80" || o.relayTLS.CAFile != "" {
		t.Errorf("defaults = %+v", o)
	}

	for _, args := range [][]string{
		{"-default-flows=0"},
		{"-default-flows=6000"},
		{"-relay-timeout=0s"},
		{"-no-such-flag"},
	} {
		if _, err := parseOptions(args); err == nil {
			t.Errorf("%v: no error", args)
		}
	}
}
