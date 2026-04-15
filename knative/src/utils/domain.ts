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

import { ClusterDomainClaim, KnativeDomainMapping } from '../resources/knative';

export function getClusterDomainClaim(
  dm: KnativeDomainMapping,
  clusterDomainClaims: ClusterDomainClaim[] | null,
  cluster: string,
  namespace: string
): {
  state: 'unknown' | 'missing' | 'present';
  claim: ClusterDomainClaim | null;
} {
  const clusters = [cluster];
  if (!clusterDomainClaims) {
    return { state: 'unknown', claim: null };
  }
  const host = dm.host?.trim();
  if (!host) {
    return { state: 'unknown', claim: null };
  }

  // DomainMappingSection is single-cluster today, but keep this safe if it ever becomes multi-cluster.
  const effectiveCluster = dm.cluster || cluster;
  const requireClusterMatch = clusters.length > 1;

  const claim =
    clusterDomainClaims.find(
      cdc =>
        (!requireClusterMatch || cdc.cluster === effectiveCluster) &&
        cdc.metadata?.name === host &&
        cdc.targetNamespace === namespace
    ) ?? null;

  if (claim && !claim.cluster && effectiveCluster) {
    claim.cluster = effectiveCluster;
  }

  return claim ? { state: 'present', claim } : { state: 'missing', claim: null };
}

function isValidDomain(host: string): boolean {
  // very permissive host validation; rely on API for authoritative validation
  const h = host.trim();
  if (h.length < 1 || h.length > 253) return false;
  // simple label check (letters, digits, hyphen; labels do not start/end with hyphen)
  return h.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export async function ensureClusterDomainClaim(opts: {
  host: string;
  cluster: string;
  namespace: string;
}) {
  try {
    await ClusterDomainClaim.apiEndpoint.post(
      {
        apiVersion: ClusterDomainClaim.apiVersion,
        kind: ClusterDomainClaim.kind,
        metadata: { name: opts.host },
        spec: { namespace: opts.namespace },
      },
      {},
      opts.cluster
    );
  } catch (e: unknown) {
    const error = e as { message?: string } | undefined;
    const msg = String(error?.message || '');
    // Ignore if already exists or conflicts (loosely check for 409/AlreadyExists messages)
    if (!/AlreadyExists|409|exists/i.test(msg)) {
      throw e;
    }
  }
}

/**
 * Creates a ClusterDomainClaim and then a DomainMapping.
 * Throws an error if validation or API calls fail.
 */
export async function createDomainMapping(
  domainInput: string,
  cluster: string,
  namespace: string,
  serviceName: string
) {
  const host = domainInput.trim();
  if (!host) {
    throw new Error('Please enter a domain name');
  }
  if (!isValidDomain(host)) {
    throw new Error('Invalid domain name format');
  }
  if (!cluster) {
    throw new Error('No cluster available');
  }

  // Create Cluster Domain Claim
  await ensureClusterDomainClaim({ host, cluster, namespace });

  // Create respective Domain Mapping
  await KnativeDomainMapping.apiEndpoint.post(
    {
      apiVersion: KnativeDomainMapping.apiVersion,
      kind: KnativeDomainMapping.kind,
      metadata: {
        name: host,
        namespace,
      },
      spec: {
        ref: {
          apiVersion: 'serving.knative.dev/v1',
          kind: 'Service',
          name: serviceName,
          namespace,
        },
      },
    },
    {},
    cluster
  );
}

/**
 * Creates a ClusterDomainClaim.
 * Throws an error if validation or API calls fail.
 */
export async function createClusterDomainClaim(dm: KnativeDomainMapping, namespace: string) {
  const host = dm.host?.trim();
  if (!host) {
    throw new Error('Domain name is missing');
  }

  try {
    await ensureClusterDomainClaim({ host, cluster: dm.cluster, namespace });

    // Add dummy annotation to trigger DomainMapping reconciliation
    try {
      await dm.patch({
        metadata: {
          annotations: {
            'knative.headlamp.dev/reconciledAt': new Date().toISOString(),
          },
        },
      });
    } catch (e2: unknown) {
      const error2 = e2 as { message?: string } | undefined;
      const detail2 = error2?.message?.trim();
      throw new Error(
        detail2
          ? `Failed to annotate DomainMapping: ${detail2}`
          : 'Failed to annotate DomainMapping'
      );
    }
  } catch (e: unknown) {
    const error = e as { message?: string } | undefined;
    const detail = error?.message?.trim();
    throw new Error(
      detail
        ? `Failed to create ClusterDomainClaim: ${detail}`
        : 'Failed to create ClusterDomainClaim'
    );
  }
}
