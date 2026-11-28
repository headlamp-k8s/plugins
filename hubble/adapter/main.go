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

// The hubble-flows-adapter serves recent Hubble flows as JSON over HTTP.
//
// Hubble Relay only speaks gRPC, which a browser can't use through the Kubernetes API
// server. This adapter sits next to Relay, asks it for the flows of one namespace or
// pod, and returns the few fields the Headlamp hubble plugin needs. The plugin reaches
// it through the API server's Service proxy.
package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const (
	readHeaderTimeout = 10 * time.Second
	shutdownTimeout   = 10 * time.Second
	// writeSlack is the time left to send the answer after Relay's own time is up.
	writeSlack = 5 * time.Second
)

type options struct {
	listenAddress string
	relayAddress  string
	relayTLS      TLSFiles
	limits        Limits
}

func parseOptions(args []string) (options, error) {
	var o options
	flags := flag.NewFlagSet("hubble-flows-adapter", flag.ContinueOnError)
	flags.StringVar(&o.listenAddress, "listen-address", ":8080", "Address the HTTP API listens on.")
	flags.StringVar(&o.relayAddress, "relay-address", "hubble-relay.kube-system.svc:80", "Address of Hubble Relay's gRPC API.")
	flags.StringVar(&o.relayTLS.CAFile, "relay-tls-ca-file", "", "CA certificate to verify Relay with. Leave empty when Relay listens without TLS.")
	flags.StringVar(&o.relayTLS.CertFile, "relay-tls-cert-file", "", "Client certificate, when Relay asks for one.")
	flags.StringVar(&o.relayTLS.KeyFile, "relay-tls-key-file", "", "Key of the client certificate.")
	flags.StringVar(&o.relayTLS.ServerName, "relay-tls-server-name", "", "Name on Relay's certificate, when it differs from the address.")
	flags.Uint64Var(&o.limits.DefaultFlows, "default-flows", 2000, "Flows returned when a request has no limit.")
	flags.Uint64Var(&o.limits.MaxFlows, "max-flows", 5000, "Most flows a request may ask for.")
	flags.DurationVar(&o.limits.Timeout, "relay-timeout", 15*time.Second, "How long Relay gets to answer a request.")
	if err := flags.Parse(args); err != nil {
		return options{}, err
	}
	if o.limits.DefaultFlows == 0 || o.limits.DefaultFlows > o.limits.MaxFlows {
		return options{}, errors.New("default-flows must be from 1 to max-flows")
	}
	if o.limits.Timeout <= 0 {
		return options{}, errors.New("relay-timeout must be positive")
	}
	return o, nil
}

func run(ctx context.Context, o options, log *slog.Logger) error {
	relay, err := NewRelay(o.relayAddress, o.relayTLS)
	if err != nil {
		return err
	}
	defer relay.Close()

	srv := &http.Server{
		Addr:              o.listenAddress,
		Handler:           NewHandler(relay, o.limits, log),
		ReadHeaderTimeout: readHeaderTimeout,
		WriteTimeout:      o.limits.Timeout + writeSlack,
	}

	failed := make(chan error, 1)
	go func() {
		log.Info("serving flows", "address", o.listenAddress, "relay", o.relayAddress, "relayTLS", o.relayTLS.CAFile != "")
		failed <- srv.ListenAndServe()
	}()

	select {
	case err := <-failed:
		return err
	case <-ctx.Done():
	}
	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	o, err := parseOptions(os.Args[1:])
	if err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return
		}
		log.Error("invalid options", "error", err)
		os.Exit(2)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, o, log); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Error("adapter stopped", "error", err)
		os.Exit(1)
	}
}
