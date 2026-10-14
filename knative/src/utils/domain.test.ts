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

import type { ClusterDomainClaim, KnativeDomainMapping } from '../resources/knative';
import { getClusterDomainClaim } from './domain';

vi.mock('../resources/knative', () => ({
  ClusterDomainClaim: class {},
  KnativeDomainMapping: class {},
}));

const HOST = 'app.example.com';
const NAMESPACE = 'tenant-a';

function makeDomainMapping(cluster = 'cluster-b', host = HOST): KnativeDomainMapping {
  const jsonData = {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'DomainMapping',
    metadata: { name: host, namespace: NAMESPACE },
    spec: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'app',
        namespace: NAMESPACE,
      },
    },
  };

  return {
    cluster,
    jsonData,
    metadata: jsonData.metadata,
    spec: jsonData.spec,
    get host() {
      return jsonData.metadata.name;
    },
  } as unknown as KnativeDomainMapping;
}

function makeClaim(cluster?: string): ClusterDomainClaim {
  const jsonData = {
    apiVersion: 'networking.internal.knative.dev/v1alpha1',
    kind: 'ClusterDomainClaim',
    metadata: { name: HOST },
    spec: { namespace: NAMESPACE },
  };

  return {
    cluster: cluster ?? '',
    jsonData,
    metadata: jsonData.metadata,
    spec: jsonData.spec,
    get targetNamespace() {
      return jsonData.spec.namespace;
    },
  } as unknown as ClusterDomainClaim;
}

describe('getClusterDomainClaim', () => {
  it('does not match a claim from another cluster', () => {
    const domainMapping = makeDomainMapping('cluster-b');
    const claim = makeClaim('cluster-a');

    expect(getClusterDomainClaim(domainMapping, [claim], 'cluster-b', NAMESPACE)).toEqual({
      state: 'missing',
      claim: null,
    });
  });

  it('matches a claim from the DomainMapping cluster', () => {
    const domainMapping = makeDomainMapping('cluster-b');
    const claim = makeClaim('cluster-b');

    expect(getClusterDomainClaim(domainMapping, [claim], 'cluster-b', NAMESPACE)).toEqual({
      state: 'present',
      claim,
    });
  });

  it('selects the matching cluster when both clusters use the same host and namespace', () => {
    const domainMapping = makeDomainMapping('cluster-b');
    const clusterAClaim = makeClaim('cluster-a');
    const clusterBClaim = makeClaim('cluster-b');

    expect(
      getClusterDomainClaim(domainMapping, [clusterAClaim, clusterBClaim], 'cluster-b', NAMESPACE)
    ).toEqual({ state: 'present', claim: clusterBClaim });
  });

  it('does not assign a clusterless claim to a known DomainMapping cluster', () => {
    const domainMapping = makeDomainMapping('cluster-b');
    const claim = makeClaim();

    expect(getClusterDomainClaim(domainMapping, [claim], 'cluster-b', NAMESPACE)).toEqual({
      state: 'missing',
      claim: null,
    });
    expect(claim.cluster).toBe('');
  });

  it('uses the caller cluster when the DomainMapping has no cluster', () => {
    const domainMapping = makeDomainMapping('');
    const claim = makeClaim('cluster-b');

    expect(getClusterDomainClaim(domainMapping, [claim], 'cluster-b', NAMESPACE)).toEqual({
      state: 'present',
      claim,
    });
    expect(claim.cluster).toBe('cluster-b');
  });

  it('returns unknown when claims have not loaded', () => {
    expect(getClusterDomainClaim(makeDomainMapping(), null, 'cluster-b', NAMESPACE)).toEqual({
      state: 'unknown',
      claim: null,
    });
  });

  it('returns unknown for a blank DomainMapping host', () => {
    expect(
      getClusterDomainClaim(makeDomainMapping('cluster-b', '   '), [], 'cluster-b', NAMESPACE)
    ).toEqual({ state: 'unknown', claim: null });
  });

  it('returns unknown for an absent DomainMapping host', () => {
    const domainMapping = makeDomainMapping();
    Reflect.deleteProperty(domainMapping.metadata, 'name');

    expect(getClusterDomainClaim(domainMapping, [], 'cluster-b', NAMESPACE)).toEqual({
      state: 'unknown',
      claim: null,
    });
  });
});
