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
import type { ClusterRequestParams } from '@kinvolk/headlamp-plugin/lib/k8s/api/v1/clusterRequests';
import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { queryClient } from '../queryClient';
import { useClustersServingGroup } from './useClustersServingGroup';

/** An error as Headlamp's request functions throw it, with the fields of Headlamp's `ApiError`. */
class RequestError extends Error implements ApiError {
  /** The HTTP status of the response. */
  status: ApiError['status'];
  /** The cluster the request went to. */
  cluster: ApiError['cluster'];

  /**
   * Builds the error.
   *
   * @param message - What went wrong.
   * @param props - The status of the response and the cluster the request went to.
   */
  constructor(message: string, props: Pick<ApiError, 'status' | 'cluster'>) {
    super(message);
    this.name = 'ApiError';
    this.status = props.status;
    this.cluster = props.cluster;
  }
}

const context = vi.hoisted(() => ({
  requests: [] as [string, ClusterRequestParams][],
  failures: {} as Record<string, ApiError>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    clusterRequest: (path: string, params: ClusterRequestParams) => {
      context.requests.push([path, params]);
      const failure = context.failures[params.cluster ?? ''];
      return failure ? Promise.reject(failure) : Promise.resolve({ ok: true });
    },
  },
}));

/**
 * Runs the hook under React.StrictMode.
 *
 * @param clusters - The clusters to check.
 * @returns What `renderHook` returns.
 */
function renderServingClusters(clusters: string[]) {
  return renderHook(() => useClustersServingGroup('eventing.knative.dev', clusters), {
    wrapper: React.StrictMode,
  });
}

describe('useClustersServingGroup', () => {
  beforeEach(() => {
    queryClient.clear();
    context.requests = [];
    context.failures = {};
  });

  it('counts a cluster as serving the group unless it answers 404', async () => {
    context.failures = {
      b: new RequestError('Not Found', { status: 404, cluster: 'b' }),
      c: new RequestError('Forbidden', { status: 403, cluster: 'c' }),
    };
    const { result } = renderServingClusters(['a', 'b', 'c']);

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual(['a', 'c']));
    expect(context.requests).toContainEqual([
      '/apis/eventing.knative.dev',
      { cluster: 'b', isJSON: false, signal: expect.any(AbortSignal) },
    ]);
  });

  it('sends no request when there is no cluster to check', () => {
    const { result } = renderServingClusters([]);

    expect(result.current).toEqual([]);
    expect(context.requests).toEqual([]);
  });
});
