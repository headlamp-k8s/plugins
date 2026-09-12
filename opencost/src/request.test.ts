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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOpencostData } from './request';

const mockRequest = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: (...args: unknown[]) => mockRequest(...args),
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchOpencostData', () => {
  it('goes through the kube-apiserver service proxy for a plain service name', async () => {
    mockRequest.mockResolvedValue({ data: [] });

    await fetchOpencostData('opencost', 'http:opencost:9003', '1d', 'pod', true);

    expect(mockRequest).toHaveBeenCalledWith(
      '/api/v1/namespaces/opencost/services/http:opencost:9003/proxy/allocation?window=1d&aggregate=pod&step=1d&accumulate=true'
    );
  });

  it('fetches a configured http(s) URL directly, bypassing the apiserver proxy', async () => {
    const mockJson = vi.fn().mockResolvedValue({ data: [] });
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: mockJson });
    vi.stubGlobal('fetch', mockFetch);

    await fetchOpencostData('opencost', 'https://opencost.example.com', '1d', 'pod', true);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://opencost.example.com/allocation?window=1d&aggregate=pod&step=1d&accumulate=true'
    );
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('strips a trailing slash from a configured direct URL', async () => {
    const mockJson = vi.fn().mockResolvedValue({ data: [] });
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: mockJson });
    vi.stubGlobal('fetch', mockFetch);

    await fetchOpencostData('opencost', 'https://opencost.example.com/', '1d', 'pod', true);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://opencost.example.com/allocation?window=1d&aggregate=pod&step=1d&accumulate=true'
    );
  });

  it('rejects with a descriptive error when the direct URL request fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      fetchOpencostData('opencost', 'https://opencost.example.com', '1d', 'pod', true)
    ).rejects.toThrow(/503/);
  });
});
