/*
 * Copyright 2025 The Headlamp Authors
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

// radius.ts builds CRD classes at module load, so stub the Headlamp lib
// imports to keep these pure-function tests free of the K8s runtime.
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn() },
}));
vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: () => class {},
}));

import {
  filterDeploymentResourcesByType,
  getApplicationEnvironment,
  getResourceStatus,
  parseRadiusResourceId,
  type RadiusApplication,
  type RadiusDeploymentResource,
  type RadiusResource,
} from './radius';

const deploymentResource = (id: string) =>
  ({
    apiVersion: 'radapp.io/v1alpha3',
    kind: 'DeploymentResource',
    metadata: { name: 'example' },
    spec: { id },
  } satisfies RadiusDeploymentResource);

describe('parseRadiusResourceId', () => {
  it('extracts provider, type and name from a full resource id', () => {
    const id =
      '/planes/radius/local/resourceGroups/default/providers/Applications.Core/applications/myapp';

    expect(parseRadiusResourceId(id)).toEqual({
      resourceProvider: 'Applications.Core',
      resourceType: 'applications',
      resourceName: 'myapp',
    });
  });

  it('keeps dots in the resource name', () => {
    const id = '/providers/Applications.Core/containers/my.container';

    expect(parseRadiusResourceId(id)?.resourceName).toBe('my.container');
  });

  it('returns null for an empty id', () => {
    expect(parseRadiusResourceId('')).toBeNull();
  });

  it('returns null when there is no /providers/ segment', () => {
    expect(parseRadiusResourceId('/planes/radius/local/resourceGroups/default')).toBeNull();
  });

  it('returns null when the name segment is missing', () => {
    expect(parseRadiusResourceId('/providers/Applications.Core/applications')).toBeNull();
  });

  it('returns null when the id has a trailing slash', () => {
    expect(parseRadiusResourceId('/providers/Applications.Core/applications/myapp/')).toBeNull();
  });
});

describe('filterDeploymentResourcesByType', () => {
  const resources: RadiusDeploymentResource[] = [
    deploymentResource('/providers/Applications.Core/applications/app-one'),
    deploymentResource('/providers/Applications.Core/environments/env-one'),
    deploymentResource('/providers/Applications.Core/applications/app-two'),
  ];

  it('keeps only resources whose parsed type matches', () => {
    const result = filterDeploymentResourcesByType(resources, 'applications');

    expect(result).toHaveLength(2);
    expect(result.map(r => parseRadiusResourceId(r.spec.id)?.resourceName)).toEqual([
      'app-one',
      'app-two',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterDeploymentResourcesByType(resources, 'gateways')).toEqual([]);
  });

  it('returns an empty array for an empty input', () => {
    expect(filterDeploymentResourcesByType([], 'applications')).toEqual([]);
  });

  it('skips resources without a parseable id', () => {
    // Intentionally invalid: a DeploymentResource whose spec has no id.
    const missingId = {
      apiVersion: 'radapp.io/v1alpha3',
      kind: 'DeploymentResource',
      metadata: { name: 'example' },
      spec: {},
    } as unknown as RadiusDeploymentResource;
    const withoutId: RadiusDeploymentResource[] = [
      missingId,
      deploymentResource('not-a-radius-id'),
    ];

    expect(filterDeploymentResourcesByType(withoutId, 'applications')).toEqual([]);
  });
});

describe('getApplicationEnvironment', () => {
  const application = (environment?: string) =>
    ({
      apiVersion: 'radapp.io/v1alpha3',
      kind: 'Application',
      metadata: { name: 'example' },
      spec: { environment },
    } satisfies RadiusApplication);

  it('returns the configured environment', () => {
    expect(getApplicationEnvironment(application('production'))).toBe('production');
  });

  it("falls back to 'N/A' when the environment is unset", () => {
    expect(getApplicationEnvironment(application(undefined))).toBe('N/A');
  });

  it("falls back to 'N/A' when the environment is an empty string", () => {
    expect(getApplicationEnvironment(application(''))).toBe('N/A');
  });

  it("falls back to 'N/A' when there is no spec", () => {
    expect(getApplicationEnvironment({ kind: 'Application' } as unknown as RadiusApplication)).toBe(
      'N/A'
    );
  });
});

describe('getResourceStatus', () => {
  const resource = (status?: RadiusResource['status']) =>
    ({
      apiVersion: 'radapp.io/v1alpha3',
      kind: 'DeploymentResource',
      metadata: { name: 'example' },
      status,
    } satisfies RadiusResource);

  it('returns the phrase when present', () => {
    expect(getResourceStatus(resource({ phrase: 'Ready' }))).toBe('Ready');
  });

  it('returns the legacy compute provisioning state', () => {
    expect(getResourceStatus(resource({ compute: { resourceProvisioning: 'Provisioning' } }))).toBe(
      'Provisioning'
    );
  });

  it("returns 'Unknown' when there is no status", () => {
    expect(getResourceStatus(resource(undefined))).toBe('Unknown');
  });

  it("returns 'Unknown' when the status has no recognised fields", () => {
    expect(getResourceStatus(resource({}))).toBe('Unknown');
  });
});
