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

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
}));

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  inspectPrometheusDiscovery,
  isPrometheusInstalled,
  KubernetesType,
  PROMETHEUS_SEARCH_STRATEGIES,
  SearchStrategyStepResult,
} from './request';

const mockRequest = vi.mocked(ApiProxy.request);

const prometheusPodList = {
  kind: 'PodList',
  items: [
    {
      metadata: { name: 'prometheus-pod', namespace: 'monitoring' },
      spec: {
        containers: [
          {
            name: 'prometheus',
            image: 'prom',
            ports: [{ containerPort: 9090, protocol: 'TCP' }],
          },
        ],
      },
    },
  ],
};

const queryOk = { status: 200, json: () => Promise.resolve({ status: 'success' }) };

describe('request module', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  describe('PROMETHEUS_SEARCH_STRATEGIES', () => {
    test('defines the 4 search strategies in order', () => {
      expect(PROMETHEUS_SEARCH_STRATEGIES).toEqual([
        {
          id: 'customPod',
          resourceType: KubernetesType.pods,
          labelSelector: 'headlamp-prometheus=true',
        },
        {
          id: 'customService',
          resourceType: KubernetesType.services,
          labelSelector: 'headlamp-prometheus=true',
        },
        {
          id: 'standardPod',
          resourceType: KubernetesType.pods,
          labelSelector: 'app.kubernetes.io/name=prometheus',
        },
        {
          id: 'standardService',
          resourceType: KubernetesType.services,
          labelSelector: 'app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server',
        },
      ]);
    });
  });

  describe('inspectPrometheusDiscovery', () => {
    test('records every strategy when nothing matches', async () => {
      mockRequest.mockResolvedValue({ kind: 'PodList', items: [] });

      const result = await inspectPrometheusDiscovery();

      expect(result.steps.map(step => step.strategyId)).toEqual([
        'customPod',
        'customService',
        'standardPod',
        'standardService',
      ]);
      expect(result.steps.every(step => !step.matched)).toBe(true);
      expect(result.finalEndpoint.type).toBe(KubernetesType.none);
    });

    test('stops at the first reachable match', async () => {
      mockRequest.mockImplementation((url: string) =>
        Promise.resolve(url.includes('/query_range') ? queryOk : prometheusPodList)
      );

      const result = await inspectPrometheusDiscovery();

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].matched).toBe(true);
      expect(result.steps[0].matchedResource).toEqual({
        name: 'prometheus-pod',
        namespace: 'monitoring',
        ports: ['9090'],
        reachablePort: '9090',
      });
      expect(result.finalEndpoint).toEqual({
        type: KubernetesType.pods,
        name: 'prometheus-pod',
        namespace: 'monitoring',
        port: '9090',
      });
    });

    test('reports a labelled resource that is not reachable and keeps searching', async () => {
      mockRequest.mockImplementation((url: string) => {
        if (url.includes('/query_range')) {
          return Promise.resolve({ status: 503 });
        }
        if (url.startsWith('/api/v1/pods?') && url.includes('headlamp-prometheus')) {
          return Promise.resolve(prometheusPodList);
        }
        return Promise.resolve({ kind: 'PodList', items: [] });
      });

      const result = await inspectPrometheusDiscovery();

      expect(result.steps[0].matched).toBe(true);
      expect(result.steps[0].matchedResource).toEqual({
        name: 'prometheus-pod',
        namespace: 'monitoring',
        ports: ['9090'],
        reachablePort: undefined,
      });
      expect(result.steps).toHaveLength(4);
      expect(result.finalEndpoint.type).toBe(KubernetesType.none);
    });

    test('reports each step as soon as it completes', async () => {
      const reported: SearchStrategyStepResult[] = [];
      let reportedBeforeSecondSearch = -1;
      mockRequest.mockImplementation((url: string) => {
        if (url.includes('/services?') && reportedBeforeSecondSearch === -1) {
          reportedBeforeSecondSearch = reported.length;
        }
        return Promise.resolve({ kind: 'PodList', items: [] });
      });

      await inspectPrometheusDiscovery(undefined, step => reported.push(step));

      expect(reportedBeforeSecondSearch).toBe(1);
      expect(reported.map(step => step.sequence)).toEqual([1, 2, 3, 4]);
    });

    test('sends every request to the given cluster', async () => {
      mockRequest.mockImplementation((url: string) =>
        Promise.resolve(url.includes('/query_range') ? queryOk : prometheusPodList)
      );

      await inspectPrometheusDiscovery('cluster-b');

      expect(mockRequest.mock.calls.length).toBeGreaterThanOrEqual(2);
      for (const [url, params] of mockRequest.mock.calls) {
        expect(params, url).toMatchObject({ cluster: 'cluster-b' });
      }
      expect(mockRequest.mock.calls.some(([url]) => url.includes('/query_range'))).toBe(true);
    });

    test('leaves the cluster to the default when none is given', async () => {
      mockRequest.mockImplementation((url: string) =>
        Promise.resolve(url.includes('/query_range') ? queryOk : prometheusPodList)
      );

      await inspectPrometheusDiscovery();

      for (const [, params] of mockRequest.mock.calls) {
        expect(params).not.toHaveProperty('cluster');
      }
    });

    test('shows the error of a failed search and stops, like autodetection', async () => {
      mockRequest.mockRejectedValue(new Error('pods is forbidden'));

      const result = await inspectPrometheusDiscovery();

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].error).toBe('pods is forbidden');
      expect(result.finalEndpoint.type).toBe(KubernetesType.none);
    });
  });

  describe('isPrometheusInstalled', () => {
    test('still fails when a search request fails', async () => {
      mockRequest.mockRejectedValue(new Error('pods is forbidden'));

      await expect(isPrometheusInstalled()).rejects.toThrow('pods is forbidden');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });
});
