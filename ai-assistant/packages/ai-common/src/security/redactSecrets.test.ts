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

import { dump } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { redactSecrets, redactSecretsInValue } from './redactSecrets';

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

  it('redacts each of several PEM blocks and keeps surrounding text', () => {
    const out = redactSecrets(
      'a -----BEGIN CERTIFICATE-----\nAAA\n-----END CERTIFICATE----- b ' +
        '-----BEGIN EC PRIVATE KEY-----\nBBB\n-----END EC PRIVATE KEY----- c'
    );
    expect(out).toBe('a [REDACTED] b [REDACTED] c');
  });

  it('leaves unterminated PEM headers unchanged', () => {
    const input = '-----BEGIN CERTIFICATE-----\nAAA';
    expect(redactSecrets(input)).toBe(input);
  });

  it('scans adversarial PEM and fenced JSON input in linear time', () => {
    const inputs = [
      '-----BEGIN A-----'.repeat(50_000),
      `kind: Secret\n${'```json'.repeat(50_000)}`,
      `kind: Secret\n\`\`\`json${' '.repeat(100_000)}x`,
    ];
    for (const input of inputs) {
      const start = performance.now();
      redactSecrets(input);
      expect(performance.now() - start).toBeLessThan(500);
    }
  });

  it('redacts JWTs next to look-alike text', () => {
    expect(redactSecrets('eyJ.eyJa.b eyJa.eyJb.c eyJa.eyJb. eyJaeyJb.eyJc.d')).toBe(
      'eyJ.eyJa.b [REDACTED] eyJa.eyJb. [REDACTED]'
    );
  });

  it('scans adversarial JWT-like input in linear time', () => {
    const input = 'eyJ'.repeat(50_000);
    const start = performance.now();
    expect(redactSecrets(input)).toBe(input);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('preserves incomplete JWT-like values', () => {
    const input = 'prefix eyJheader.eyJpayload suffix';
    expect(redactSecrets(input)).toBe(input);
  });

  it('redacts every valid JWT embedded in surrounding text', () => {
    const first = 'eyJheader.eyJpayload.signature_one';
    const second = 'eyJother.eyJclaims.signature-two';
    expect(redactSecrets(`first=${first}; second=${second}`)).toBe(
      'first=[REDACTED]; second=[REDACTED]'
    );
  });

  it('preserves many unterminated PEM headers', () => {
    const input = Array.from({ length: 2_000 }, () => '-----BEGIN CERTIFICATE-----').join('\n');
    expect(redactSecrets(input)).toBe(input);
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

  it('redacts credentials after whitespace before their separator', () => {
    expect(redactSecrets('password : hunter2')).toBe('password : [REDACTED]');
    expect(redactSecrets('token\t=abc')).toBe('token\t=[REDACTED]');
  });

  it('redacts credentials that are not at the start of a line', () => {
    expect(redactSecrets('url=https://x.io/?token=abc123')).toBe(
      'url=https://x.io/?token=[REDACTED]'
    );
    expect(redactSecrets('export api_key: demo-value')).toBe('export api_key: [REDACTED]');
    expect(redactSecrets('my password: hunter2')).toBe('my password: [REDACTED]');
    expect(redactSecrets('The password: hunter2 was leaked')).toBe('The password: [REDACTED]');
  });

  it('leaves non-credential fields and already-redacted values alone', () => {
    for (const input of [
      'url=https://example.com/path',
      'password: [REDACTED]',
      'DB_PASSWORD=hunter2',
    ]) {
      expect(redactSecrets(input)).toBe(input);
    }
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

  it('redacts every fenced JSON Secret after malformed and non-secret blocks', () => {
    const input = [
      '```json\n{invalid}\n```',
      '```json\n{"kind":"ConfigMap","data":{"visible":"yes"}}\n```',
      '```json\n{"kind":"Secret","data":{"first":"c2VjcmV0MQ=="}}\n```',
      '```json\n{"kind":"Secret","stringData":{"second":"secret2"}}\n```',
    ].join('\n');
    const out = redactSecrets(input);
    expect(out).toContain('{invalid}');
    expect(out).toContain('"visible":"yes"');
    expect(out).not.toContain('c2VjcmV0MQ==');
    expect(out).not.toContain('secret2');
    expect(out.match(/\[REDACTED\]/g)).toHaveLength(2);
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

  it('redacts Secret JSON that follows other text', () => {
    const secret = {
      kind: 'Secret',
      metadata: { name: 'db' },
      data: { DATABASE_URL: 'cG9zdGdyZXM6Ly8=' },
    };
    const out = redactSecrets(`Here is the Secret:\n${JSON.stringify(secret, null, 2)}`);
    expect(out).not.toContain('cG9zdGdyZXM6Ly8=');
    expect(out).toContain('"name": "db"');
    expect(out.startsWith('Here is the Secret:\n')).toBe(true);
    // After a credential label like `Secret:` the whole value is the credential.
    expect(redactSecrets(`Secret: ${JSON.stringify(secret)}`)).toBe('Secret: [REDACTED]');
  });

  it('redacts unfenced Secret JSON next to fenced JSON and stray brackets', () => {
    const input = [
      '```json\n{"kind":"Secret","data":{"first":"c2VjcmV0MQ=="}}\n```',
      'See [1',
      '{"kind":"Secret","stringData":{"second":"secret2"}}',
      '{"kind":"ConfigMap","data":{"visible":"yes"}}',
    ].join('\n');
    const out = redactSecrets(input);
    expect(out).not.toContain('c2VjcmV0MQ==');
    expect(out).not.toContain('secret2');
    expect(out).toContain('See [1');
    expect(out).toContain('{"kind":"ConfigMap","data":{"visible":"yes"}}');
  });

  it('redacts Secret JSON inside brackets that are not JSON themselves', () => {
    const secret = '{"kind":"Secret","data":{"DATABASE_URL":"cG9zdGdyZXM6Ly8="}}';
    const configMap = '{"kind":"ConfigMap","data":{"visible":"yes"}}';
    const inputs = [
      `Output [resource: ${secret}]`,
      `Output {resource = [first: ${secret}] and ${configMap}}`,
      `Results [${secret} then ${configMap}] done`,
      `[note: [${secret}, ${configMap}]]`,
      // Quotes in the text around the JSON.
      `Warning: expected "["; resource: ${secret}`,
      `Output [note: "result ${secret}]`,
      // Text right next to the JSON that would make a valid number with a placeholder.
      `Output [1${secret}]`,
      `Output [-${secret}]`,
    ];
    for (const input of inputs) {
      const out = redactSecrets(input);
      expect(out).not.toContain('cG9zdGdyZXM6Ly8=');
      expect(out).toContain('[REDACTED]');
    }
  });

  it('redacts Secret data kept in strings inside JSON', () => {
    const value = 'cG9zdGdyZXM6Ly8=';
    const applied = `${JSON.stringify({
      apiVersion: 'v1',
      data: { DATABASE_URL: value },
      kind: 'Secret',
      metadata: { name: 'db', namespace: 'default' },
    })}\n`;
    const annotations = { 'kubectl.kubernetes.io/last-applied-configuration': applied };
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'db', namespace: 'default', annotations },
      data: { DATABASE_URL: value },
    };
    const secretYaml = `apiVersion: v1\nkind: Secret\nmetadata:\n  name: db\ndata:\n  DATABASE_URL: ${value}\n`;
    const inputs = [
      // kubectl get secret -o json, for a Secret created with kubectl apply.
      JSON.stringify(secret, null, 4),
      `Secrets:\n${JSON.stringify({
        kind: 'SecretList',
        items: [{ metadata: { name: 'db', annotations }, data: { DATABASE_URL: value } }],
      })}`,
      // Tool output returned as text inside JSON, like MCP content blocks.
      JSON.stringify([{ type: 'text', text: JSON.stringify(secret) }]),
      JSON.stringify({ type: 'text', text: secretYaml, meta: { requestId: '1' } }),
    ];
    for (const input of inputs) {
      const out = redactSecrets(input);
      expect(out).not.toContain(value);
      expect(out).toContain('[REDACTED]');
      expect(out).toContain('db');
    }
  });

  it('redacts Secret JSON surrounded by random text', () => {
    // Pieces that look like the start, middle or end of a JSON value.
    const pieces = ['[', ']', '{', '}', '"', ':', ',', ' ', '\n', '\\', '-', '1', '0.', 'e', 'x'];
    pieces.push('true', '"a"', '{"a":', '[1,', '"[', ']"');
    let seed = 1;
    const random = (n: number) => {
      seed = (seed * 48271) % 2147483647;
      return seed % n;
    };
    const noise = () =>
      Array.from({ length: random(8) }, () => pieces[random(pieces.length)]).join('');
    const leaked: string[] = [];
    for (let n = 0; n < 2000; n++) {
      const value = `c2VjcmV0${n}`;
      const secret = { kind: 'Secret', metadata: { name: 'db' }, data: { DATABASE_URL: value } };
      const configMap = `{"kind":"ConfigMap","data":{"keep":"visible${n}"}}`;
      const input = [
        noise(),
        JSON.stringify(secret, null, random(2) ? 2 : undefined),
        noise(),
        configMap,
        noise(),
      ].join('');
      if (redactSecrets(input).includes(value)) leaked.push(input);
    }
    expect(leaked).toEqual([]);
  });

  it('redacts Secret JSON nested too deeply to redact as one value', () => {
    const secret = '{"kind":"Secret","data":{"DATABASE_URL":"cG9zdGdyZXM6Ly8="}}';
    const input = `Output: ${'['.repeat(100_000)}${secret}${']'.repeat(100_000)}`;
    const start = performance.now();
    const out = redactSecrets(input);
    expect(performance.now() - start).toBeLessThan(500);
    expect(out).not.toContain('cG9zdGdyZXM6Ly8=');
    expect(out).toContain('[REDACTED]');
  });

  it('withholds a Secret whose JSON has a branch too deep to redact field by field', () => {
    const deep = `${'['.repeat(150)}${']'.repeat(150)}`;
    const value = 'cG9zdGdyZXM6Ly91c2VyOnB3QGRi';
    const inputs = [
      `Output: {"kind":"Secret","metadata":{"name":"db","annotations":{"x":${JSON.stringify(
        deep
      )}}},"x":${deep},"data":{"DATABASE_URL":"${value}"}}`,
      // A SecretList's items omit their own kind.
      `Output: {"kind":"SecretList","items":[{"metadata":{"name":"db"},"x":${deep},"data":{"DATABASE_URL":"${value}"}}]}`,
      `{"kind":"Secret","x":${'['.repeat(30_000)}${']'.repeat(
        30_000
      )},"data":{"DATABASE_URL":"${value}"}}`,
    ];
    for (const input of inputs) {
      const out = redactSecrets(input);
      expect(out).not.toContain(value);
      expect(out).toContain('[REDACTED]');
    }
  });

  it('redacts Secret data when the output stops anywhere inside the Secret', () => {
    // Every value starts with zq9, so even a value cut in the middle can be spotted.
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'db-creds', namespace: 'default', labels: { app: 'db' } },
      type: 'Opaque',
      data: { DATABASE_URL: 'zq9cG9zdGdyZXM6Ly8=', 'tls.key': 'zq9LS0tLS1CRUdJTg==' },
      stringData: { password: 'zq9hunter2', note: 'zq9 with "quotes" and \\ slashes' },
    };
    const { kind: _kind, ...item } = secret;
    // kubectl sorts keys, 4-space indents -o json, and keeps an escaped copy of an
    // applied Secret in its last-applied-configuration annotation.
    const sorted = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(sorted);
      if (!value || typeof value !== 'object') return value;
      const object = value as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(object)
          .sort()
          .map(key => [key, sorted(object[key])])
      );
    };
    const lastApplied = `${JSON.stringify(sorted(secret))}\n`;
    const applied = sorted({
      ...secret,
      metadata: {
        ...secret.metadata,
        annotations: { 'kubectl.kubernetes.io/last-applied-configuration': lastApplied },
      },
    });
    const yaml = [
      'apiVersion: v1',
      'data:',
      `  DATABASE_URL: ${secret.data.DATABASE_URL}`,
      `  tls.key: ${secret.data['tls.key']}`,
      'kind: Secret',
      'metadata:',
      '  annotations:',
      '    kubectl.kubernetes.io/last-applied-configuration: |',
      `      ${lastApplied.trim()}`,
      '  name: db-creds',
      'type: Opaque',
    ].join('\n');
    // The apiserver's own JSON puts the kind and apiVersion first, and the metadata,
    // with its finalizers, before the data.
    const apiserver = JSON.stringify({
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: {
        ...secret.metadata,
        finalizers: [],
        annotations: { 'kubectl.kubernetes.io/last-applied-configuration': lastApplied },
      },
      data: secret.data,
      stringData: secret.stringData,
      type: 'Opaque',
    });
    // YAML written by hand: comments, a quoted value over two lines and a flow mapping.
    const handYaml = [
      'apiVersion: v1',
      'kind: Secret # database credentials',
      'metadata:',
      '  name: db-creds',
      'data: # base64',
      `  DATABASE_URL: ${secret.data.DATABASE_URL}`,
      `  tls.key: "${secret.data['tls.key']}`,
      '    zq9continued"',
      `stringData: {password: ${secret.stringData.password}}`,
    ].join('\n');
    const documents = [
      JSON.stringify(applied, null, 4),
      yaml,
      handYaml,
      apiserver,
      `Output: ${JSON.stringify(secret)}`,
      JSON.stringify(secret, null, 2),
      `\`\`\`json\n${JSON.stringify(secret, null, 2)}\n\`\`\``,
      `Secrets:\n${JSON.stringify({ kind: 'SecretList', items: [item, item] })}`,
    ];
    // MCP servers return text inside JSON content blocks, which escapes it.
    documents.push(...documents.slice(0, 4).map(text => JSON.stringify([{ type: 'text', text }])));
    for (const document of documents) {
      // Every cut, also before the kind: kubectl sorts keys, so data comes first.
      for (let cut = 0; cut <= document.length; cut++) {
        const input = document.slice(0, cut);
        const out = redactSecrets(input);
        if (out.includes('zq9')) {
          throw new Error(`Secret data leaked when cut at ${cut}:\n${input}\n->\n${out}`);
        }
      }
    }
  });

  it('withholds escaped Secret JSON that cannot be read as a JSON string', () => {
    // "\q" is not a JSON escape, so the string can't be unescaped and checked.
    const input = 'kind: Secret\nannotation: "{\\"data\\":{\\"A\\":\\"zq9\\q12345678\\"}}"';
    const out = redactSecrets(input);
    expect(out).not.toContain('zq9');
    expect(out).toBe('kind: Secret\n[REDACTED]');
  });

  it('keeps the data of a complete ConfigMap next to a Secret that was cut off', () => {
    const input =
      '{"kind":"ConfigMap","data":{"color":"blue"}}\n{"kind":"Secret","data":{"token":"zq9abc';
    const out = redactSecrets(input);
    expect(out).toContain('"color":"blue"');
    expect(out).not.toContain('zq9');
  });

  it('keeps the data of a cut-off object whose kind is known and not Secret', () => {
    const input =
      'kind: Secret was not found.\n{"kind":"ConfigMap","apiVersion":"v1","data":{"a":"blue';
    expect(redactSecrets(input)).toContain('"a":"blue');
  });

  it('reads Secret JSON with an escaped line break or tab after its kind key', () => {
    for (const space of ['\n', '\t', '\r\n', ' \n\t ']) {
      const inner = `{"kind":${space}"Secret","data":{"DATABASE_URL":"zq9cG9zdA=="}}`;
      const wrapped = JSON.stringify({ content: inner });
      for (const input of [wrapped, wrapped.slice(0, wrapped.indexOf('zq9') + 5)]) {
        expect(redactSecrets(input)).not.toContain('zq9');
      }
    }
  });

  it('withholds a deep branch in the items of a SecretList that was cut off', () => {
    const deep = `${'['.repeat(150)}${']'.repeat(150)}`;
    const items = `[{"metadata":{"name":"db"},"x":${deep},"data":{"DATABASE_URL":"zq9cG9zdA=="}}]`;
    const inputs = [
      `{"kind":"SecretList","items":${items}`,
      `{"kind":"SecretList","apiVersion":"v1","items":${items},"metadata":{`,
      `{"kind":"SecretList","items":[${items.slice(1, -1)},{"metadata":{`,
    ];
    for (const input of inputs) {
      const out = redactSecrets(input);
      expect(out).not.toContain('zq9');
      expect(out).toContain('[REDACTED]');
    }
  });

  it('reads a cut-off string of escaped JSON as one string, also with [] or [1] in it', () => {
    const secret = JSON.stringify({
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: { name: 'db', finalizers: [] },
      data: { DATABASE_URL: 'zq9cG9zdA==' },
    });
    const block = JSON.stringify([{ type: 'text', text: secret }]);
    const inputs = [
      block.slice(0, block.indexOf('zq9') + 6),
      '{"note":"{\\"password\\":\\"ab[1]zq9rest',
      'kind: Secret\n{"note":"{\\"data\\":{\\"k\\":\\"ab[1]zq9rest',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
  });

  it('redacts the whole value of a credential with an escaped quote in it', () => {
    const json = '{"password":"first\\"zq9still-private","name":"db"}';
    expect(redactSecrets(json)).toBe('{"password":"[REDACTED]","name":"db"}');
    expect(redactSecrets(JSON.stringify([{ type: 'text', text: json }]))).not.toContain('zq9');
    // Cut off, so they are not complete JSON values.
    const inputs = [
      '{"password":"first\\"zq9still',
      '{"password":"first\\"zq9still\nnext line',
      'Output {"Authorization": "Bearer a\\"zq9b',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
  });

  it('redacts data without a kind that only holds strings, like a Secret cut before its kind', () => {
    const items = '[{"metadata":{"name":"settings"},"data":{"color":"zq9blue"}}]';
    const out = redactSecrets(`{"kind":"Secret","data":{"a":"zq9YWJj"}}\n${items}`);
    expect(out).not.toContain('zq9');
    // Items of a SecretList omit their kind but are Secrets, also when it was cut off.
    const cut = '{"kind":"SecretList","items":[{"metadata":{"name":"db"},"data":{"a":"zq9YWJj"}}';
    expect(redactSecrets(cut)).not.toContain('zq9');
    // Items of a ConfigMapList get their kind from the list and keep their data, and so
    // does data that isn't Secret data, like a query result.
    const configMaps =
      '{"kind":"ConfigMapList","items":[{"metadata":{"name":"cm"},"data":{"color":"blue"}}]}';
    expect(redactSecrets(configMaps)).toBe(configMaps);
    const query = '{"status":"success","data":{"resultType":"vector","result":[]}}';
    expect(redactSecrets(query)).toBe(query);
  });

  it('applies the credential patterns inside JSON strings without touching other fields', () => {
    const input = '{"message":"Using token=abc123","items":[{"name":"pod-1"}],"ok":true}';
    expect(JSON.parse(redactSecrets(input))).toEqual({
      message: 'Using token=[REDACTED]',
      items: [{ name: 'pod-1' }],
      ok: true,
    });
    expect(JSON.parse(redactSecrets('{"note":"use password: hunter2","keep":1}'))).toEqual({
      note: 'use password: [REDACTED]',
      keep: 1,
    });
  });

  it('applies every credential pattern to strings inside JSON as well', () => {
    const samples: Array<[string, string]> = [
      ['-----BEGIN PRIVATE KEY-----\nzq9MIIE\n-----END PRIVATE KEY-----', 'zq9'],
      ['eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.zq9sig', 'zq9'],
      [`AKIA${'Z'.repeat(16)}`, 'AKIA'],
      ['AWS_SECRET_ACCESS_KEY=zq9secret', 'zq9'],
      [`ghp_zq9${'a'.repeat(20)}`, 'zq9'],
      [`AIza${'b'.repeat(35)}`, 'AIza'],
      ['GOCSPX-zq9abcdefghij', 'zq9'],
      ['xoxb-zq9abcdefghij', 'zq9'],
      [`sk-zq9${'c'.repeat(20)}`, 'zq9'],
      ['AccountKey=zq9abc', 'zq9'],
      ['Authorization: Bearer zq9tok', 'zq9'],
      ['client-key-data: zq9LS0t', 'zq9'],
      ['password=zq9hunter', 'zq9'],
      ['api_key: zq9value', 'zq9'],
      ['apiVersion: v1\nkind: Secret\ndata:\n  KEY: zq9dmFs', 'zq9'],
    ];
    for (const [sample, secret] of samples) {
      expect(redactSecrets(sample)).not.toContain(secret);
      const out = redactSecrets(JSON.stringify({ note: sample, keep: 'visible' }));
      expect(out).not.toContain(secret);
      expect(JSON.parse(out).keep).toBe('visible');
    }
  });

  it('changes only the credential values of random JSON, and keeps it valid', () => {
    let seed = 11;
    const random = (n: number) => {
      seed = (seed * 48271) % 2147483647;
      return seed % n;
    };
    // Characters that matter to JSON strings: quotes, backslashes, brackets, colons,
    // line breaks, control characters and characters outside ASCII.
    const alphabet = ['a', 'Z', '0', ' ', '"', '\\', '/', '{', '}', '[', ']', ':', ','];
    alphabet.push('\n', '\t', '\u0001', 'é', '\u2028', '😀', '-', '.');
    const keys = ['name', 'value', 'items', 'note', 'password', 'token', 'Authorization'];
    const word = () =>
      Array.from({ length: random(9) }, () => alphabet[random(alphabet.length)]).join('');
    const build = (depth: number): unknown => {
      const choice = random(depth > 3 ? 4 : 6);
      if (choice === 0 || choice === 3) return word();
      if (choice === 1) return random(2) ? random(1000) - 500 : random(1000) / 7;
      if (choice === 2) return [true, false, null][random(3)];
      if (choice === 4) return Array.from({ length: random(4) }, () => build(depth + 1));
      return Object.fromEntries(
        Array.from({ length: random(5) }, () => [
          random(3) ? word() : keys[random(keys.length)],
          build(depth + 1),
        ])
      );
    };
    // A credential that is an object or an array is redacted whole.
    const redactedWhole = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(redactedWhole);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, redactedWhole(item)])
        );
      }
      return typeof value === 'string' || typeof value === 'number' ? '[REDACTED]' : value;
    };
    const expected = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(expected);
      if (!value || typeof value !== 'object') return value;
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          /^(password|token|authorization)$/i.test(key) ? redactedWhole(item) : expected(item),
        ])
      );
    };
    for (let n = 0; n < 3000; n++) {
      const value = build(0);
      const input = JSON.stringify(value, null, random(2) ? 2 : undefined);
      const out = redactSecrets(input);
      expect(JSON.parse(out)).toEqual(expected(value));
      if (JSON.stringify(expected(value)) === JSON.stringify(value)) expect(out).toBe(input);
    }
  });

  it('redacts YAML Secret data with comments, flow mappings and values over two lines', () => {
    const yaml = [
      'apiVersion: v1',
      'kind: Secret # database credentials',
      'metadata:',
      '  name: db',
      'data: # base64',
      '  DATABASE_URL: zq9cG9z',
      '  NOTE: "zq9first',
      '    zq9second"',
      'stringData: {password: zq9hunter2}',
      'type: Opaque',
    ].join('\n');
    const out = redactSecrets(yaml);
    expect(out).not.toContain('zq9');
    expect(out).toContain('name: db');
    expect(out).toContain('type: Opaque');
  });

  it('redacts YAML Secret data when the output stops before or in the kind line', () => {
    const inputs = [
      'apiVersion: v1\ndata:\n  DATABASE_URL: zq9cG9z',
      'apiVersion: v1\ndata:\n  DATABASE_URL: zq9cG9z\nkind: Sec',
      'apiVersion: v1\nitems:\n- apiVersion: v1\n  data:\n    KEY: zq9dmFs',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
    // A complete kind line says what the object is.
    const configMap =
      'apiVersion: v1\ndata:\n  color: blue\nkind: ConfigMap\nmetadata:\n  name: settings\n';
    expect(redactSecrets(configMap)).toBe(configMap);
  });

  it('redacts the whole value of a credential label that has JSON on its line', () => {
    expect(redactSecrets('password: prefix[1]zq9tail')).toBe('password: [REDACTED]');
    expect(redactSecrets('token: {"value":"zq9tail"}')).toBe('token: [REDACTED]');
    expect(redactSecrets('api_key=a {"x":1} zq9b')).toBe('api_key=[REDACTED]');
    // JSON that goes on over the next lines is part of the value, and what follows
    // can't be told apart from it, so it's withheld too.
    expect(redactSecrets('token: x {"a":\n"zq9b"}\nnext')).toBe('[REDACTED]');
    // A Kubernetes object after a label is redacted whole.
    expect(
      redactSecrets('Secret: {"kind":"Secret","metadata":{"name":"db"},"data":{"a":"zq9c"}}')
    ).toBe('Secret: [REDACTED]');
  });

  it('redacts a credential value over several lines after a label in the middle of a line', () => {
    // The value goes on over the next lines, which are withheld with it.
    expect(redactSecrets('note token: "zq9a\n  zq9b" done\nnext')).toBe('[REDACTED]');
    expect(redactSecrets('{"x":1} password: |\n  zq9a\n  zq9b\nnext: 1')).toBe('{"x":1}[REDACTED]');
    const out = redactSecrets('token: "zq9a\n  zq9b" {"kind":"Secret","data":{"a":"zq9c"}}');
    expect(out).not.toContain('zq9');
  });

  it('withholds a value too deep to read when it may hold a credential', () => {
    const deep = `${'['.repeat(101)}${']'.repeat(101)}`;
    const block = `{"content":[{"type":"text","text":"{\\"password\\":\\"zq9a\\"}"}],"x":${deep}}`;
    const out = redactSecrets(block);
    expect(out).not.toContain('zq9');
    expect(JSON.parse(out).content[0].text).toBe('{"password":"[REDACTED]"}');
    let wrapped = '{"password":"zq9b"}';
    for (let i = 0; i < 8; i++) wrapped = JSON.stringify({ content: wrapped });
    expect(redactSecrets(wrapped)).not.toContain('zq9');
  });

  it('redacts tokens used as JSON keys and keeps the JSON valid', () => {
    const key = `ghp_zq9${'a'.repeat(30)}`;
    const out = redactSecrets(JSON.stringify({ [key]: 'active', keep: 'yes' }));
    expect(JSON.parse(out)).toEqual({ '[REDACTED]': 'active', keep: 'yes' });
    // Cut off, and a key of Secret data.
    expect(redactSecrets(`{"${key}":"active","n":`)).not.toContain('zq9');
    expect(redactSecrets(`{"kind":"Secret","data":{"${key}":"x"}}`)).not.toContain('zq9');
  });

  it('redacts a credential that is an object or an array whole', () => {
    expect(
      JSON.parse(redactSecrets('{"token":{"value":"zq9a","n":1,"ok":true},"name":"x"}'))
    ).toEqual({ token: { value: '[REDACTED]', n: '[REDACTED]', ok: true }, name: 'x' });
    expect(JSON.parse(redactSecrets('{"password":["zq9a",2]}'))).toEqual({
      password: ['[REDACTED]', '[REDACTED]'],
    });
    expect(redactSecrets('{"token":{"value":"zq9a"')).not.toContain('zq9');
    // A Pod's secret volume names a Secret, which isn't a credential.
    const volume =
      '{"kind":"Pod","spec":{"volumes":[{"name":"creds","secret":{"secretName":"db-creds"}}]}}';
    expect(redactSecrets(volume)).toBe(volume);
  });

  it('redacts the items of a list cut off before its kind, in any key order', () => {
    const inputs = [
      '{"apiVersion":"v1","items":[{"data":{"DATABASE_URL":"zq9a"}}]',
      '{"items":[{"metadata":{"name":"db"},"data":{"A":"zq9b"}},{"data":{"B":"zq9c',
      // Keys in another order than kubectl's, cut before both kind and apiVersion.
      '{"type":"Opaque","data":{"A":"zq9d"},"metadata":{"name":"db"},"api',
      'items:\n- metadata:\n    name: db\n  data:\n    A: zq9e\n- metadata:\n',
      'type: Opaque\ndata:\n  A: zq9f\napi',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
    // A complete list keeps the data of items that say what they are.
    const list = JSON.stringify({
      kind: 'List',
      items: [{ kind: 'ConfigMap', data: { color: 'blue' } }],
    });
    expect(redactSecrets(list)).toBe(list);
  });

  it('redacts the data of each YAML object by its own kind', () => {
    const configMap =
      '- apiVersion: v1\n  kind: ConfigMap\n  metadata:\n    name: cm\n  data:\n    color: blue\n';
    const list = `apiVersion: v1\nkind: List\nitems:\n${configMap}- apiVersion: v1\n  data:\n    DATABASE_URL: zq9a`;
    const out = redactSecrets(list);
    expect(out).not.toContain('zq9');
    expect(out).toContain('color: blue');
    // Objects one after another without `---` between them.
    const inputs = [
      'apiVersion: v1\nkind: ConfigMap\ndata:\n  color: blue\napiVersion: v1\ndata:\n  A: zq9b\nkind: Secret\n',
      'kind: ConfigMap\nmetadata:\n  name: cm\n\nstringData:\n  A: zq9c\nkind: Secret\n',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
  });

  it('redacts every entry of a YAML data block, also entries named like keys', () => {
    const yaml =
      'apiVersion: v1\nkind: Secret\ndata:\n  data: zq9a\n  stringData: zq9b\n  kind: zq9c\n  session: zq9d\nmetadata:\n  name: db\n';
    const out = redactSecrets(yaml);
    expect(out).toContain(
      '  data: [REDACTED]\n  stringData: [REDACTED]\n  kind: [REDACTED]\n  session: [REDACTED]'
    );
    expect(out).toContain('name: db');
  });

  it('redacts YAML data values over several lines with the lines that hold them', () => {
    const yaml = [
      'apiVersion: v1',
      'kind: Secret',
      'stringData:',
      '  config: "first',
      '    private-value: zq9a',
      '    end"',
      "  single: 'line1",
      '',
      "    zq9b: x'",
      '  block: |',
      '    zq9c: y',
      '  # old: zq9d',
      '  plain: zq9e',
      '    zq9f more',
      'metadata:',
      '  name: db',
    ].join('\n');
    const out = redactSecrets(yaml);
    expect(out).not.toContain('zq9');
    expect(out).toContain(
      'stringData:\n  config: [REDACTED]\n  single: [REDACTED]\n  block: [REDACTED]\n  plain: [REDACTED]\nmetadata:'
    );
  });

  it('redacts YAML Secrets whose kind is cut off or written over several lines', () => {
    const inputs = [
      'kind: |\n  Secret\ndata:\n  A: zq9a\n',
      'kind: Sec\n  ret\ndata:\n  A: zq9b\n',
      // The output stops after the line, before the rest of the kind.
      'data:\n  A: zq9c\nkind: Sec\n',
      'apiVersion: v1\nkind: Sec\n  retList\nitems:\n- data:\n    A: zq9d\n',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
  });

  it('redacts the copy of a Secret in a quoted annotation over several lines', () => {
    const applied = JSON.stringify({
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'db' },
      data: { A: 'zq9a' },
    });
    // A long double-quoted string folds at spaces, like go-yaml writes it.
    const quoted = JSON.stringify(applied).replace(/,/g, ', ').split(' ').join('\n      ');
    const yaml = `apiVersion: v1\nkind: Secret\nmetadata:\n  name: db\n  annotations:\n    kubectl.kubernetes.io/last-applied-configuration: ${quoted}\ndata:\n  A: zq9a\n`;
    const out = redactSecrets(yaml);
    expect(out).not.toContain('zq9');
    expect(out).toContain('name: db');
    // The same as an entry of a sequence.
    expect(redactSecrets(`args:\n- ${quoted}\n`)).not.toContain('zq9');
  });

  it('redacts list entries whose keys start on the line after the dash', () => {
    const yaml =
      'items:\n- # first\n  metadata:\n    name: db\n  data:\n    A: zq9a\n-\n  data:\n    B: zq9b\n';
    const out = redactSecrets(yaml);
    expect(out).not.toContain('zq9');
    expect(out).toContain('name: db');
  });

  it('redacts a token that the end of the output cut short', () => {
    expect(redactSecrets('{"ghp_zq9abc')).not.toContain('zq9');
    expect(redactSecrets('key: AIzazq9abc')).not.toContain('zq9');
    // A short look-alike that isn't at the end stays.
    expect(redactSecrets('ghp_short ok')).toBe('ghp_short ok');
  });

  it('leaves no Secret data in random Kubernetes output cut off anywhere', () => {
    let seed = 7;
    const random = (n: number) => {
      seed = (seed * 48271) % 2147483647;
      return seed % n;
    };
    const pick = <T>(items: T[]): T => items[random(items.length)];
    let count = 0;
    const tag = (prefix: string) => `${prefix}${(count++).toString(36)}`;
    const values = [
      () => tag('zq9'),
      () => `first: ${tag('zq9')}\nsecond: ${tag('zq9')}`,
      () => `a "quoted" ${tag('zq9')} 'x' # not a comment`,
      () => `kind: Secret\ndata:\n  inner: ${tag('zq9')}`,
      () => `{"pw":"${tag('zq9')}"}`,
      () => `[1]${tag('zq9')}`,
      () => `---\n${tag('zq9')}`,
      () => `# ${tag('zq9')}`,
    ];
    const names = [
      'DATABASE_URL',
      'data',
      'stringData',
      'kind',
      'apiVersion',
      'password',
      'tls.crt',
    ];
    const secret = (kind: boolean): Record<string, unknown> => {
      const start = random(4);
      const data = Object.fromEntries(
        names.slice(start, start + 1 + random(3)).map(name => [name, pick(values)()])
      );
      return {
        ...(kind ? { apiVersion: 'v1', kind: 'Secret' } : {}),
        metadata: { name: 'db' },
        type: 'Opaque',
        [random(3) ? 'data' : 'stringData']: data,
      };
    };
    const configMap = () => ({
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'cm' },
      data: { color: tag('cm7') },
    });
    const objects = [
      () => secret(true),
      () => secret(false),
      () => ({ apiVersion: 'v1', kind: 'SecretList', items: [secret(false), secret(false)] }),
      () => ({ apiVersion: 'v1', kind: 'List', items: [configMap(), secret(true)] }),
      configMap,
    ];
    // Keys in kubectl's sorted order or in any order.
    const order = (value: unknown, sorted: boolean): unknown => {
      if (Array.isArray(value)) return value.map(item => order(item, sorted));
      if (!value || typeof value !== 'object') return value;
      const keys = Object.keys(value);
      if (sorted) keys.sort();
      else for (let i = keys.length - 1; i > 0; i--) keys.push(...keys.splice(random(i + 1), 1));
      return Object.fromEntries(
        keys.map(key => [key, order((value as Record<string, unknown>)[key], sorted)])
      );
    };
    const scalar = (text: string, pad: string): string => {
      const style = random(4);
      if (style === 0 && /^[\w./-]+$/.test(text)) return ` ${text}`;
      if (style === 1)
        return ` |\n${text
          .split('\n')
          .map(line => `${pad}  ${line}`)
          .join('\n')}`;
      if (style === 2) return ` ${JSON.stringify(text).split(' ').join(`\n${pad}  `)}`;
      return ` '${text.replace(/'/g, "''").replace(/\n/g, `\n\n${pad}  `)}'`;
    };
    // A kind written in any way YAML reads as the same kind.
    const kindStyles = [
      (kind: string, pad: string) => `${pad}kind: "${kind.replace('e', '\\u0065')}"`,
      (kind: string, pad: string) => `${pad}kind: "${kind.replace('i', '\\x69')}"`,
      (kind: string, pad: string) => `${pad}kind: |\n${pad}  ${kind}`,
      (kind: string, pad: string) => `${pad}kind: ${kind.slice(0, 3)}\n${pad}  ${kind.slice(3)}`,
      (kind: string, pad: string) => `${pad}x-kind: &kind ${kind}\n${pad}kind: *kind`,
      (kind: string, pad: string) => `${pad}? kind\n${pad}: ${kind}`,
    ];
    const key = (name: string) => pick([name, name, `'${name}'`, `"${name}"`]);
    const yaml = (value: Record<string, unknown>, pad: string): string =>
      Object.entries(value)
        .map(([name, item]) => {
          if (Array.isArray(item)) {
            const entries = item.map(entry => `${pad}- ${yaml(entry, `${pad}  `).trimStart()}`);
            return `${pad}${key(name)}:\n${entries.join('\n')}`;
          }
          if (item && typeof item === 'object') {
            return `${pad}${key(name)}:\n${yaml(item as Record<string, unknown>, `${pad}  `)}`;
          }
          // kubectl writes kind and apiVersion as plain words.
          const word = /^[\w./-]+$/.test(String(item));
          if (word && name === 'kind' && random(2)) return pick(kindStyles)(String(item), pad);
          if (word && (name === 'kind' || name === 'apiVersion'))
            return `${pad}${name}: ${String(item)}`;
          return `${pad}${key(name)}:${scalar(String(item), pad)}`;
        })
        .join('\n');
    // Credentials written in other shapes, as JSON and YAML allow them.
    const credentials = [
      () => `{"token":{"kind":"Bearer","value":"${tag('zq9')}"}}`,
      () => `{"secret":{"value":"${tag('zq9')}"}}`,
      () => `'password': ${tag('zq9')}\nuser: db`,
      () => `data: {DATABASE_URL: ${tag('zq9')}}`,
      () => `{kind: Secret, "data": {A: ${tag('zq9')}}}`,
      () => `password: &v ${tag('zq9')}\nx: *v`,
      () => `token: x {"a":\n"${tag('zq9')}"}\nnext`,
    ];
    const leaked: string[] = [];
    const changed: string[] = [];
    for (let n = 0; n < 1000; n++) {
      const value = order(pick(objects)(), random(2) === 0) as Record<string, unknown>;
      let json = false;
      const rendered = random(8)
        ? pick([
            () => {
              json = true;
              return JSON.stringify(value, null, random(2) * 2);
            },
            () => `${yaml(value, '')}\n`,
            () =>
              dump(value, {
                flowLevel: random(3) - 1,
                quotingType: pick(["'", '"'] as const),
                forceQuotes: random(2) === 0,
              }),
          ])()
        : pick(credentials)();
      const wrapped = pick([
        () => rendered,
        () => `Output:\n${rendered}`,
        () => JSON.stringify([{ type: 'text', text: rendered }]),
        () => rendered.replace(/\n/g, '\r\n'),
      ])();
      const cut = random(2) === 0;
      const input = cut ? wrapped.slice(0, random(wrapped.length + 1)) : wrapped;
      const out = redactSecrets(input);
      if (out.includes('zq9')) leaked.push(input);
      // A ConfigMap keeps its data, unless it's YAML whose data comes before the
      // apiVersion and kind, which could be the data of an object before it.
      const keys = Object.keys(value);
      const typed =
        Math.min(keys.indexOf('apiVersion'), keys.indexOf('kind')) < keys.indexOf('data');
      if (
        !cut &&
        value.kind === 'ConfigMap' &&
        rendered.includes('cm7') &&
        (json || typed) &&
        !out.includes(String((value.data as Record<string, string>).color))
      ) {
        changed.push(input);
      }
    }
    expect(leaked).toEqual([]);
    expect(changed).toEqual([]);
  });

  it('scans adversarial bracket input in linear time', () => {
    const inputs = [
      `kind: Secret\n${'{'.repeat(100_000)}`,
      `kind: Secret\n${'[a]'.repeat(50_000)}`,
      `kind: Secret\n${'{"a":'.repeat(30_000)}`,
      `kind: Secret\n${'['.repeat(50_000)}${']'.repeat(50_000)}`,
      // Nested regions that only turn out not to be JSON at their very end.
      `kind: Secret\n${'[1,'.repeat(30_000)}[]${'x]'.repeat(30_000)}`,
      `kind: Secret\n${'[x '.repeat(30_000)}{}${' {}]'.repeat(30_000)}`,
      // Quotes that pair up differently depending on where a value starts.
      `kind: Secret\n${'["'.repeat(50_000)}`,
      `kind: Secret\n${'"['.repeat(50_000)}`,
      `kind: Secret\n${'{"a":["'.repeat(20_000)}`,
      `kind: Secret\n${'["\\"'.repeat(30_000)}`,
      // Data objects that never close.
      `kind: Secret\n${'"data":{'.repeat(50_000)}`,
      `kind: Secret\n${'"data":{"a":"'.repeat(30_000)}`,
      `kind: Secret\n${'"data": {"a":1]'.repeat(30_000)}`,
      // Escaped Secret JSON in strings, also nested and cut off.
      `kind: Secret\n${'"\\"data\\":{" '.repeat(30_000)}`,
      `kind: Secret\n"${'\\"data\\":{\\"a\\":\\"'.repeat(20_000)}`,
      `kind: Secret\n"${'\\\\\\"data\\\\\\":{'.repeat(15_000)}`,
      `kind: Secret\n${'"\\'.repeat(50_000)}`,
      // Escaped quotes in a string that a line break cuts off, also with a backslash
      // right before the line break.
      `kind: Secret\n"${'\\"'.repeat(200_000)}\nend`,
      `kind: Secret\n"${'\\"'.repeat(200_000)}\\\nend`,
      // Blank lines around YAML, and many short strings and values.
      `kind: Secret\n${'\n'.repeat(300_000)}x`,
      `apiVersion: v1\ndata:\n${' \n'.repeat(150_000)}`,
      `kind: Secret\n${'"a" '.repeat(100_000)}`,
      `kind: Secret\n${'[] "'.repeat(100_000)}`,
      `{"kind":"Secret","data":{${'"k":"v",'.repeat(50_000)}"k":"v"}}`,
      // YAML: quotes that don't close, entries, indentation, repeated keys, blocks.
      `kind: Secret\ndata:\n${'  a: "\n'.repeat(50_000)}`,
      `kind: Secret\n${'- '.repeat(50_000)}a: b`,
      `kind: Secret\n${'data:\n  a: b\n'.repeat(50_000)}`,
      `kind: Secret\n${' '.repeat(100_000)}a: b`,
      `kind: Secret\na${' '.repeat(100_000)}: b`,
      `kind: Secret\ndata:\n${'  a: |\n    x\n'.repeat(30_000)}`,
      `x: |\n${'  kind: Secret\n  data:\n    a: |\n'.repeat(10_000)}`,
      `kind: Secret\n${'token: "\n  x\n'.repeat(30_000)}`,
      `kind: Secret\n${'a: "x\n'.repeat(50_000)}`,
    ];
    for (const input of inputs) {
      const start = performance.now();
      redactSecrets(input);
      expect(performance.now() - start).toBeLessThan(500);
    }
  });

  it('redacts a real apiserver SecretList response (items omit their own kind)', () => {
    // This is the shape returned by `GET /api/v1/namespaces/{ns}/secrets`,
    // as opposed to `kubectl -o json`'s generic `kind: List` wrapper above.
    const secretList = JSON.stringify({
      kind: 'SecretList',
      apiVersion: 'v1',
      metadata: { resourceVersion: '12345' },
      items: [
        {
          metadata: { name: 'db-credentials', namespace: 'default' },
          data: {
            DATABASE_PASSWORD: 'aHVudGVyMg==',
            session: 'czNjcjN0LXNlc3Npb24ta2V5',
          },
          type: 'Opaque',
        },
      ],
    });
    const out = redactSecrets(secretList);
    expect(out).not.toContain('aHVudGVyMg==');
    expect(out).not.toContain('czNjcjN0LXNlc3Npb24ta2V5');
    expect(out).toContain('[REDACTED]');
    expect(out).toContain('"name": "db-credentials"');
  });

  it('redacts a real apiserver SecretList response in YAML (`-o yaml` shape)', () => {
    // Same SecretList shape as above but as the YAML `kubectl get secrets -o
    // yaml` would render it: a single document, top-level `kind: SecretList`,
    // with secrets nested under `items` (no `---` document separators).
    const secretList = [
      'apiVersion: v1',
      'kind: SecretList',
      'metadata:',
      '  resourceVersion: "12345"',
      'items:',
      '- metadata:',
      '    name: db-credentials',
      '    namespace: default',
      '  data:',
      '    DATABASE_PASSWORD: aHVudGVyMg==',
      '    session: czNjcjN0LXNlc3Npb24ta2V5',
      '  type: Opaque',
    ].join('\n');
    const out = redactSecrets(secretList);
    expect(out).not.toContain('aHVudGVyMg==');
    expect(out).not.toContain('czNjcjN0LXNlc3Npb24ta2V5');
    expect(out).toContain('DATABASE_PASSWORD: [REDACTED]');
    expect(out).toContain('session: [REDACTED]');
    expect(out).toContain('name: db-credentials');
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

describe('redactSecrets with JSON and YAML read by a parser', () => {
  it('reads kinds and keys the way YAML does, also escaped or behind an alias', () => {
    const inputs = [
      'apiVersion: v1\nkind: "Se\\u0063ret"\ndata:\n  DATABASE_URL: zq9a\n',
      'apiVersion: v1\nkind: "Secr\\x65t"\ndata:\n  DATABASE_URL: zq9b\n',
      'apiVersion: v1\nmetadata:\n  name: &secretKind Secret\nkind: *secretKind\ndata:\n  A: zq9c\n',
      "'password': zq9d\nuser: db",
      '{kind: Secret, "data": {DATABASE_URL: zq9e}}',
      'data: {DATABASE_URL: zq9f}',
      'kind: Secret\nstringData:\n  config: |\n    ---\n    zq9g\n',
      'kind: Secret\nstringData:\n  token: |\n    # zq9h\n',
      '? kind\n: Secret\ndata:\n  A: zq9i\n',
    ];
    for (const input of inputs) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
  });

  it('redacts data without a kind that the output cut off at the end of a line', () => {
    expect(redactSecrets('data:\n  DATABASE_URL: zq9private\n')).toBe(
      'data:\n  DATABASE_URL: [REDACTED]\n'
    );
  });

  it('redacts every value of a credential that is an object, also one with a kind', () => {
    expect(JSON.parse(redactSecrets('{"token":{"kind":"Bearer","value":"zq9a"}}'))).toEqual({
      token: { kind: '[REDACTED]', value: '[REDACTED]' },
    });
    expect(JSON.parse(redactSecrets('{"secret":{"value":"zq9b"}}'))).toEqual({
      secret: { value: '[REDACTED]' },
    });
  });

  it('withholds YAML with anchors when it holds anything to redact', () => {
    expect(redactSecrets('password: &v zq9a\nx: *v')).toBe('[REDACTED]');
    // Anchors in YAML without credentials or Secret data are fine.
    const configMap = 'kind: ConfigMap\ndata:\n  a: &v blue\n  b: *v\n';
    expect(redactSecrets(configMap)).toBe(configMap);
  });

  it('keeps withholding text it cannot read up to the next fence', () => {
    const input = [
      'Result:',
      'data:',
      '  token: |',
      '    [1]zq9a',
      '  DB: zq9b',
      '{"x":1}',
      'more zq9c',
      '```json',
      '{"kind":"ConfigMap","data":{"color":"blue"}}',
      '```',
    ].join('\n');
    const out = redactSecrets(input);
    expect(out).not.toContain('zq9');
    expect(out).toContain('"color":"blue"');
  });

  it('withholds what follows YAML with Secret data that stops at a line it cannot read', () => {
    const input = [
      'kind: Secret',
      'data:',
      '  a: zq9a',
      'end of a value that was not indented',
      '  b: zq9b',
    ].join('\n');
    expect(redactSecrets(input)).not.toContain('zq9');
  });

  it('redacts the rest of a credential whose label YAML reads as part of a key', () => {
    const input =
      'api_key=zq9a {"x":1} zq9b {"data":{"items":"line1\\n  private-value: zq9c\\nend"}}';
    expect(redactSecrets(input)).not.toContain('zq9');
  });

  it('leaves out a key the output cut off, so it cannot hide an earlier value', () => {
    expect(redactSecrets('{"data":{"tls.crt":"zq9a","tls.crt')).not.toContain('zq9');
    // A cut-off word that isn't JSON is still there to redact.
    expect(redactSecrets('```yaml\n{"data": {"a": zq9b')).not.toContain('zq9');
  });

  it('redacts the data of an object that comes right before a ConfigMap without ---', () => {
    const merged =
      'data: {session: zq9a}\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\n';
    expect(redactSecrets(merged)).not.toContain('zq9');
    // A ConfigMap that starts with its apiVersion or kind keeps its data, in YAML and JSON.
    const yaml = 'apiVersion: v1\ndata:\n  color: blue\nkind: ConfigMap\n';
    expect(redactSecrets(yaml)).toBe(yaml);
    const json = '{"data":{"color":"blue"},"kind":"ConfigMap"}';
    expect(redactSecrets(json)).toBe(json);
  });

  it('keeps the patterns from joining lines of JSON in strings', () => {
    const text = 'client-key-data: zq9a\n\ntoken: {"value":"zq9b"}';
    const nested = JSON.stringify([
      { type: 'text', text: JSON.stringify([{ type: 'text', text }]) },
    ]);
    expect(redactSecrets(nested)).not.toContain('zq9');
  });

  it('reads output with Windows line endings', () => {
    const input = 'Result:\r\ndata:\r\n  token: |\r\n    [1]zq9a\r\n  DB: zq9b\r\n';
    expect(redactSecrets(input)).not.toContain('zq9');
  });

  it('keeps the output of the patterns when it reads back as the redacted value', () => {
    // Text around a credential stays as it was.
    expect(redactSecrets('pod: nginx\ntoken: zq9a  # note\nnamespace: default')).toBe(
      'pod: nginx\ntoken: [REDACTED]\nnamespace: default'
    );
    expect(redactSecrets('{"x-api-key": "zq9b", "name": "x"}')).toBe(
      '{"x-api-key": "[REDACTED]", "name": "x"}'
    );
    // A credential that isn't a string or number stays, and so does the JSON around it.
    const flag = '{"password":true,"name":"x"}';
    expect(redactSecrets(flag)).toBe(flag);
  });

  it('redacts credentials whose key names them in camelCase or as credentials', () => {
    const json = '{"refreshToken":"zq9a","idToken":"zq9b","credentials":{"user":"zq9c"}}';
    expect(JSON.parse(redactSecrets(json))).toEqual({
      refreshToken: '[REDACTED]',
      idToken: '[REDACTED]',
      credentials: { user: '[REDACTED]' },
    });
    expect(redactSecrets('sessionToken: zq9d\ncredential: zq9e\n')).not.toContain('zq9');
    for (const input of [
      '{"secret_key":"zq9f"}',
      'secret_key=zq9g',
      '{"secretKey":"zq9h","signing-key":"zq9i"}',
      'encryptionKey: zq9j',
    ]) {
      expect(redactSecrets(input)).not.toContain('zq9');
    }
    // A Pod's volumes and flags that only look like credentials stay as they are.
    const pod = JSON.stringify({
      kind: 'Pod',
      spec: {
        automountServiceAccountToken: false,
        volumes: [
          {
            name: 'api',
            projected: {
              sources: [{ serviceAccountToken: { expirationSeconds: 3607, path: 'token' } }],
            },
          },
        ],
      },
    });
    expect(redactSecrets(pod)).toBe(pod);
  });

  it('runs in linear time on long credential lines, block scalars and brackets', () => {
    const inputs = [
      'token: x '.repeat(100_000),
      `metadata: |\n${'  x\n'.repeat(200_000)}`,
      '[\n'.repeat(50_000) + '}',
      `data:\n${'[1]\n'.repeat(50_000)}`,
      `{"kind":"Secret","data":{${'"k":"v",'.repeat(50_000)}`,
      '"password": "' + 'a\\"'.repeat(50_000),
    ];
    for (const input of inputs) {
      const start = performance.now();
      expect(redactSecrets(input)).not.toContain('zq9');
      expect(performance.now() - start).toBeLessThan(500);
    }
  });
});

describe('redactSecretsInValue', () => {
  it('redacts data fields of a parsed Secret object', () => {
    const value = {
      kind: 'Secret',
      metadata: { name: 'db-credentials' },
      data: { DATABASE_PASSWORD: 'aHVudGVyMg==' },
    };
    const out = redactSecretsInValue(value) as any;
    expect(out.data.DATABASE_PASSWORD).toBe('[REDACTED]');
    expect(out.metadata.name).toBe('db-credentials');
  });

  it('redacts data fields of items in a parsed SecretList object', () => {
    const value = {
      kind: 'SecretList',
      items: [
        {
          metadata: { name: 'db-credentials', namespace: 'default' },
          data: { DATABASE_PASSWORD: 'aHVudGVyMg==', session: 'czNjcjN0LXNlc3Npb24ta2V5' },
        },
      ],
    };
    const out = redactSecretsInValue(value) as any;
    expect(out.items[0].data.DATABASE_PASSWORD).toBe('[REDACTED]');
    expect(out.items[0].data.session).toBe('[REDACTED]');
    expect(out.items[0].metadata.name).toBe('db-credentials');
  });

  it('withholds a value whose properties throw when read', () => {
    const value = {
      get secret(): string {
        throw new Error('boom');
      },
    };
    expect(redactSecretsInValue(value)).toBe('[REDACTED]');
  });

  it('redacts tokens used as keys in Secret data', () => {
    const key = `ghp_${'a'.repeat(36)}`;
    expect(redactSecretsInValue({ kind: 'Secret', data: { [key]: 'x' } })).toEqual({
      kind: 'Secret',
      data: { '[REDACTED]': '[REDACTED]' },
    });
  });

  it('redacts tokens used as keys and credentials that are objects', () => {
    const key = `ghp_zq9${'a'.repeat(30)}`;
    expect(redactSecretsInValue({ [key]: 'active' })).toEqual({ '[REDACTED]': 'active' });
    expect(redactSecretsInValue({ token: { value: 'zq9a', ok: true } })).toEqual({
      token: { value: '[REDACTED]', ok: true },
    });
    const volume = { secret: { secretName: 'db-creds' } };
    expect(redactSecretsInValue(volume)).toEqual({ secret: { secretName: '[REDACTED]' } });
  });
});

describe('tool output confidentiality', () => {
  it.each(['clientKey', 'clientKeyData', 'client_key_data', 'client-key-data'])(
    'redacts %s in parsed results and diagnostics',
    key => {
      const record = { [key]: 'sample-value', status: 'ready' };
      expect(redactSecretsInValue(record)).toEqual({ ...record, [key]: '[REDACTED]' });
      expect(JSON.parse(redactSecrets(JSON.stringify(record)))).toEqual(
        redactSecretsInValue(record)
      );
      expect(redactSecrets('Could not read ' + key + ': "sample-value" (invalid)')).not.toContain(
        'sample-value'
      );
    }
  );

  it('preserves public YAML fields when discarding comments', () => {
    const result = redactSecrets('# token: sample-value\nmetadata: ready');
    expect(result).toContain('ready');
    expect(result).not.toContain('sample-value');
  });

  it('keeps indented Markdown inside a multiline YAML value', () => {
    const document = [
      'Tool output',
      'kind: Secret',
      'stringData:',
      '  note: |',
      '    sample first line',
      '    ```text',
      '    sample second line',
      '    ```',
    ].join('\n');
    expect(redactSecrets(document)).not.toMatch(/sample (first|second) line/);
  });

  it('withholds documents exceeding the shared scalar scanning allowance', () => {
    const document = [
      'metadata: &description ' + 'public description '.repeat(100),
      ...Array.from({ length: 100 }, (_, i) => 'field' + i + ': *description'),
    ].join('\n');
    expect(redactSecrets(document)).toBe('[REDACTED]');
  });

  it('preserves projected service account references only in a Pod volume', () => {
    const source = { serviceAccountToken: { path: 'token' } };
    expect(redactSecretsInValue(source)).toEqual({ serviceAccountToken: { path: '[REDACTED]' } });
    const pod = { kind: 'Pod', spec: { volumes: [{ projected: { sources: [source] } }] } };
    expect(redactSecretsInValue(pod)).toEqual(pod);
  });
});

describe('Pod templates in workload results', () => {
  const template = {
    spec: { volumes: [{ name: 'settings', secret: { secretName: 'settings-ref' } }] },
  };
  it.each([
    { kind: 'Deployment', spec: { template } },
    { kind: 'Job', spec: { template } },
    { kind: 'CronJob', spec: { jobTemplate: { spec: { template } } } },
    { kind: 'PodTemplate', template },
  ])('retains volume references in $kind', resource => {
    expect(redactSecretsInValue(resource)).toEqual(resource);
    expect(JSON.parse(redactSecrets(JSON.stringify(resource)))).toEqual(resource);
  });
  it('continues redacting a similarly shaped object in an unrelated resource', () => {
    const resource = { kind: 'Example', spec: { template } };
    expect(JSON.stringify(redactSecretsInValue(resource))).not.toContain('settings-ref');
  });
});
