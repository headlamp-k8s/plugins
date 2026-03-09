/*
Copyright 2025 The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package auth_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/headlamp-k8s/headlamp/backend/pkg/auth"
)

func TestAuth_OIDCMismatchDetector_DetectMismatch(t *testing.T) {
	tests := []struct {
		name                string
		isOIDCConfigured    bool
		hadBearerToken      bool
		statusCode          int
		expectMismatchFound bool
	}{
		{
			name:                "OIDC configured, Bearer token sent, 401 response - should detect mismatch",
			isOIDCConfigured:    true,
			hadBearerToken:      true,
			statusCode:          http.StatusUnauthorized,
			expectMismatchFound: true,
		},
		{
			name:                "OIDC configured, Bearer token sent, 403 response - should detect mismatch",
			isOIDCConfigured:    true,
			hadBearerToken:      true,
			statusCode:          http.StatusForbidden,
			expectMismatchFound: true,
		},
		{
			name:                "OIDC configured, Bearer token sent, 200 response - should not detect mismatch",
			isOIDCConfigured:    true,
			hadBearerToken:      true,
			statusCode:          http.StatusOK,
			expectMismatchFound: false,
		},
		{
			name:                "OIDC not configured, Bearer token sent, 401 response - should not detect mismatch",
			isOIDCConfigured:    false,
			hadBearerToken:      true,
			statusCode:          http.StatusUnauthorized,
			expectMismatchFound: false,
		},
		{
			name:                "OIDC configured, no Bearer token, 401 response - should not detect mismatch",
			isOIDCConfigured:    true,
			hadBearerToken:      false,
			statusCode:          http.StatusUnauthorized,
			expectMismatchFound: false,
		},
		{
			name:                "OIDC configured, Bearer token sent, 500 response - should not detect mismatch",
			isOIDCConfigured:    true,
			hadBearerToken:      true,
			statusCode:          http.StatusInternalServerError,
			expectMismatchFound: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := auth.NewOIDCMismatchDetector(tt.isOIDCConfigured, "test-cluster")
			got := detector.DetectMismatch(tt.statusCode, tt.hadBearerToken)

			if got != tt.expectMismatchFound {
				t.Errorf("DetectMismatch() = %v, want %v", got, tt.expectMismatchFound)
			}
		})
	}
}

func TestAuth_OIDCMismatchDetector_WriteOIDCMismatchResponse(t *testing.T) {
	detector := auth.NewOIDCMismatchDetector(true, "test-cluster")
	w := httptest.NewRecorder()

	err := detector.WriteOIDCMismatchResponse(w, http.StatusUnauthorized)
	if err != nil {
		t.Fatalf("WriteOIDCMismatchResponse() error = %v, want nil", err)
	}

	// Check response status code
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Response status = %d, want %d", w.Code, http.StatusUnauthorized)
	}

	// Check Content-Type header
	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Content-Type = %s, want application/json", contentType)
	}

	// Check response body
	var response auth.OIDCMismatchErrorResponse
	err = json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response.Kind != "Status" {
		t.Errorf("Kind = %s, want Status", response.Kind)
	}

	if response.Status != "Failure" {
		t.Errorf("Status = %s, want Failure", response.Status)
	}

	if response.Reason != "OIDCConfigMismatch" {
		t.Errorf("Reason = %s, want OIDCConfigMismatch", response.Reason)
	}

	if response.Details.ErrorType != "oidc-mismatch" {
		t.Errorf("Details.ErrorType = %s, want oidc-mismatch", response.Details.ErrorType)
	}

	if response.Code != http.StatusUnauthorized {
		t.Errorf("Code = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestHasBearerToken(t *testing.T) {
	tests := []struct {
		name           string
		authHeader     string
		expectHasToken bool
	}{
		{
			name:           "Valid Bearer token",
			authHeader:     "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
			expectHasToken: true,
		},
		{
			name:           "Bearer token with extra spaces",
			authHeader:     "  Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
			expectHasToken: true,
		},
		{
			name:           "Lowercase bearer",
			authHeader:     "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
			expectHasToken: true,
		},
		{
			name:           "Mixed case Bearer",
			authHeader:     "BeArer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
			expectHasToken: true,
		},
		{
			name:           "Empty header",
			authHeader:     "",
			expectHasToken: false,
		},
		{
			name:           "No Bearer prefix",
			authHeader:     "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
			expectHasToken: false,
		},
		{
			name:           "Basic auth",
			authHeader:     "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
			expectHasToken: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := HasBearerToken(tt.authHeader)

			if got != tt.expectHasToken {
				t.Errorf("HasBearerToken() = %v, want %v", got, tt.expectHasToken)
			}
		})
	}
}
