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

import { describe, expect, it } from 'vitest';
import { redactSecrets } from './redactSecrets';

describe('redactSecrets', () => {
  it('returns the input unchanged when there are no secrets', () => {
    const clean = 'pod nginx-abc is Running on node worker-1';
    expect(redactSecrets(clean)).toBe(clean);
  });

  it('redacts Bearer tokens in Authorization headers', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.payload.sig';
    expect(redactSecrets(input)).not.toContain('Bearer eyJ');
    expect(redactSecrets(input)).toContain('[REDACTED]');
  });

  it('redacts Basic auth in Authorization headers', () => {
    const input = 'authorization: Basic dXNlcjpwYXNz';
    const out = redactSecrets(input);
    expect(out).not.toContain('dXNlcjpwYXNz');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts JWT tokens (three-part base64url)', () => {
    const jwt =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const out = redactSecrets(`token value: ${jwt}`);
    expect(out).not.toContain('eyJhbGci');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts PEM private keys', () => {
    const pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4
-----END RSA PRIVATE KEY-----`;
    const out = redactSecrets(pem);
    expect(out).not.toContain('MIIEow');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts PEM certificates', () => {
    const cert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4pHgSpDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
-----END CERTIFICATE-----`;
    const out = redactSecrets(cert);
    expect(out).not.toContain('MIICpD');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts kubeconfig inline certificate data', () => {
    const yaml = `clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t
    server: https://k8s.example.com`;
    const out = redactSecrets(yaml);
    expect(out).not.toContain('LS0tLS1C');
    expect(out).toContain('[REDACTED]');
    expect(out).toContain('server: https://k8s.example.com');
  });

  it('redacts client-certificate-data and client-key-data', () => {
    const yaml = `users:
- user:
    client-certificate-data: AAABBBCCC
    client-key-data: DDDEEEFFF`;
    const out = redactSecrets(yaml);
    expect(out).not.toContain('AAABBBCCC');
    expect(out).not.toContain('DDDEEEFFF');
  });

  it('redacts password and passwd key-value pairs', () => {
    expect(redactSecrets('password: hunter2')).not.toContain('hunter2');
    expect(redactSecrets('passwd=s3cr3t')).not.toContain('s3cr3t');
  });

  it('redacts unquoted credential values containing spaces through end-of-line', () => {
    const input = `password: my secret password
namespace: default`;

    expect(redactSecrets(input)).toBe(`password: [REDACTED]
namespace: default`);
    expect(redactSecrets('token=abc 123 456')).toBe('token=[REDACTED]');
  });

  it('preserves the original separator style in the redacted output', () => {
    // Regression: separator was always hard-coded to ':' in the replacement,
    // so 'passwd=s3cr3t' became 'passwd: [REDACTED]' instead of 'passwd=[REDACTED]'.
    expect(redactSecrets('passwd=s3cr3t')).toBe('passwd=[REDACTED]');
    expect(redactSecrets('password: hunter2')).toBe('password: [REDACTED]');
    expect(redactSecrets('token=abc')).toBe('token=[REDACTED]');
    expect(redactSecrets('secret: val')).toBe('secret: [REDACTED]');
  });

  it('redacts token, secret, and api_key key-value pairs', () => {
    expect(redactSecrets('token: abc123')).not.toContain('abc123');
    expect(redactSecrets('secret=my-secret-value')).not.toContain('my-secret-value');
    expect(redactSecrets('api_key: sk-test-1234')).not.toContain('sk-test-1234');
    expect(redactSecrets('api-key: sk-test-1234')).not.toContain('sk-test-1234');
  });

  it('redacts AWS access key IDs', () => {
    const input = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    const out = redactSecrets(input);
    expect(out).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts temporary AWS credentials and named credential fields', () => {
    const temporaryKey = `ASIA${'A'.repeat(16)}`;
    const input = [
      `AWS_ACCESS_KEY_ID=${temporaryKey}`,
      'AWS_SECRET_ACCESS_KEY=very-secret-value',
      'AWS_SESSION_TOKEN=temporary-session-token',
    ].join('\n');
    const out = redactSecrets(input);
    expect(out).not.toContain(temporaryKey);
    expect(out).not.toContain('very-secret-value');
    expect(out).not.toContain('temporary-session-token');

    const json = redactSecrets(
      JSON.stringify({ AWS_SECRET_ACCESS_KEY: 'json-secret', AWS_SESSION_TOKEN: 'json-token' })
    );
    expect(json).not.toContain('json-secret');
    expect(json).not.toContain('json-token');
  });

  it('preserves non-secret content surrounding secrets', () => {
    const input = `pod: nginx
token: supersecret
namespace: default`;
    const out = redactSecrets(input);
    expect(out).toContain('pod: nginx');
    expect(out).toContain('namespace: default');
    expect(out).not.toContain('supersecret');
  });

  it('handles empty and whitespace-only strings', () => {
    expect(redactSecrets('')).toBe('');
    expect(redactSecrets('   ')).toBe('   ');
  });

  it('redacts JSON-quoted Authorization / X-Api-Key headers', () => {
    // Regression: regex only matched unquoted keys, so JSON payloads with
    // "Authorization": "Bearer ..." leaked credentials to the LLM.
    const bearer = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1In0.sig';
    const json = `{"Authorization": "Bearer ${bearer}", "Content-Type": "application/json"}`;
    const out = redactSecrets(json);
    expect(out).not.toContain(bearer);
    expect(out).toContain('"Authorization": "[REDACTED]"');
    // Non-secret headers must be preserved
    expect(out).toContain('Content-Type');

    expect(redactSecrets('{"x-api-key": "sk-abc123"}')).toBe('{"x-api-key": "[REDACTED]"}');
    expect(redactSecrets('{"X-Auth-Token":"tok"}')).toBe('{"X-Auth-Token":"[REDACTED]"}');
  });

  it('redacts JSON-quoted generic credential pairs (values may contain spaces)', () => {
    // JSON values are enclosed in quotes and can contain spaces — \S+ alone
    // would only capture the first word.
    expect(redactSecrets('{"password": "my secret password"}')).toBe('{"password": "[REDACTED]"}');
    expect(redactSecrets('{"token": "abc 123"}')).not.toContain('abc 123');
    expect(redactSecrets('{"api_key":"sk-test-1234"}')).toBe('{"api_key":"[REDACTED]"}');
    expect(redactSecrets('{"secret": ""}')).toBe('{"secret": "[REDACTED]"}');
  });

  it('preserves JSON structure around redacted credential fields', () => {
    const payload = JSON.stringify({
      pod: 'nginx',
      password: 'hunter2',
      namespace: 'default',
    });
    const out = redactSecrets(payload);
    expect(out).toContain('"pod"');
    expect(out).toContain('nginx');
    expect(out).toContain('"namespace"');
    expect(out).toContain('default');
    expect(out).not.toContain('hunter2');
    expect(out).toContain('[REDACTED]');
  });

  it('does not double-redact already-replaced values', () => {
    // The negative lookahead on the unquoted pattern must prevent transforming
    // "password: [REDACTED]" into "password: [REDACTED" again.
    const alreadyRedacted = 'password: [REDACTED]';
    expect(redactSecrets(alreadyRedacted)).toBe(alreadyRedacted);
  });

  it('redacts all data values of a YAML Kubernetes Secret, including non-obvious keys', () => {
    const secret = [
      'apiVersion: v1',
      'kind: Secret',
      'metadata:',
      '  name: db',
      'data:',
      '  password: aHVudGVyMg==',
      '  DATABASE_URL: cG9zdGdyZXM6Ly8=',
      '  session: YWJjMTIz',
      'type: Opaque',
    ].join('\n');
    const out = redactSecrets(secret);
    expect(out).not.toContain('aHVudGVyMg==');
    expect(out).not.toContain('cG9zdGdyZXM6Ly8=');
    expect(out).not.toContain('YWJjMTIz');
    expect(out).toContain('password: [REDACTED]');
    expect(out).toContain('DATABASE_URL: [REDACTED]');
    expect(out).toContain('session: [REDACTED]');
    // Non-data fields are preserved.
    expect(out).toContain('type: Opaque');
    expect(out).toContain('name: db');
  });

  it('redacts YAML Secret data that appears before kind and removes block scalar payloads', () => {
    const secret = [
      'apiVersion: v1',
      'data:',
      '  DATABASE_URL: |',
      '    postgres://user:password@example.test/db',
      '  quoted-key: c2VjcmV0',
      'kind: Secret',
      'metadata:',
      '  name: db',
    ].join('\n');
    const out = redactSecrets(secret);
    expect(out).not.toContain('postgres://');
    expect(out).not.toContain('c2VjcmV0');
    expect(out).toContain('DATABASE_URL: [REDACTED]');
    expect(out).toContain('quoted-key: [REDACTED]');
    expect(out).toContain('name: db');
  });

  it('redacts Kubernetes Secret JSON embedded in a fenced Markdown block', () => {
    const input = `Result:\n\`\`\`json\n${JSON.stringify({
      kind: 'Secret',
      data: { DATABASE_URL: 'cG9zdGdyZXM6Ly8=' },
    })}\n\`\`\``;
    const out = redactSecrets(input);
    expect(out).not.toContain('cG9zdGdyZXM6Ly8=');
    expect(out).toContain('[REDACTED]');
  });

  it('redacts all data values of a JSON Kubernetes Secret and List responses', () => {
    const secret = JSON.stringify({
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'db' },
      data: { password: 'aHVudGVyMg==', TOKEN_XYZ: 'c2VjcmV0' },
      type: 'Opaque',
    });
    const out = redactSecrets(secret);
    expect(out).not.toContain('aHVudGVyMg==');
    expect(out).not.toContain('c2VjcmV0');
    expect(out).toContain('[REDACTED]');
    expect(out).toContain('"name": "db"');

    const list = JSON.stringify({
      kind: 'List',
      items: [{ kind: 'Secret', data: { a: 'YWJj' } }],
    });
    expect(redactSecrets(list)).not.toContain('YWJj');
  });

  it('does not over-redact ConfigMap data', () => {
    const cm = ['kind: ConfigMap', 'data:', '  app.conf: hello-world'].join('\n');
    expect(redactSecrets(cm)).toContain('app.conf: hello-world');
  });

  it('redacts high-confidence provider token formats', () => {
    expect(redactSecrets('ghp_0123456789abcdefghijABCDEFGHIJ0123')).not.toContain('ghp_0123');
    expect(redactSecrets(`key AIza${'a'.repeat(35)} end`)).not.toContain('AIza');
    expect(redactSecrets('token xoxb-123456789012-abcdefABCDEF end')).not.toContain('xoxb-');
    expect(redactSecrets('OPENAI=sk-proj-abcdefghijklmnopqrstuvwxyz01')).not.toContain('sk-proj-');
    expect(
      redactSecrets('DefaultEndpointsProtocol=https;AccountKey=abc123DEF456==;Rest=1')
    ).toContain('AccountKey=[REDACTED]');
  });
});
