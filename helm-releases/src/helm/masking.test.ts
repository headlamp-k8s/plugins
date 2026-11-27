/*
 * Copyright 2026 The Kubernetes Authors
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
import { isSensitiveKey, ManifestMaskError, MASK, maskManifest, maskValues } from './masking';

describe('isSensitiveKey', () => {
  it.each([
    'password',
    'adminPassword',
    'DB_PASSWD',
    'passphrase',
    'clientSecret',
    'secrets',
    'token',
    'bearerToken',
    'credentials',
    'apiKey',
    'api_key',
    'privateKey',
    'accessKey',
    'secretKey',
    'sshKey',
    'authorization',
    'connectionString',
  ])('hides the value of %s', key => {
    expect(isSensitiveKey(key)).toBe(true);
  });

  it.each([
    'replicaCount',
    'key',
    'username',
    'secretName',
    'existingSecret',
    'passwordFile',
    'tokenPath',
    'secretKeyRef',
    'imagePullSecrets',
    'secretAnnotations',
    'createSecretEnabled',
  ])('shows the value of %s', key => {
    expect(isSensitiveKey(key)).toBe(false);
  });
});

describe('maskValues', () => {
  it('masks what sits under a sensitive key and keeps the rest', () => {
    const { value, hidden } = maskValues({
      replicaCount: 2,
      auth: { username: 'admin', password: 'hunter2', existingSecret: 'web-auth' },
      secrets: { DB_URL: 'postgres://db', PIN: 1234, nested: { deep: ['a', 'b'] } },
      image: { tag: '1.27' },
    });

    expect(value).toEqual({
      replicaCount: 2,
      auth: { username: 'admin', password: MASK, existingSecret: 'web-auth' },
      secrets: { DB_URL: MASK, PIN: MASK, nested: { deep: [MASK, MASK] } },
      image: { tag: '1.27' },
    });
    expect(hidden).toBe(5);
  });

  it('keeps the values that carry no secret visible, so the structure stays readable', () => {
    const values = { secret: { create: true, value: '', annotations: {}, ttl: null } };

    expect(maskValues(values)).toEqual({ value: values, hidden: 0 });
  });

  it('masks the sensitive environment variables given as name and value', () => {
    const { value } = maskValues({
      extraEnv: [
        { name: 'LOG_LEVEL', value: 'debug' },
        { name: 'DB_PASSWORD', value: 'hunter2' },
        { name: 'API_TOKEN', valueFrom: { secretKeyRef: { name: 'web', key: 'token' } } },
      ],
    });

    expect(value).toEqual({
      extraEnv: [
        { name: 'LOG_LEVEL', value: 'debug' },
        { name: 'DB_PASSWORD', value: MASK },
        { name: 'API_TOKEN', valueFrom: { secretKeyRef: { name: 'web', key: 'token' } } },
      ],
    });
  });

  it('masks the values that are credentials whatever their key', () => {
    const { value, hidden } = maskValues({
      tls: { key: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----' },
      database: { url: 'postgres://app:hunter2@db.internal:5432/app' },
      homepage: 'https://example.org/docs',
    });

    expect(value).toEqual({
      tls: { key: MASK },
      database: { url: MASK },
      homepage: 'https://example.org/docs',
    });
    expect(hidden).toBe(2);
  });

  it('leaves the given values untouched', () => {
    const values = { auth: { password: 'hunter2' } };

    maskValues(values);

    expect(values).toEqual({ auth: { password: 'hunter2' } });
  });
});

describe('maskManifest', () => {
  const manifest = [
    '---',
    '# Source: web/templates/secret.yaml',
    'apiVersion: v1',
    'kind: Secret',
    'metadata:',
    '  name: web-auth',
    'data:',
    '  password: aHVudGVyMg==',
    'stringData:',
    '  config.yaml: |',
    '    user: admin',
    '    pass: hunter2',
    '---',
    '# Source: web/templates/deployment.yaml',
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    '  name: web',
    'spec:',
    '  template:',
    '    spec:',
    '      automountServiceAccountToken: true',
    '      containers:',
    '        - name: web',
    '          env:',
    '            - name: DB_PASSWORD',
    '              value: hunter2',
    '            - name: LOG_LEVEL',
    '              value: debug',
    '          volumeMounts:',
    '            - name: auth',
    '              mountPath: /etc/auth',
    '      volumes:',
    '        - name: auth',
    '          secret:',
    '            secretName: web-auth',
    '            defaultMode: 0440',
    '',
  ].join('\n');

  it('hides the content of the Secrets and the sensitive variables', () => {
    const { value, hidden } = maskManifest(manifest);

    expect(value).not.toContain('hunter2');
    expect(value).not.toContain('aHVudGVyMg==');
    expect(value).toContain(`password: "${MASK}"`);
    expect(value).toContain(`config.yaml: "${MASK}"`);
    expect(value).toContain(`value: "${MASK}"`);
    expect(hidden).toBe(3);
  });

  it('prints everything else as Helm rendered it', () => {
    const { value } = maskManifest(manifest);

    expect(value).toContain('# Source: web/templates/secret.yaml');
    expect(value).toContain('# Source: web/templates/deployment.yaml');
    expect(value).toContain('kind: Deployment');
    expect(value).toContain('automountServiceAccountToken: true');
    expect(value).toContain('value: debug');
    // References to a Secret are not secrets, and scalars are not reinterpreted.
    expect(value).toContain('secretName: web-auth');
    expect(value).toContain('defaultMode: 0440');
    expect(value.match(/^---$/gm)).toHaveLength(1);
  });

  it('has nothing to hide in a manifest without credentials', () => {
    const { value, hidden } = maskManifest('apiVersion: v1\nkind: ConfigMap\ndata:\n  a: b\n');

    expect(hidden).toBe(0);
    expect(value).toBe('apiVersion: v1\nkind: ConfigMap\ndata:\n  a: b\n');
  });

  it('handles an empty manifest', () => {
    expect(maskManifest('')).toEqual({ value: '', hidden: 0 });
  });

  it('refuses a manifest it cannot parse rather than showing it unmasked', () => {
    expect(() => maskManifest('kind: Secret\ndata: {password: [unclosed\n')).toThrow(
      ManifestMaskError
    );
  });
});
