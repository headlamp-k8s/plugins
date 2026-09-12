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

import { describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to mock localStorage & KubeObject before ES modules evaluate
vi.hoisted(() => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    length: 0,
    key: () => null,
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  }
});

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => {
  class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
    static getBaseObject() {
      return {};
    }
  }
  return { KubeObject };
});

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/cluster', () => {
  class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
    static getBaseObject() {
      return {};
    }
  }
  return { KubeObject };
});

import { KService } from './kservice';

describe('KService', () => {
  describe('Static Properties & Routes', () => {
    it('should have correct static CRD metadata', () => {
      expect(KService.kind).toBe('Service');
      expect(KService.apiName).toBe('services');
      expect(KService.apiVersion).toBe('serving.knative.dev/v1');
      expect(KService.isNamespaced).toBe(true);
    });

    it('should return correct route paths', () => {
      expect(KService.detailsRoute).toBe('/knative/services/:namespace/:name');
      expect(KService.listRoute).toBe('/knative/services');
    });
  });

  describe('buildAutoscalingPatch', () => {
    it('should return null when all autoscaling params are undefined', () => {
      expect(KService.buildAutoscalingPatch({})).toBeNull();
      expect(
        KService.buildAutoscalingPatch({
          metric: undefined,
          target: undefined,
          containerConcurrency: undefined,
        })
      ).toBeNull();
    });

    it('should generate annotations patch when autoscaling annotations are specified', () => {
      const patch = KService.buildAutoscalingPatch({
        metric: 'concurrency',
        target: 10,
        minScale: 1,
        maxScale: 5,
        targetUtilization: 70,
      });

      expect(patch).toEqual({
        spec: {
          template: {
            metadata: {
              name: null,
              annotations: {
                'autoscaling.knative.dev/metric': 'concurrency',
                'autoscaling.knative.dev/target': '10',
                'autoscaling.knative.dev/min-scale': '1',
                'autoscaling.knative.dev/max-scale': '5',
                'autoscaling.knative.dev/target-utilization-percentage': '70',
              },
            },
          },
        },
      });
    });

    it('should generate template spec patch when containerConcurrency is specified', () => {
      const patch = KService.buildAutoscalingPatch({
        containerConcurrency: 50,
      });

      expect(patch).toEqual({
        spec: {
          template: {
            metadata: {
              name: null,
            },
            spec: {
              containerConcurrency: 50,
            },
          },
        },
      });
    });

    it('should combine annotations and containerConcurrency in patch body', () => {
      const patch = KService.buildAutoscalingPatch({
        minScale: 2,
        maxScale: 10,
        containerConcurrency: 100,
        scaleDownDelay: '2m',
        stableWindow: '60s',
      });

      expect(patch).toEqual({
        spec: {
          template: {
            metadata: {
              name: null,
              annotations: {
                'autoscaling.knative.dev/min-scale': '2',
                'autoscaling.knative.dev/max-scale': '10',
                'autoscaling.knative.dev/scale-down-delay': '2m',
                'autoscaling.knative.dev/window': '60s',
              },
            },
            spec: {
              containerConcurrency: 100,
            },
          },
        },
      });
    });
  });

  describe('Instance Methods & Properties', () => {
    it('should correctly report url and readiness status', () => {
      const kservice = new KService({
        kind: 'Service',
        metadata: {
          name: 'demo-service',
          namespace: 'default',
          uid: 'svc-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'nginx:latest', ports: [{ containerPort: 8080 }] }],
            },
          },
        },
        status: {
          url: 'http://demo-service.default.example.com',
          conditions: [
            {
              type: 'Ready',
              status: 'True',
            },
          ],
        },
      });

      expect(kservice.url).toBe('http://demo-service.default.example.com');
      expect(kservice.isReady).toBe(true);
    });

    it('should fall back to address.url when status.url is missing', () => {
      const kservice = new KService({
        kind: 'Service',
        metadata: {
          name: 'internal-service',
          namespace: 'default',
          uid: 'svc-uid-2',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'nginx:latest', ports: [{ containerPort: 8080 }] }],
            },
          },
        },
        status: {
          address: {
            url: 'http://internal-service.default.svc.cluster.local',
          },
          conditions: [
            {
              type: 'Ready',
              status: 'False',
            },
          ],
        },
      });

      expect(kservice.url).toBe('http://internal-service.default.svc.cluster.local');
      expect(kservice.isReady).toBe(false);
    });

    it('should return undefined url and false readiness when status is missing', () => {
      const kservice = new KService({
        kind: 'Service',
        metadata: {
          name: 'uninitialized-service',
          namespace: 'default',
          uid: 'svc-uid-3',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {
          template: {
            spec: {
              containers: [{ image: 'nginx:latest', ports: [{ containerPort: 8080 }] }],
            },
          },
        },
      });

      expect(kservice.url).toBeUndefined();
      expect(kservice.isReady).toBe(false);
    });
  });

  describe('getBaseObject', () => {
    it('should return valid default base resource template', () => {
      const baseObj = KService.getBaseObject();
      expect(baseObj.metadata.name).toBe('sample-internal-app');
      expect(baseObj.metadata.namespace).toBe('default');
      expect(baseObj.spec.template.spec.containers[0].name).toBe('user-container');
    });
  });
});
