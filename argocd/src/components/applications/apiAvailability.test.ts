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

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getCluster } = vi.hoisted(() => ({ getCluster: vi.fn(() => 'cluster-a') }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ Utils: { getCluster } }));

import { ApiCatalog, apiResourceKey } from '../../api/apiDiscovery';
import type { ArgoApplication, ManagedResource } from '../../resources/application';
import {
  canOpenManagedResourcesInCurrentCluster,
  evaluateApiAvailability,
  getApiAvailabilityPresentation,
  isLocalApplicationDestination,
  loadManagedResourceApiAvailability,
  managedResourceApiKey,
  useManagedResourceApiAvailability,
} from './apiAvailability';

const deployment: ManagedResource = {
  group: 'apps',
  version: 'v1beta1',
  kind: 'Deployment',
  namespace: 'default',
  name: 'guestbook-ui',
};

describe('managed-resource API availability', () => {
  it('recognizes only explicit in-cluster destinations as local', () => {
    expect(isLocalApplicationDestination(application([deployment], { name: 'in-cluster' }))).toBe(
      true
    );
    expect(
      isLocalApplicationDestination(
        application([deployment], { server: 'https://kubernetes.default.svc' })
      )
    ).toBe(true);
    expect(
      isLocalApplicationDestination(
        application([deployment], { server: 'https://remote.example.test' })
      )
    ).toBe(false);
    expect(
      canOpenManagedResourcesInCurrentCluster(
        application([deployment], { server: 'https://remote.example.test' })
      )
    ).toBe(false);
  });

  it('reports an exact served group, version, and kind as available', () => {
    expect(evaluateApiAvailability(deployment, catalog(['v1beta1']))).toEqual({
      state: 'available',
      servedVersions: ['v1beta1'],
    });
  });

  it('reports alternative served versions without treating them as a match', () => {
    expect(evaluateApiAvailability(deployment, catalog(['v1', 'v1beta2']))).toEqual({
      state: 'version-not-served',
      servedVersions: ['v1', 'v1beta2'],
    });
  });

  it('does not report a version as unavailable when its group discovery is incomplete', () => {
    const incomplete = catalog(['v1']);
    incomplete.completeGroups.clear();
    incomplete.failedGroups.add('apps');

    expect(evaluateApiAvailability(deployment, incomplete)).toEqual({
      state: 'unknown',
      servedVersions: [],
    });
  });

  it('distinguishes a missing API from incomplete discovery', () => {
    const complete = catalog([]);
    complete.resources.clear();
    expect(evaluateApiAvailability(deployment, complete).state).toBe('resource-not-found');

    const incomplete = catalog([]);
    incomplete.resources.clear();
    incomplete.completeGroups.clear();
    incomplete.failedGroups.add('apps');
    expect(evaluateApiAvailability(deployment, incomplete).state).toBe('unknown');
  });

  it('does not perform discovery for a remote Application', async () => {
    const discover = vi.fn();
    const app = application([deployment], { server: 'https://remote.example.test' });

    const result = await loadManagedResourceApiAvailability(app, 'cluster-a', discover);

    expect(discover).not.toHaveBeenCalled();
    expect(result.get(managedResourceApiKey(deployment))).toEqual({
      state: 'remote',
      servedVersions: [],
    });
  });

  it('provides concise labels and served-version details for the table', () => {
    expect(getApiAvailabilityPresentation(undefined, true).label).toBe('Checking…');
    expect(
      getApiAvailabilityPresentation(
        { state: 'version-not-served', servedVersions: ['v1', 'v1beta2'] },
        false
      )
    ).toEqual({
      label: 'Version not served',
      status: 'warning',
      tooltip: 'Other served versions: v1, v1beta2',
    });
    expect(
      getApiAvailabilityPresentation({ state: 'remote', servedVersions: [] }, false).label
    ).toBe('Not checked — remote');
  });

  it('ignores a late discovery response after the Application changes', async () => {
    let resolveFirst: ((value: ApiCatalog) => void) | undefined;
    const firstDiscovery = new Promise<ApiCatalog>(resolve => {
      resolveFirst = resolve;
    });
    const discover = vi
      .fn()
      .mockReturnValueOnce(firstDiscovery)
      .mockResolvedValueOnce(catalog(['v1beta1']));
    const firstApp = application([deployment], { name: 'in-cluster' });
    const service: ManagedResource = {
      group: '',
      version: 'v1',
      kind: 'Service',
      namespace: 'default',
      name: 'guestbook-ui',
    };
    const secondApp = application([service], { name: 'in-cluster' });

    const { result, rerender } = renderHook(
      ({ app }) => useManagedResourceApiAvailability(app, discover),
      { initialProps: { app: firstApp } }
    );
    rerender({ app: secondApp });
    await act(async () => undefined);

    await act(async () => resolveFirst?.(catalog(['v1'])));

    expect(result.current.availability.has(managedResourceApiKey(deployment))).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('clears old availability while a new local discovery is loading', async () => {
    let resolveSecond: ((value: ApiCatalog) => void) | undefined;
    const secondDiscovery = new Promise<ApiCatalog>(resolve => {
      resolveSecond = resolve;
    });
    const discover = vi
      .fn()
      .mockResolvedValueOnce(catalog(['v1beta1']))
      .mockReturnValueOnce(secondDiscovery);
    const firstApp = application([deployment], { name: 'in-cluster' });
    const service: ManagedResource = {
      group: '',
      version: 'v1',
      kind: 'Service',
      namespace: 'default',
      name: 'guestbook-ui',
    };
    const secondApp = application([service], { name: 'in-cluster' });

    const { result, rerender } = renderHook(
      ({ app }) => useManagedResourceApiAvailability(app, discover),
      { initialProps: { app: firstApp } }
    );
    await act(async () => undefined);

    rerender({ app: secondApp });

    expect(result.current.availability).toEqual(new Map());
    expect(result.current.loading).toBe(true);

    await act(async () => resolveSecond?.(catalog(['v1'])));
  });
});

function application(
  resources: ManagedResource[],
  destination: { server?: string; name?: string }
): ArgoApplication {
  return {
    spec: { destination },
    managedResources: resources,
  } as ArgoApplication;
}

function catalog(versions: string[]): ApiCatalog {
  return {
    resources: new Map([
      [
        apiResourceKey('apps', 'Deployment'),
        {
          group: 'apps',
          kind: 'Deployment',
          versions: new Set(versions),
          resourceNames: new Set(['deployments']),
        },
      ],
    ]),
    preferredVersions: new Map([['apps', 'v1']]),
    knownGroups: new Set(['apps']),
    completeGroups: new Set(['apps']),
    failedGroups: new Set(),
    coreRootComplete: true,
    groupedRootComplete: true,
  };
}
