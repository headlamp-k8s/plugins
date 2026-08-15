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

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    cluster: {
      KubeObject: class KubeObject {
        jsonData: any;
        metadata: any;

        constructor(jsonData: any) {
          this.jsonData = jsonData;
          this.metadata = jsonData.metadata;
        }
      },
    },
  },
}));

import { ArgoApplication, type KubeArgoApplication } from './application';

function createApplication(controllerNamespace?: string) {
  return new ArgoApplication({
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      name: 'guestbook',
      namespace: 'applications',
      creationTimestamp: '2025-01-01T00:00:00Z',
      uid: 'guestbook-uid',
    },
    spec: {
      project: 'default',
      destination: { namespace: 'default', server: 'https://kubernetes.default.svc' },
    },
    status: controllerNamespace ? { controllerNamespace } : undefined,
  } as KubeArgoApplication);
}

describe('ArgoApplication controllerNamespace', () => {
  it('returns the namespace reported by Argo CD', () => {
    expect(createApplication('argocd').controllerNamespace).toBe('argocd');
  });

  it('returns undefined when Argo CD has not reported a controller namespace', () => {
    expect(createApplication().controllerNamespace).toBeUndefined();
  });
});
