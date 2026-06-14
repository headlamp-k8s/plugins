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
import { buildKubectlArgs, createKubectlTool } from './kubectl.js';

describe('createKubectlTool', () => {
  it('returns a tool with the correct name and schema', () => {
    const tool = createKubectlTool();
    expect(tool.name).toBe('kubernetes_api_request');
    expect(tool.description).toContain('Kubernetes API');
  });

  it('defaults to read-only mode', () => {
    const tool = createKubectlTool();
    expect(tool.description).toContain('Only GET is supported');
    expect(tool.description).not.toContain('delete');
  });

  it('allows mutations when readOnly is false', () => {
    const tool = createKubectlTool({ readOnly: false });
    expect(tool.description).toContain('DELETE');
    expect(tool.description).toContain('POST');
  });
});

describe('buildKubectlArgs', () => {
  it('GET produces kubectl get --raw <url>', () => {
    const result = buildKubectlArgs('/api/v1/pods', 'GET');
    expect(result.args).toEqual(['get', '--raw', '/api/v1/pods']);
    expect(result.input).toBeUndefined();
  });

  it('GET is case-insensitive', () => {
    const result = buildKubectlArgs('/api/v1/pods', 'get');
    expect(result.args).toEqual(['get', '--raw', '/api/v1/pods']);
  });

  it('POST produces kubectl create --raw with stdin', () => {
    const body = '{"apiVersion":"v1","kind":"Pod"}';
    const result = buildKubectlArgs('/api/v1/namespaces/default/pods', 'POST', body);
    expect(result.args).toEqual(['create', '--raw', '/api/v1/namespaces/default/pods', '-f', '-']);
    expect(result.input).toBe(body);
  });

  it('PUT produces kubectl replace --raw with stdin', () => {
    const body = '{"spec":{"replicas":3}}';
    const result = buildKubectlArgs('/api/v1/namespaces/default/deployments/app', 'PUT', body);
    expect(result.args).toEqual([
      'replace',
      '--raw',
      '/api/v1/namespaces/default/deployments/app',
      '-f',
      '-',
    ]);
    expect(result.input).toBe(body);
  });

  it('DELETE produces kubectl delete --raw without stdin', () => {
    const result = buildKubectlArgs('/api/v1/namespaces/default/pods/my-pod', 'DELETE');
    expect(result.args).toEqual(['delete', '--raw', '/api/v1/namespaces/default/pods/my-pod']);
    expect(result.input).toBeUndefined();
  });

  it('PATCH produces kubectl patch --raw with stdin', () => {
    const body = '{"metadata":{"labels":{"env":"prod"}}}';
    const result = buildKubectlArgs('/api/v1/namespaces/default/pods/my-pod', 'PATCH', body);
    expect(result.args).toEqual([
      'patch',
      '--raw',
      '/api/v1/namespaces/default/pods/my-pod',
      '-f',
      '-',
    ]);
    expect(result.input).toBe(body);
  });

  it('throws on unsupported method', () => {
    expect(() => buildKubectlArgs('/api/v1/pods', 'OPTIONS')).toThrow(
      'Method OPTIONS is not allowed'
    );
  });

  it('rejects URLs that do not start with /', () => {
    expect(() => buildKubectlArgs('--kubeconfig=/tmp/evil', 'GET')).toThrow(
      'Invalid API path: must start with "/"'
    );
  });

  it('rejects relative paths', () => {
    expect(() => buildKubectlArgs('api/v1/pods', 'GET')).toThrow(
      'Invalid API path: must start with "/"'
    );
  });

  it('rejects paths with newlines or control characters', () => {
    expect(() => buildKubectlArgs('/api/v1/pods\n--kubeconfig=/tmp/evil', 'GET')).toThrow(
      'contains disallowed characters'
    );
  });

  it('rejects paths with shell metacharacters', () => {
    expect(() => buildKubectlArgs('/api/v1/pods;echo hacked', 'GET')).toThrow(
      'contains disallowed characters'
    );
  });
});

describe('buildKubectlArgs read-only enforcement', () => {
  const readOnlyMethods = new Set(['GET']);

  it('allows GET in read-only mode', () => {
    const result = buildKubectlArgs('/api/v1/pods', 'GET', undefined, readOnlyMethods);
    expect(result.args).toEqual(['get', '--raw', '/api/v1/pods']);
  });

  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])('rejects %s in read-only mode', method => {
    expect(() =>
      buildKubectlArgs('/api/v1/namespaces/default/pods', method, undefined, readOnlyMethods)
    ).toThrow(`Method ${method} is not allowed`);
  });
});
