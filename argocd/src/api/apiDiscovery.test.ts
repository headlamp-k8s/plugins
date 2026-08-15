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

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request },
}));

import {
  apiResourceKey,
  discoverApiCatalog,
  DISCOVERY_CACHE_TTL_MS,
  DISCOVERY_CONCURRENCY,
  resetApiDiscoveryCache,
} from './apiDiscovery';

describe('discoverApiCatalog', () => {
  beforeEach(() => {
    request.mockReset();
    resetApiDiscoveryCache();
  });

  it('reads core and grouped resources from aggregated discovery', async () => {
    request.mockImplementation((path: string) => {
      if (path === '/api') {
        return Promise.resolve(aggregatedGroup('core', 'v1', 'Service', 'services'));
      }
      return Promise.resolve(
        aggregatedGroup('apps', 'v1', 'Deployment', 'deployments', 'Namespaced')
      );
    });

    const catalog = await discoverApiCatalog('cluster-a', [
      { group: '', version: 'v1', kind: 'Service' },
      { group: 'apps', version: 'v1', kind: 'Deployment' },
    ]);

    expect(catalog.resources.get(apiResourceKey('', 'Service'))?.versions).toEqual(new Set(['v1']));
    expect(catalog.resources.get(apiResourceKey('apps', 'Deployment'))?.versions).toEqual(
      new Set(['v1'])
    );
    expect(catalog.completeGroups).toEqual(new Set(['', 'apps']));
  });

  it('falls back to the legacy discovery endpoints and ignores subresources', async () => {
    request.mockImplementation((path: string, params: { headers?: unknown }) => {
      if (params.headers && path === '/api') return Promise.resolve({ versions: ['v1'] });
      if (params.headers && path === '/apis') {
        return Promise.resolve({
          groups: [
            {
              name: 'apps',
              versions: [{ version: 'v1' }],
              preferredVersion: { version: 'v1' },
            },
          ],
        });
      }
      if (path === '/api/v1') {
        return Promise.resolve({
          resources: [
            { name: 'services', kind: 'Service', namespaced: true },
            { name: 'pods/status', kind: 'Pod', namespaced: true },
          ],
        });
      }
      return Promise.resolve({
        resources: [{ name: 'deployments', kind: 'Deployment', namespaced: true }],
      });
    });

    const catalog = await discoverApiCatalog('cluster-a', [
      { group: '', version: 'v1', kind: 'Service' },
      { group: 'apps', version: 'v1', kind: 'Deployment' },
    ]);

    expect(catalog.resources.has(apiResourceKey('', 'Service'))).toBe(true);
    expect(catalog.resources.has(apiResourceKey('', 'Pod'))).toBe(false);
    expect(catalog.resources.has(apiResourceKey('apps', 'Deployment'))).toBe(true);
  });

  it('shares successful requests within the cache TTL and isolates clusters', async () => {
    request.mockResolvedValue(aggregatedGroup('apps', 'v1', 'Deployment', 'deployments'));
    const descriptors = [{ group: 'apps', version: 'v1', kind: 'Deployment' }];

    await discoverApiCatalog('cluster-a', descriptors);
    await discoverApiCatalog('cluster-a', descriptors);
    await discoverApiCatalog('cluster-b', descriptors);

    expect(request).toHaveBeenCalledTimes(4);
    expect(request.mock.calls.map(call => call[1].cluster)).toEqual([
      'cluster-a',
      'cluster-a',
      'cluster-b',
      'cluster-b',
    ]);
  });

  it('refreshes successful requests after the cache TTL', async () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    request.mockResolvedValue(aggregatedGroup('apps', 'v1', 'Deployment', 'deployments'));
    const descriptors = [{ group: 'apps', version: 'v1', kind: 'Deployment' }];

    await discoverApiCatalog('cluster-a', descriptors);
    now += DISCOVERY_CACHE_TTL_MS + 1;
    await discoverApiCatalog('cluster-a', descriptors);

    expect(request).toHaveBeenCalledTimes(4);
    vi.restoreAllMocks();
  });

  it('does not retain failed requests in the cache', async () => {
    request
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(aggregatedGroup('apps', 'v1', 'Deployment', 'deployments'))
      .mockResolvedValueOnce(aggregatedGroup('apps', 'v1', 'Deployment', 'deployments'));

    await discoverApiCatalog('cluster-a', [{ group: '', version: 'v1', kind: 'Service' }]);
    await discoverApiCatalog('cluster-a', [{ group: '', version: 'v1', kind: 'Service' }]);

    expect(request.mock.calls.filter(call => call[0] === '/api')).toHaveLength(2);
  });

  it('limits legacy version discovery requests', async () => {
    let active = 0;
    let maximum = 0;
    request.mockImplementation((path: string, params: { headers?: unknown }) => {
      if (params.headers && path === '/api') return Promise.resolve({ versions: [] });
      if (params.headers && path === '/apis') {
        return Promise.resolve({
          groups: Array.from({ length: 8 }, (_, index) => ({
            name: `group${index}.example.io`,
            versions: [{ version: 'v1' }],
          })),
        });
      }

      active += 1;
      maximum = Math.max(maximum, active);
      return new Promise(resolve =>
        setTimeout(() => {
          active -= 1;
          resolve({ resources: [] });
        }, 5)
      );
    });

    await discoverApiCatalog(
      'cluster-a',
      Array.from({ length: 8 }, (_, index) => ({
        group: `group${index}.example.io`,
        version: 'v1',
        kind: 'Example',
      }))
    );

    expect(maximum).toBe(DISCOVERY_CONCURRENCY);
  });
});

function aggregatedGroup(
  group: string,
  version: string,
  kind: string,
  resource: string,
  scope = 'Namespaced'
) {
  return {
    apiVersion: 'apidiscovery.k8s.io/v2',
    kind: 'APIGroupDiscoveryList',
    items: [
      {
        metadata: { name: group },
        versions: [
          {
            version,
            freshness: 'Current',
            resources: [{ resource, scope, responseKind: { group, version, kind } }],
          },
        ],
      },
    ],
  };
}
