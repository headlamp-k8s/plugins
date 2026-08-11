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

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the callbacks passed to apiGet so tests can trigger them.
let onSuccess: (() => void) | undefined;
let onError: ((err: any) => void) | undefined;
let apiGetCluster: string | undefined;

// Default apiGet implementation: captures callbacks and returns a request
// function that resolves to a no-op cancel function.
function defaultApiGetImpl(
  _onGet: () => void,
  _name: string,
  _namespace: undefined,
  _onError: (err: any) => void,
  opts?: { cluster?: string }
) {
  onSuccess = _onGet;
  onError = _onError;
  apiGetCluster = opts?.cluster;
  return () => Promise.resolve(() => {});
}

// vi.hoisted ensures this is available when vi.mock's factory runs (hoisted).
const mockApiGet = vi.hoisted(() => vi.fn(defaultApiGetImpl));

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    apiGet: mockApiGet,
  },
}));

import { isKnativeInstalled } from './isKnativeInstalled';

describe('isKnativeInstalled', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiGet.mockImplementation(defaultApiGetImpl);
    onSuccess = undefined;
    onError = undefined;
    apiGetCluster = undefined;
  });

  it('returns true when the CRD is found', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    // Trigger the success callback
    onSuccess!();
    const result = await promise;
    expect(result).toBe(true);
  });

  it('returns false for a confirmed 404 (CRD absent)', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    // 404 means the CRD genuinely does not exist
    onError!({ status: 404, message: 'Not Found' });
    const result = await promise;
    expect(result).toBe(false);
  });

  it('does not classify a forbidden CRD probe as Knative absence', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    // 403 means RBAC denied the probe — not that the CRD is absent
    onError!({ status: 403, message: 'Forbidden' });
    const result = await promise;
    // The probe could not confirm absence, so it should not report false.
    expect(result).toBe(true);
  });

  it('does not classify a server error as Knative absence', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    onError!({ status: 500, message: 'Internal Server Error' });
    const result = await promise;
    expect(result).toBe(true);
  });

  it('does not classify an error callback without HTTP status as Knative absence', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    // Some API errors may not carry an HTTP status code
    onError!({ message: 'Network error' });
    const result = await promise;
    expect(result).toBe(true);
  });

  it('does not classify a null error callback as Knative absence', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    onError!(null);
    const result = await promise;
    expect(result).toBe(true);
  });

  it('returns false for empty clusters', async () => {
    const result = await isKnativeInstalled([]);
    expect(result).toBe(false);
  });

  it('passes the cluster option to apiGet', async () => {
    const promise = isKnativeInstalled(['my-cluster']);
    onSuccess!();
    await promise;
    expect(apiGetCluster).toBe('my-cluster');
  });

  it('returns true only when all clusters have the CRD', async () => {
    // Override mock to capture per-call callbacks
    const callbacks: Array<{ onSuccess: () => void; onError: (err: any) => void }> = [];
    mockApiGet.mockImplementation(
      (_onGet: () => void, _name: string, _namespace: undefined, _onError: (err: any) => void) => {
        callbacks.push({ onSuccess: _onGet, onError: _onError });
        return () => Promise.resolve(() => {});
      }
    );

    const promise = isKnativeInstalled(['cluster-a', 'cluster-b']);

    // Wait for apiGet calls to be set up
    await new Promise(resolve => setTimeout(resolve, 0));

    callbacks[0].onSuccess();
    callbacks[1].onSuccess();

    const result = await promise;
    expect(result).toBe(true);
  });

  it('returns false when any cluster confirms CRD absence via 404', async () => {
    const callbacks: Array<{ onSuccess: () => void; onError: (err: any) => void }> = [];
    mockApiGet.mockImplementation(
      (_onGet: () => void, _name: string, _namespace: undefined, _onError: (err: any) => void) => {
        callbacks.push({ onSuccess: _onGet, onError: _onError });
        return () => Promise.resolve(() => {});
      }
    );

    const promise = isKnativeInstalled(['cluster-a', 'cluster-b']);

    await new Promise(resolve => setTimeout(resolve, 0));

    callbacks[0].onSuccess(); // cluster-a has CRD
    callbacks[1].onError({ status: 404, message: 'Not Found' }); // cluster-b confirmed absent

    const result = await promise;
    expect(result).toBe(false);
  });

  it('settles only once even if both success and error callbacks fire', async () => {
    const promise = isKnativeInstalled(['cluster-a']);
    onSuccess!();
    // Second call should be ignored due to settle guard
    onError!({ status: 404, message: 'Not Found' });
    const result = await promise;
    expect(result).toBe(true);
  });
});
