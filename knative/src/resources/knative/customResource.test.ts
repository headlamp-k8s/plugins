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

import { Router } from '@kinvolk/headlamp-plugin/lib';
import { vi } from 'vitest';
import {
  getKnativeCustomResourceDetailsLink,
  getKnativeCustomResourceListLink,
} from './customResourceLinks';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Router: {
    createRouteURL: vi.fn((routeName: string) => `/${routeName}`),
  },
}));

const resourceClass = {
  kind: 'TestResource',
  apiName: 'testresources',
  apiVersion: 'example.dev/v1',
  isNamespaced: true,
};

describe('Knative custom resource links', () => {
  beforeEach(() => {
    vi.mocked(Router.createRouteURL).mockClear();
  });

  it('builds detail links through the public Router API', () => {
    expect(
      getKnativeCustomResourceDetailsLink({
        resourceClass,
        name: 'example',
        namespace: 'tenant',
        cluster: 'cluster-b',
      })
    ).toBe('/customresource');
    expect(Router.createRouteURL).toHaveBeenCalledWith('customresource', {
      cluster: 'cluster-b',
      crd: 'testresources.example.dev',
      namespace: 'tenant',
      crName: 'example',
    });
  });

  it('builds list links through the public Router API', () => {
    expect(getKnativeCustomResourceListLink({ resourceClass, cluster: 'cluster-b' })).toBe(
      '/customresources'
    );
    expect(Router.createRouteURL).toHaveBeenCalledWith('customresources', {
      cluster: 'cluster-b',
      crd: 'testresources.example.dev',
    });
  });

  it('uses the cluster-scoped namespace marker for cluster-scoped resources', () => {
    expect(
      getKnativeCustomResourceDetailsLink({
        resourceClass: { ...resourceClass, isNamespaced: false },
        name: 'cluster-example',
        namespace: 'ignored',
        cluster: 'cluster-b',
      })
    ).toBe('/customresource');
    expect(Router.createRouteURL).toHaveBeenCalledWith('customresource', {
      cluster: 'cluster-b',
      crd: 'testresources.example.dev',
      namespace: '-',
      crName: 'cluster-example',
    });
  });
});
