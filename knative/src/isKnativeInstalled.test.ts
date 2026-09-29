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
import { isKnativeComponentInstalled, type KnativeComponent } from './isKnativeInstalled';
import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: { apiGet: vi.fn() },
}));

const apiGet = CustomResourceDefinition.apiGet as unknown as ReturnType<typeof vi.fn>;

const SERVING_CRD = 'services.serving.knative.dev';
const EVENTING_CRD = 'brokers.eventing.knative.dev';

const cancel = vi.fn();

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
            onError(Object.assign(new Error('not found'), { status: 404 }));
          }
        }, 0);
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
    apiGet.mockImplementation(() => () => Promise.reject(new Error('network down')));
    await expect(isKnativeComponentInstalled('serving', ['a'])).resolves.toBe(false);
  });

  it('cancels the watch once a result is known', async () => {
    clusterHas({ a: [SERVING_CRD] });
    await isKnativeComponentInstalled('serving', ['a']);
    expect(cancel).toHaveBeenCalled();
  });

  describe.each<[KnativeComponent, string]>([
    ['serving', SERVING_CRD],
    ['eventing', EVENTING_CRD],
  ])('%s probe error classification', (component, crdName) => {
    function clusterErrors(errorsByCluster: Map<string, unknown>) {
      apiGet.mockImplementation(
        (
            onGet: (item: unknown) => void,
            name: string,
            _namespace: undefined,
            onError: (err: unknown) => void,
            opts: { cluster: string }
          ) =>
          () => {
            setTimeout(() => {
              if (errorsByCluster.has(opts.cluster)) {
                onError(errorsByCluster.get(opts.cluster));
              } else {
                onGet({ metadata: { name } });
              }
            }, 0);
            return Promise.resolve(cancel);
          }
      );
    }

    it.each([
      ['403', Object.assign(new Error('forbidden'), { status: 403 })],
      ['500', Object.assign(new Error('server error'), { status: 500 })],
      ['missing status', new Error('network error')],
      ['null error', null],
    ])('does not treat %s as confirmed absence', async (_label, error) => {
      clusterErrors(new Map([['a', error]]));

      await expect(isKnativeComponentInstalled(component, ['a'])).resolves.toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('returns false only for a confirmed 404', async () => {
      clusterErrors(new Map([['a', { status: 404 }]]));

      await expect(isKnativeComponentInstalled(component, ['a'])).resolves.toBe(false);
    });

    it('passes its own CRD name and cluster to the shared probe', async () => {
      clusterHas({ 'cluster-a': [crdName] });

      await expect(isKnativeComponentInstalled(component, ['cluster-a'])).resolves.toBe(true);
      expect(apiGet).toHaveBeenCalledWith(
        expect.any(Function),
        crdName,
        undefined,
        expect.any(Function),
        { cluster: 'cluster-a' }
      );
    });

    it('keeps the component available when another selected cluster denies the probe', async () => {
      clusterErrors(new Map([['b', { status: 403 }]]));

      await expect(isKnativeComponentInstalled(component, ['a', 'b'])).resolves.toBe(true);
      expect(apiGet.mock.calls.map(call => call[4])).toEqual([{ cluster: 'a' }, { cluster: 'b' }]);
    });

    it('reports absence when any cluster confirms 404 despite an inconclusive probe elsewhere', async () => {
      clusterErrors(
        new Map([
          ['a', { status: 403 }],
          ['b', { status: 404 }],
        ])
      );

      await expect(isKnativeComponentInstalled(component, ['a', 'b'])).resolves.toBe(false);
    });

    it('settles once if a success is followed by an error callback', async () => {
      apiGet.mockImplementation(
        (
            onGet: (item: unknown) => void,
            _name: string,
            _namespace: undefined,
            onError: (err: unknown) => void
          ) =>
          () => {
            setTimeout(() => {
              onGet({ metadata: { name: crdName } });
              onError({ status: 404 });
            }, 0);
            return Promise.resolve(cancel);
          }
      );

      await expect(isKnativeComponentInstalled(component, ['a'])).resolves.toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });
});
