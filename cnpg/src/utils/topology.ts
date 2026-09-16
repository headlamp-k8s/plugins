/*
 * Copyright 2026 The Kubernetes Authors
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

import { CnpgClusterLike } from '../resources/types';

export type InstanceRole = 'primary' | 'replica' | 'unknown';
export type InstanceHealth = 'healthy' | 'replicating' | 'failed' | 'unknown';

/** One PostgreSQL instance as the operator currently reports it. */
export interface InstanceTopologyEntry {
  name: string;
  role: InstanceRole;
  health: InstanceHealth;
  /**
   * The raw `status.instancesStatus` bucket this instance was found in, or null
   * when the operator reported no bucket for it. Kept separately from `health`
   * so a bucket added by a future CNPG release is still shown to the user
   * instead of being flattened into "unknown".
   */
  healthLabel: string | null;
  timelineId: number | null;
  ip: string | null;
}

/** `status.instancesStatus` keys this plugin understands, as of CNPG 1.29/1.30. */
const KNOWN_HEALTH_BUCKETS: Record<string, InstanceHealth> = {
  healthy: 'healthy',
  replicating: 'replicating',
  failed: 'failed',
};

/**
 * Collects every instance name the operator mentions anywhere in status.
 *
 * `status.instanceNames` is the authoritative list, but it is absent on very
 * young clusters, so the other two maps are unioned in as a fallback.
 */
function collectInstanceNames(cluster: CnpgClusterLike | undefined): string[] {
  const status = cluster?.status;
  const names = new Set<string>(status?.instanceNames ?? []);

  for (const name of Object.keys(status?.instancesReportedState ?? {})) {
    names.add(name);
  }

  for (const bucket of Object.values(status?.instancesStatus ?? {})) {
    for (const name of bucket ?? []) {
      names.add(name);
    }
  }

  return [...names];
}

function findHealthLabel(cluster: CnpgClusterLike | undefined, name: string): string | null {
  const buckets = Object.entries(cluster?.status?.instancesStatus ?? {});
  const match = buckets.find(([, members]) => (members ?? []).includes(name));

  return match ? match[0] : null;
}

/**
 * Returns one entry per PostgreSQL instance, primary first, then by name.
 *
 * Every field degrades to null/'unknown' rather than throwing or guessing: a
 * cluster that is bootstrapping, fully down, or reporting a shape this plugin
 * has not seen still renders.
 */
export function getInstanceTopology(cluster: CnpgClusterLike | undefined): InstanceTopologyEntry[] {
  const status = cluster?.status;
  const reportedState = status?.instancesReportedState ?? {};

  const entries = collectInstanceNames(cluster).map((name): InstanceTopologyEntry => {
    const reported = reportedState[name];
    const healthLabel = findHealthLabel(cluster, name);

    // `currentPrimary` is the operator's decision and wins; the per-instance
    // flag is what the instance itself last reported and is the fallback.
    let role: InstanceRole = 'unknown';
    if (status?.currentPrimary) {
      role = status.currentPrimary === name ? 'primary' : 'replica';
    } else if (typeof reported?.isPrimary === 'boolean') {
      role = reported.isPrimary ? 'primary' : 'replica';
    }

    return {
      name,
      role,
      health: healthLabel ? KNOWN_HEALTH_BUCKETS[healthLabel] ?? 'unknown' : 'unknown',
      healthLabel,
      timelineId: typeof reported?.timeLineID === 'number' ? reported.timeLineID : null,
      ip: reported?.ip || null,
    };
  });

  return entries.sort((a, b) => {
    if (a.role !== b.role) {
      if (a.role === 'primary') {
        return -1;
      }
      if (b.role === 'primary') {
        return 1;
      }
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * True when the operator has picked a different instance to be primary than the
 * one currently serving writes.
 *
 * A missing value on either side is treated as "no evidence", not as a
 * mismatch, so a bootstrapping cluster is not reported as switching over.
 */
export function isSwitchoverInProgress(cluster: CnpgClusterLike | undefined): boolean {
  const { currentPrimary, targetPrimary } = cluster?.status ?? {};

  return Boolean(currentPrimary && targetPrimary && currentPrimary !== targetPrimary);
}
