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

package auth

import (
	"encoding/json"
	"net/http"
	"strings"
)

// OIDCMismatchErrorResponse represents an error response when OIDC configuration doesn't match
// between Headlamp and Kubernetes API server.
type OIDCMismatchErrorResponse struct {
	Kind       string                 `json:"kind"`
	APIVersion string                 `json:"apiVersion"`
	Metadata   map[string]interface{} `json:"metadata"`
	Status     string                 `json:"status"`
	Message    string                 `json:"message"`
	Reason     string                 `json:"reason"`
	Details    OIDCMismatchDetails    `json:"details"`
	Code       int                    `json:"code"`
}

// OIDCMismatchDetails contains diagnostic information about the mismatch.
type OIDCMismatchDetails struct {
	ErrorType       string `json:"errorType"`
	SuggestedAction string `json:"suggestedAction"`
	OriginalStatus  int    `json:"originalStatus"`
}

// OIDCMismatchDetector detects when OIDC configuration is mismatched between
// Headlamp and the Kubernetes API server.
type OIDCMismatchDetector struct {
	isOIDCConfigured bool
	clusterName      string
}

// NewOIDCMismatchDetector creates a new OIDC mismatch detector for a cluster.
// isOIDCConfigured should be true if Headlamp is configured to use OIDC for this cluster.
func NewOIDCMismatchDetector(isOIDCConfigured bool, clusterName string) *OIDCMismatchDetector {
	return &OIDCMismatchDetector{
		isOIDCConfigured: isOIDCConfigured,
		clusterName:      clusterName,
	}
}

// DetectMismatch returns true if the response indicates an OIDC configuration mismatch.
// This happens when:
// 1. Headlamp is configured for OIDC
// 2. A Bearer token was sent
// 3. The Kubernetes API server returned 401 (Unauthorized) or 403 (Forbidden)
//
// The assumption is that if Headlamp is configured for OIDC and sends a valid token
// but gets 401/403, the API server is likely not configured to validate OIDC tokens.
func (o *OIDCMismatchDetector) DetectMismatch(
	statusCode int,
	hadBearerToken bool,
) bool {
	return o.isOIDCConfigured &&
		hadBearerToken &&
		(statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden)
}

// WriteOIDCMismatchResponse writes a structured error response indicating OIDC mismatch
// to the ResponseWriter.
func (o *OIDCMismatchDetector) WriteOIDCMismatchResponse(
	w http.ResponseWriter,
	originalStatusCode int,
) error {
	errorResponse := OIDCMismatchErrorResponse{
		Kind:       "Status",
		APIVersion: "v1",
		Metadata:   map[string]interface{}{},
		Status:     "Failure",
		Message:    "Kubernetes API server may not be configured for OIDC authentication",
		Reason:     "OIDCConfigMismatch",
		Details: OIDCMismatchDetails{
			ErrorType:       "oidc-mismatch",
			SuggestedAction: "Verify that the Kubernetes API server is configured with the same OIDC provider and settings as Headlamp.",
			OriginalStatus:  originalStatusCode,
		},
		Code: originalStatusCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(originalStatusCode)

	return json.NewEncoder(w).Encode(errorResponse)
}

// HasBearerToken checks if the Authorization header contains a Bearer token.
func HasBearerToken(authHeader string) bool {
	return strings.HasPrefix(strings.TrimSpace(strings.ToLower(authHeader)), "bearer ")
}
