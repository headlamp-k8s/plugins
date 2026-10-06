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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKyvernoCRDs } from './useKyvernoCRDs';

const { request, useCluster } = vi.hoisted(() => ({
  request: vi.fn(),
  useCluster: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request },
  K8s: { useCluster },
}));

let clusterNumber = 0;

beforeEach(() => {
  request.mockReset();
  useCluster.mockReturnValue(`test-cluster-${clusterNumber++}`);
});

async function probe() {
  const hook = renderHook(() => useKyvernoCRDs());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

function resolveAllGroups() {
  request.mockResolvedValue({});
}

describe('useKyvernoCRDs', () => {
  it('reports all API groups as available after successful discovery', async () => {
    resolveAllGroups();

    const { result, unmount } = await probe();

    expect(result.current).toMatchObject({
      legacy: true,
      cel: true,
      cleanup: true,
      reports: true,
      exceptions: true,
      kyvernoV2Reports: true,
      ephemeralReports: true,
    });
    unmount();
  });

  it('only treats a confirmed 404 as absence and skips the v2 probe', async () => {
    request.mockImplementation((path: string) => {
      if (path === '/apis/kyverno.io/v1') return Promise.reject({ status: 404 });
      return Promise.resolve({});
    });

    const { result, unmount } = await probe();

    expect(result.current).toMatchObject({
      legacy: false,
      cleanup: false,
      exceptions: false,
      kyvernoV2Reports: false,
    });
    expect(request).not.toHaveBeenCalledWith('/apis/kyverno.io/v2', { method: 'GET' });
    unmount();
  });

  it.each([
    ['403 response', { status: 403 }],
    ['408 response', { status: 408 }],
    ['502 response', { status: 502 }],
    ['network failure', new Error('network failure')],
  ])('preserves a v2 %s as unknown', async (_name, error) => {
    request.mockImplementation((path: string) => {
      if (path === '/apis/kyverno.io/v2') return Promise.reject(error);
      return Promise.resolve({});
    });

    const { result, unmount } = await probe();

    expect(result.current).toMatchObject({
      legacy: true,
      cleanup: undefined,
      exceptions: undefined,
      kyvernoV2Reports: undefined,
    });
    expect(request).toHaveBeenCalledWith('/apis/kyverno.io/v2', { method: 'GET' });
    unmount();
  });

  it('probes v2 when the legacy probe is unknown', async () => {
    request.mockImplementation((path: string) => {
      if (path === '/apis/kyverno.io/v1') return Promise.reject({ status: 502 });
      return Promise.resolve({});
    });

    const { result, unmount } = await probe();

    expect(result.current).toMatchObject({
      legacy: undefined,
      cleanup: true,
      exceptions: true,
      kyvernoV2Reports: true,
    });
    expect(request).toHaveBeenCalledWith('/apis/kyverno.io/v2', { method: 'GET' });
    unmount();
  });

  it('keeps an unavailable group separate from available groups', async () => {
    request.mockImplementation((path: string) => {
      if (path === '/apis/wgpolicyk8s.io/v1alpha2') return Promise.reject({ status: 502 });
      return Promise.resolve({});
    });

    const { result, unmount } = await probe();

    expect(result.current).toMatchObject({
      legacy: true,
      cel: true,
      reports: undefined,
      ephemeralReports: true,
      cleanup: true,
    });
    unmount();
  });
});
