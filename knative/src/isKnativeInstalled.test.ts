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

import { vi } from 'vitest';
import { isKnativeComponentInstalled } from './isKnativeInstalled';
import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: { apiGet: vi.fn() },
}));

const apiGet = CustomResourceDefinition.apiGet as unknown as ReturnType<typeof vi.fn>;

const SERVING_CRD = 'services.serving.knative.dev';
const EVENTING_CRD = 'brokers.eventing.knative.dev';

const cancel = vi.fn();

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
 * Makes apiGet behave like a cluster that only has the given CRDs.
 *
 * @param crdsByCluster The CRD names present in each cluster.
 */
function clusterHas(crdsByCluster: Record<string, string[]>) {
  apiGet.mockImplementation(
    (
      onGet: (item: unknown) => void,
      crdName: string,
      _namespace: undefined,
      onError: (err: unknown) => void,
      opts: { cluster: string }
    ) => {
      return () => {
        // The real request answers after it has handed back its cancel
        // function, so the callbacks are deferred here the same way.
        setTimeout(() => {
          if ((crdsByCluster[opts.cluster] ?? []).includes(crdName)) {
            onGet({ metadata: { name: crdName } });
          } else {
            onError(new NotFoundError());
          }
        }, 0);
        return Promise.resolve(cancel);
      };
    }
  );
}

function probeFails(err: unknown) {
  apiGet.mockImplementation(
    (
      _onGet: (item: unknown) => void,
      _crdName: string,
      _namespace: undefined,
      onError: (err: unknown) => void
    ) => {
      return () => {
        setTimeout(() => onError(err), 0);
        return Promise.resolve(cancel);
      };
    }
  );
}

describe('isKnativeComponentInstalled', () => {
  beforeEach(() => {
    apiGet.mockReset();
    cancel.mockReset();
  });

  it('returns false when no clusters are given', async () => {
    await expect(isKnativeComponentInstalled('serving', [])).resolves.toBe(false);
    expect(apiGet).not.toHaveBeenCalled();
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

  it('returns false when the request itself fails', async () => {
    apiGet.mockImplementation(() => () => Promise.reject(new NetworkError()));
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(false);
  });

  it('treats a 404 as the CRD being absent', async () => {
    probeFails(new NotFoundError());
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(false);
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

  it('settles only once when both callbacks fire', async () => {
    apiGet.mockImplementation(
      (
        onGet: (item: unknown) => void,
        _crdName: string,
        _namespace: undefined,
        onError: (err: unknown) => void
      ) => {
        return () => {
          setTimeout(() => {
            onGet({ metadata: { name: SERVING_CRD } });
            onError(new NotFoundError());
          }, 0);
          return Promise.resolve(cancel);
        };
      }
    );
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels the watch once a result is known', async () => {
    clusterHas({ a: [SERVING_CRD] });
    await isKnativeComponentInstalled('serving', ['a']);
    expect(cancel).toHaveBeenCalled();
  });
});
