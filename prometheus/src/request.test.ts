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

import { describe, expect, test, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn().mockResolvedValue({
      kind: 'PodList',
      items: [],
    }),
  },
}));

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  inspectPrometheusDiscovery,
  KubernetesType,
  PROMETHEUS_SEARCH_STRATEGIES,
} from './request';

describe('request module', () => {
  describe('PROMETHEUS_SEARCH_STRATEGIES', () => {
    test('defines 4 search strategies in declarative sequence', () => {
      expect(PROMETHEUS_SEARCH_STRATEGIES).toHaveLength(4);

      expect(PROMETHEUS_SEARCH_STRATEGIES[0]).toEqual({
        strategyName: 'Custom Pod Label Search',
        description: 'Searches for Pods matching headlamp-prometheus=true label',
        resourceType: KubernetesType.pods,
        labelSelector: 'headlamp-prometheus=true',
      });

      expect(PROMETHEUS_SEARCH_STRATEGIES[1]).toEqual({
        strategyName: 'Custom Service Label Search',
        description: 'Searches for Services matching headlamp-prometheus=true label',
        resourceType: KubernetesType.services,
        labelSelector: 'headlamp-prometheus=true',
      });

      expect(PROMETHEUS_SEARCH_STRATEGIES[2]).toEqual({
        strategyName: 'Standard Pod Label Search',
        description: 'Searches for Pods matching app.kubernetes.io/name=prometheus label',
        resourceType: KubernetesType.pods,
        labelSelector: 'app.kubernetes.io/name=prometheus',
      });

      expect(PROMETHEUS_SEARCH_STRATEGIES[3]).toEqual({
        strategyName: 'Standard Service Label Search',
        description:
          'Searches for Services matching app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server label',
        resourceType: KubernetesType.services,
        labelSelector:
          'app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server',
      });
    });
  });

  describe('inspectPrometheusDiscovery', () => {
    test('returns step results array matching PROMETHEUS_SEARCH_STRATEGIES', async () => {
      const result = await inspectPrometheusDiscovery();
      expect(result).toHaveProperty('steps');
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].sequence).toBe(1);
    });

    test('captures matched resource when Prometheus is found', async () => {
      (ApiProxy.request as any).mockImplementation((url: string) => {
        if (url.includes('/query_range')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve({ status: 'success' }) });
        }
        return Promise.resolve({
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
        });
      });

      const result = await inspectPrometheusDiscovery();
      expect(result.finalEndpoint?.type).toBe(KubernetesType.pods);
      expect(result.finalEndpoint?.name).toBe('prometheus-pod');
      expect(result.finalEndpoint?.namespace).toBe('monitoring');
    });
  });
});
