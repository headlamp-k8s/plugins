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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KnativeDomainMapping } from './domainMapping';

const mocks = vi.hoisted(() => ({
  deleteDomainMapping: vi.fn(),
  deleteClaim: vi.fn(),
  clusterRequest: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  clusterRequest: mocks.clusterRequest,
}));

// Stand-in for the KubeObject-based parent. Like Headlamp's KubeObject, delete() hands the
// object's namespace, name, delete parameters, and cluster to the resource's API endpoint.
vi.mock('./conditionedResource', () => ({
  ConditionedKnativeCustomResource: class {
    jsonData: { metadata: { name: string; namespace?: string } };
    cluster: string;

    constructor(jsonData: { metadata: { name: string; namespace?: string } }, cluster: string) {
      this.jsonData = jsonData;
      this.cluster = cluster;
    }

    get metadata() {
      return this.jsonData.metadata;
    }

    delete(force?: boolean) {
      const { name, namespace } = this.jsonData.metadata;
      return mocks.deleteDomainMapping(
        namespace,
        name,
        force ? { gracePeriodSeconds: 0 } : {},
        this.cluster
      );
    }
  },
}));

vi.mock('./clusterDomainClaim', () => ({
  ClusterDomainClaim: {
    kind: 'ClusterDomainClaim',
    apiName: 'clusterdomainclaims',
    apiVersion: 'networking.internal.knative.dev/v1alpha1',
    apiEndpoint: { delete: mocks.deleteClaim },
  },
}));

const HOST = 'app.example.com';
const CLUSTER = 'cluster-a';
const CLAIM_PATH = `/apis/networking.internal.knative.dev/v1alpha1/clusterdomainclaims/${HOST}`;

function apiError(status: number): Error & { status: number } {
  return Object.assign(new Error(`request failed with status ${status}`), { status });
}

function makeDomainMapping(namespace = 'tenant-a'): KnativeDomainMapping {
  return new KnativeDomainMapping(
    {
      apiVersion: KnativeDomainMapping.apiVersion,
      kind: KnativeDomainMapping.kind,
      metadata: { name: HOST, namespace, uid: 'domain-mapping-uid', creationTimestamp: '' },
      spec: { ref: { name: 'app' } },
    },
    CLUSTER
  );
}

function claimHeldBy(namespace: string) {
  return {
    apiVersion: 'networking.internal.knative.dev/v1alpha1',
    kind: 'ClusterDomainClaim',
    metadata: { name: HOST },
    spec: { namespace },
  };
}

beforeEach(() => {
  mocks.deleteDomainMapping.mockReset().mockResolvedValue({ status: 'Success' });
  mocks.deleteClaim.mockReset().mockResolvedValue({});
  mocks.clusterRequest.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KnativeDomainMapping.delete', () => {
  it('deletes the claim after the DomainMapping when the claim is held by its namespace', async () => {
    mocks.clusterRequest.mockResolvedValue(claimHeldBy('tenant-a'));

    await expect(makeDomainMapping('tenant-a').delete()).resolves.toEqual({ status: 'Success' });

    expect(mocks.deleteDomainMapping).toHaveBeenCalledWith('tenant-a', HOST, {}, CLUSTER);
    expect(mocks.clusterRequest).toHaveBeenCalledWith(CLAIM_PATH, { cluster: CLUSTER });
    expect(mocks.deleteClaim).toHaveBeenCalledWith(HOST, undefined, CLUSTER);
    expect(mocks.deleteDomainMapping.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.clusterRequest.mock.invocationCallOrder[0]
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('leaves a claim held by another namespace in place', async () => {
    mocks.clusterRequest.mockResolvedValue(claimHeldBy('tenant-b'));

    await expect(makeDomainMapping('tenant-a').delete()).resolves.toEqual({ status: 'Success' });

    expect(mocks.deleteDomainMapping).toHaveBeenCalledWith('tenant-a', HOST, {}, CLUSTER);
    expect(mocks.deleteClaim).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does nothing more when the claim does not exist', async () => {
    mocks.clusterRequest.mockRejectedValue(apiError(404));

    await expect(makeDomainMapping().delete()).resolves.toEqual({ status: 'Success' });

    expect(mocks.deleteClaim).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([403, 500])(
    'keeps the claim and warns when the claim cannot be read (%s)',
    async status => {
      mocks.clusterRequest.mockRejectedValue(apiError(status));

      await expect(makeDomainMapping().delete()).resolves.toEqual({ status: 'Success' });

      expect(mocks.deleteClaim).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
    }
  );

  it('forces the claim deletion along with the DomainMapping', async () => {
    mocks.clusterRequest.mockResolvedValue(claimHeldBy('tenant-a'));

    await makeDomainMapping('tenant-a').delete(true);

    expect(mocks.deleteDomainMapping).toHaveBeenCalledWith(
      'tenant-a',
      HOST,
      { gracePeriodSeconds: 0 },
      CLUSTER
    );
    expect(mocks.deleteClaim).toHaveBeenCalledWith(HOST, { gracePeriodSeconds: 0 }, CLUSTER);
  });

  it('does not look up the claim when the DomainMapping deletion fails', async () => {
    mocks.deleteDomainMapping.mockRejectedValue(apiError(403));

    await expect(makeDomainMapping().delete()).rejects.toMatchObject({ status: 403 });

    expect(mocks.clusterRequest).not.toHaveBeenCalled();
    expect(mocks.deleteClaim).not.toHaveBeenCalled();
  });
});
