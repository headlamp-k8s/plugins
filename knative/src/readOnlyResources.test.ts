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

import { DetailsViewDefaultHeaderActions } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { vi } from 'vitest';
import { filterReadOnlyKnativeHeaderActions } from './readOnlyResources';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  DetailsViewDefaultHeaderActions: {
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    SCALE: 'SCALE',
    RESTART: 'RESTART',
    VIEW: 'VIEW',
  },
}));

function resource(
  apiVersion: string,
  kind: string,
  ownerReferences: Array<{ controller?: boolean }> = [{ controller: true }]
) {
  return {
    jsonData: {
      apiVersion,
      kind,
      metadata: {
        ownerReferences,
      },
    },
  } as KubeObject;
}

const actions = [
  { id: DetailsViewDefaultHeaderActions.EDIT },
  { id: DetailsViewDefaultHeaderActions.DELETE },
  { id: DetailsViewDefaultHeaderActions.SCALE },
  { id: DetailsViewDefaultHeaderActions.RESTART },
  { id: DetailsViewDefaultHeaderActions.VIEW },
  { id: 'plugin-specific-action' },
];

describe('read-only Serving detail actions', () => {
  it.each([
    ['serving.knative.dev/v1', 'Configuration'],
    ['serving.knative.dev/v1', 'Route'],
    ['autoscaling.internal.knative.dev/v1alpha1', 'PodAutoscaler'],
    ['autoscaling.internal.knative.dev/v1alpha1', 'Metric'],
    ['caching.internal.knative.dev/v1alpha1', 'Image'],
    ['networking.internal.knative.dev/v1alpha1', 'Ingress'],
    ['networking.internal.knative.dev/v1alpha1', 'ServerlessService'],
    ['networking.internal.knative.dev/v1alpha1', 'Certificate'],
  ])('removes mutating defaults from %s %s', (apiVersion, kind) => {
    const servingResource = resource(apiVersion, kind);

    expect(
      filterReadOnlyKnativeHeaderActions(servingResource, actions).map(action => action.id)
    ).toEqual([DetailsViewDefaultHeaderActions.VIEW, 'plugin-specific-action']);
  });

  it('does not change user-facing Knative Service actions', () => {
    const service = resource('serving.knative.dev/v1', 'Service');

    expect(filterReadOnlyKnativeHeaderActions(service, actions)).toBe(actions);
  });

  it('preserves actions when a read-only kind has no controller owner', () => {
    const unownedRoute = resource('serving.knative.dev/v1', 'Route', []);
    const nonControllerRoute = resource('serving.knative.dev/v1', 'Route', [{ controller: false }]);

    expect(filterReadOnlyKnativeHeaderActions(unownedRoute, actions)).toBe(actions);
    expect(filterReadOnlyKnativeHeaderActions(nonControllerRoute, actions)).toBe(actions);
  });

  it('does not match the same kind from another API group or version', () => {
    const otherGroup = resource('example.dev/v1', 'Route');
    const otherVersion = resource('serving.knative.dev/v1beta1', 'Route');

    expect(filterReadOnlyKnativeHeaderActions(otherGroup, actions)).toBe(actions);
    expect(filterReadOnlyKnativeHeaderActions(otherVersion, actions)).toBe(actions);
  });
});
