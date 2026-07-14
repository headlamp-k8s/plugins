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

/**
 * Redacts common secret and credential patterns from a string before it is
 * sent to an LLM or rendered in the UI.
 *
 * Patterns covered:
 * - PEM-encoded certificates and private keys (-----BEGIN … -----END …-----)
 * - JWT tokens (three-part base64url strings starting with eyJ…)
 * - AWS access key IDs (AKIA…)
 * - HTTP Authorization / X-Api-Key / X-Auth-Token headers
 * - Kubernetes kubeconfig inline certificate/key data (base64 fields)
 * - Generic key=value / key: value pairs whose key name suggests a credential
 *   (password, token, secret, api_key, access_key, private_key, …)
 *
 * Each match is replaced with `[REDACTED]`. The original string is never
 * modified; a new string is returned.
 */
export function redactSecrets(input: string): string {
  let out = input;

  // PEM blocks — run first so private-key content is gone before the
  // generic key-value patterns could match individual lines inside them.
  out = out.replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, '[REDACTED]');

  // JWT tokens: three base64url segments separated by dots.
  // The first two start with "eyJ" (base64 of '{"').
  out = out.replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]');

  // AWS access key IDs (20-char uppercase alphanumeric starting with AKIA).
  out = out.replace(/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED]');

  // HTTP Authorization / credential headers — JSON-quoted form first so the
  // quoted key and value are matched before the unquoted fallback below.
  // e.g. "Authorization": "Bearer eyJ..." → "Authorization": "[REDACTED]"
  out = out.replace(
    /"(authorization|x-api-key|x-auth-token)"(\s*:\s*)"[^"]*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // HTTP Authorization / credential headers in YAML/plain-text (unquoted key).
  // Match everything to end of line so multi-token values like "Bearer <tok>"
  // are fully redacted rather than just the scheme word.
  out = out.replace(
    /\b(authorization|x-api-key|x-auth-token)(\s*:\s*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  // Kubernetes kubeconfig inline base64 certificate / key fields.
  out = out.replace(
    /\b(certificate-authority-data|client-certificate-data|client-key-data|client-certificate|client-key)\s*:\s*\S+/gi,
    '$1: [REDACTED]'
  );

  // Generic credential key/value — JSON-quoted form first.
  // Covers "password": "s3cr3t", "token": "abc 123", etc.
  // Values in JSON can contain spaces, so match [^"]* rather than \S+.
  out = out.replace(
    /"(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth[_-]?token|bearer)"(\s*:\s*)"[^"]*"/gi,
    '"$1"$2"[REDACTED]"'
  );

  // Generic credential key=value or key: value patterns (unquoted / YAML / env-var).
  // Matches common secret-sounding key names and redacts through end-of-line so
  // YAML/plain-text values containing spaces cannot leak trailing words.
  // Capture the separator including surrounding whitespace in group $2 and replay
  // it so the output preserves the original style exactly:
  //   passwd=s3cr3t    → passwd=[REDACTED]
  //   password: hunter → password: [REDACTED]
  // Negative lookahead prevents double-redacting already-replaced values.
  out = out.replace(
    /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth[_-]?token|bearer)(?![^\S\r\n]*[:=][^\S\r\n]*\[REDACTED\])([^\S\r\n]*[:=][^\S\r\n]*)[^\r\n]+/gi,
    '$1$2[REDACTED]'
  );

  return out;
}
