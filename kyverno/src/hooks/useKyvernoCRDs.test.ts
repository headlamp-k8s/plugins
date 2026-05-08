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

import { renderHook, waitFor } from '@testing-library/react';
import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { useKyvernoCRDs } from './useKyvernoCRDs';

describe('useKyvernoCRDs', () => {
  beforeEach(() => {
    vitest.clearAllMocks();
    vitest.spyOn(ApiProxy, 'request');
    vitest.spyOn(K8s, 'useCluster').mockReturnValue('default-cluster');
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  test('should set all CRDs to true when all API calls succeed', async () => {
    (ApiProxy.request as any).mockResolvedValue({});

    const { result } = renderHook(() => useKyvernoCRDs());

    expect(result.current.loading).toBe(true);

    // Wait for the async detect function to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify all CRDs are set to true
    expect(result.current).toEqual({
      legacy: true,
      cel: true,
      cleanup: true,
      reports: true,
      exceptions: true,
      loading: false,
    });

    // Verify that ApiProxy.request was called for all expected paths
    expect(ApiProxy.request).toHaveBeenCalledWith('/apis/kyverno.io/v1', expect.anything());
    expect(ApiProxy.request).toHaveBeenCalledWith('/apis/policies.kyverno.io/v1', expect.anything());
    expect(ApiProxy.request).toHaveBeenCalledWith('/apis/wgpolicyk8s.io/v1alpha2', expect.anything());
    expect(ApiProxy.request).toHaveBeenCalledWith('/apis/kyverno.io/v2', expect.anything());
  });

  test('should handle missing specific CRD (e.g., CEL fails)', async () => {
    // Mock response: Fail for CEL policies, succeed for others
    (ApiProxy.request as any).mockImplementation((path: string) => {
      if (path === '/apis/policies.kyverno.io/v1') {
        return Promise.reject(new Error('Not Found'));
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => useKyvernoCRDs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // cel should be false, others should be true
    expect(result.current).toEqual({
      legacy: true,
      cel: false,
      cleanup: true,
      reports: true,
      exceptions: true,
      loading: false,
    });
  });

  test('should not check v2 API if legacy API fails', async () => {
    // Mock response: Fail for legacy API, succeed for others
    (ApiProxy.request as any).mockImplementation((path: string) => {
      if (path === '/apis/kyverno.io/v1') {
        return Promise.reject(new Error('Not Found'));
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => useKyvernoCRDs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // legacy should be false, cleanup and exceptions should be false
    // v2 API should NOT be called
    expect(result.current).toEqual({
      legacy: false,
      cel: true, // we mock success for this
      cleanup: false,
      reports: true, // we mock success for this
      exceptions: false,
      loading: false,
    });

    expect(ApiProxy.request).toHaveBeenCalledWith('/apis/kyverno.io/v1', expect.anything());
    expect(ApiProxy.request).not.toHaveBeenCalledWith('/apis/kyverno.io/v2', expect.anything());
  });
});
