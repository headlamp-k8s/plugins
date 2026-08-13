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
import { KRevision } from './revision';

describe('KRevision', () => {
  describe('Static Properties & Routes', () => {
    it('should have correct static CRD metadata', () => {
      expect(KRevision.kind).toBe('Revision');
      expect(KRevision.apiName).toBe('revisions');
      expect(KRevision.apiVersion).toBe('serving.knative.dev/v1');
      expect(KRevision.isNamespaced).toBe(true);
    });

    it('should return correct route paths', () => {
      expect(KRevision.detailsRoute).toBe('/knative/revisions/:namespace/:name');
      expect(KRevision.listRoute).toBe('/knative/revisions');
    });
  });

  describe('Instance Getters', () => {
    it('should correctly evaluate readiness and readyCondition', () => {
      const readyRevision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00001',
          namespace: 'default',
          uid: 'rev-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'True',
            },
          ],
        },
      });

      expect(readyRevision.readyCondition).toEqual({ type: 'Ready', status: 'True' });
      expect(readyRevision.isReady).toBe(true);
    });

    it('should return false for isReady when Ready condition status is False or missing', () => {
      const notReadyRevision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00002',
          namespace: 'default',
          uid: 'rev-uid-2',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'False',
            },
          ],
        },
      });

      expect(notReadyRevision.isReady).toBe(false);

      const uninitializedRevision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00003',
          namespace: 'default',
          uid: 'rev-uid-3',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(uninitializedRevision.readyCondition).toBeUndefined();
      expect(uninitializedRevision.isReady).toBe(false);
    });

    it('should correctly return parentService label', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00001',
          namespace: 'default',
          uid: 'rev-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
          labels: {
            'serving.knative.dev/service': 'demo-service',
          },
        },
      });

      expect(revision.parentService).toBe('demo-service');
    });

    it('should return undefined parentService when label is missing', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'standalone-revision',
          namespace: 'default',
          uid: 'rev-uid-4',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(revision.parentService).toBeUndefined();
    });

    it('should return containers and primaryImage', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00001',
          namespace: 'default',
          uid: 'rev-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {
          containers: [
            { name: 'user-container', image: 'gcr.io/knative-samples/helloworld-go' },
            { name: 'sidecar-container', image: 'gcr.io/knative-samples/sidecar' },
          ],
        },
      });

      expect(revision.containers).toHaveLength(2);
      expect(revision.primaryImage).toBe('gcr.io/knative-samples/helloworld-go');
    });

    it('should return empty array for containers and undefined for primaryImage when spec is empty', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'empty-spec-revision',
          namespace: 'default',
          uid: 'rev-uid-5',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(revision.containers).toEqual([]);
      expect(revision.primaryImage).toBeUndefined();
    });
  });

  describe('getTrafficInService', () => {
    it('should return empty array when kservice is null or undefined', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00001',
          namespace: 'default',
          uid: 'rev-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      expect(revision.getTrafficInService(null)).toEqual([]);
    });

    it('should return traffic targets matching exact revisionName', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00001',
          namespace: 'default',
          uid: 'rev-uid-1',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

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
          traffic: [
            { revisionName: 'demo-service-00001', percent: 80, tag: 'v1' },
            { revisionName: 'demo-service-00002', percent: 20, tag: 'v2' },
          ],
        },
      });

      const traffic = revision.getTrafficInService(kservice);
      expect(traffic).toHaveLength(1);
      expect(traffic[0]).toEqual({ revisionName: 'demo-service-00001', percent: 80, tag: 'v1' });
    });

    it('should match latestRevision targets when latestReadyRevisionName matches revision name', () => {
      const revision = new KRevision({
        kind: 'Revision',
        metadata: {
          name: 'demo-service-00002',
          namespace: 'default',
          uid: 'rev-uid-2',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

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
          latestReadyRevisionName: 'demo-service-00002',
          traffic: [{ latestRevision: true, percent: 100, tag: 'latest' }],
        },
      });

      const traffic = revision.getTrafficInService(kservice);
      expect(traffic).toHaveLength(1);
      expect(traffic[0]).toEqual({ latestRevision: true, percent: 100, tag: 'latest' });
    });
  });
});
