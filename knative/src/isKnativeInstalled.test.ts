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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { vi } from 'vitest';
import { isKnativeComponentInstalled } from './isKnativeInstalled';
import { REQUEST_TIMEOUT_MS } from './utils/request';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ ApiProxy: { clusterRequest: vi.fn() } }));

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    apiVersion: 'apiextensions.k8s.io/v1',
    apiName: 'customresourcedefinitions',
  },
}));

const clusterRequest = vi.mocked(ApiProxy.clusterRequest);

const SERVING_CRD = 'services.serving.knative.dev';
const EVENTING_CRD = 'brokers.eventing.knative.dev';
const CRD_PATH = '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/';

class ApiStatusError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiStatusError';
    this.status = status;
  }
}

class NotFoundError extends ApiStatusError {
  constructor() {
    super(404, 'Not Found');
    this.name = 'NotFoundError';
  }
}

class NetworkError extends Error {
  constructor() {
    super('Network error');
    this.name = 'NetworkError';
  }
}

/**
 * Makes the CRD request behave like clusters that have only the given CRDs.
 *
 * @param crdsByCluster - The CRD names present in each cluster.
 */
function clusterHas(crdsByCluster: Record<string, string[]>) {
  clusterRequest.mockImplementation(async (path: string, params?: { cluster?: string | null }) => {
    const crdName = path.slice(CRD_PATH.length);
    if (!(crdsByCluster[params?.cluster ?? ''] ?? []).includes(crdName)) {
      throw new NotFoundError();
    }
    return { metadata: { name: crdName } };
  });
}

/**
 * Makes the CRD request fail with the given error.
 *
 * @param err - The error the request rejects with.
 */
function probeFails(err: unknown) {
  clusterRequest.mockRejectedValue(err);
}

describe('isKnativeComponentInstalled', () => {
  beforeEach(() => {
    clusterRequest.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when no clusters are given', async () => {
    await expect(isKnativeComponentInstalled('serving', [])).resolves.toBe(false);
    expect(clusterRequest).not.toHaveBeenCalled();
  });

  it('reads the CRD once in each cluster, without a watch', async () => {
    clusterHas({ a: [SERVING_CRD], b: [SERVING_CRD] });
    await isKnativeComponentInstalled('serving', ['a', 'b']);

    expect(clusterRequest.mock.calls).toEqual([
      [CRD_PATH + SERVING_CRD, { cluster: 'a' }],
      [CRD_PATH + SERVING_CRD, { cluster: 'b' }],
    ]);
  });

  it('detects Serving through its own CRD', async () => {
    clusterHas({ a: [SERVING_CRD] });
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(true);
  });

  it('detects Eventing through its own CRD', async () => {
    clusterHas({ a: [EVENTING_CRD] });
    await expect(isKnativeComponentInstalled('eventing', ['a'])).resolves.toBe(true);
  });

  it('does not report Eventing when only Serving is installed', async () => {
    clusterHas({ a: [SERVING_CRD] });
    await expect(isKnativeComponentInstalled('eventing', ['a'])).resolves.toBe(false);
  });

  it('does not report Serving when only Eventing is installed', async () => {
    clusterHas({ a: [EVENTING_CRD] });
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(false);
  });

  it('reports both when both are installed', async () => {
    clusterHas({ a: [SERVING_CRD, EVENTING_CRD] });
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(true);
    await expect(isKnativeComponentInstalled('eventing', ['a'])).resolves.toBe(true);
  });

  it('requires the component in every cluster', async () => {
    clusterHas({ a: [SERVING_CRD], b: [SERVING_CRD] });
    await expect(isKnativeComponentInstalled('serving', ['a', 'b'])).resolves.toBe(true);

    clusterHas({ a: [SERVING_CRD], b: [] });
    await expect(isKnativeComponentInstalled('serving', ['a', 'b'])).resolves.toBe(false);
  });

  it('treats a 404 as the CRD being absent', async () => {
    probeFails(new NotFoundError());
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(false);
  });

  it('does not report the CRD as absent when the cluster does not answer in time', async () => {
    vi.useFakeTimers();
    clusterRequest.mockReturnValue(new Promise(() => {}));
    const installed = isKnativeComponentInstalled('serving', ['a']);

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await expect(installed).resolves.toBe(true);
  });

  it.each([
    ['a forbidden probe', new ApiStatusError(403, 'Forbidden')],
    ['a server error', new ApiStatusError(500, 'Internal Server Error')],
    ['an error without a status', new NetworkError()],
    ['a null error', null],
  ])('does not report the CRD as absent for %s', async (_name, err) => {
    probeFails(err);
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(true);
  });
});
