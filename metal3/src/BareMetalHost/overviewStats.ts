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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { composeStatus } from './HostStatusLabel';

/** Fleet-level counts derived from the BareMetalHost list, for the overview page. */
export interface OverviewStats {
  total: number;
  /** Provisioning state is `available`, i.e. free to be provisioned. */
  available: number;
  /** Provisioning state is `provisioned`. */
  provisioned: number;
  /** Operational status is an error. */
  error: number;
  /** `spec.online` is explicitly false. */
  offline: number;
  /** Has a `spec.consumerRef`, i.e. claimed by a consumer. */
  claimed: number;
  /** No consumer, i.e. still allocatable. */
  free: number;
  /** Host count per provisioning state. */
  byProvisioningState: Record<string, number>;
  /** Host count per operational status. */
  byOperationalStatus: Record<string, number>;
  /**
   * Hosts needing attention: an error severity, a delayed retry, or a set error type,
   * error-first. `detached` (intentional) and `servicing` (a normal transient) are
   * treated as informational, not problems.
   */
  attention: KubeObject[];
  /** Hosts observed powered on (`status.poweredOn === true`), not the desired intent. */
  poweredOn: number;
  /** Hosts backing a Metal3Machine (`spec.consumerRef.kind === 'Metal3Machine'`). */
  backingMachine: number;
}

function bump(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

/**
 * Aggregates a list of BareMetalHosts into the fleet counts the overview page shows.
 * Pure over the four status axes and `spec` (via `composeStatus`), so it can be
 * unit-tested without a running cluster.
 *
 * @param hosts - The BareMetalHost list.
 * @returns Totals, per-axis breakdowns, and the error-first attention list.
 */
export function computeOverview(hosts: KubeObject[]): OverviewStats {
  const stats: OverviewStats = {
    total: hosts.length,
    available: 0,
    provisioned: 0,
    error: 0,
    offline: 0,
    claimed: 0,
    free: 0,
    byProvisioningState: {},
    byOperationalStatus: {},
    attention: [],
    poweredOn: 0,
    backingMachine: 0,
  };

  hosts.forEach(host => {
    const s = composeStatus(host.jsonData);
    if (host.jsonData.status?.poweredOn === true) {
      stats.poweredOn += 1;
    }
    if (host.jsonData.spec?.consumerRef?.kind === 'Metal3Machine') {
      stats.backingMachine += 1;
    }
    bump(stats.byOperationalStatus, s.operationalStatus || 'Unknown');
    bump(stats.byProvisioningState, s.provisioningState || 'Unknown');
    if (s.provisioningState === 'available') {
      stats.available += 1;
    }
    if (s.provisioningState === 'provisioned') {
      stats.provisioned += 1;
    }
    if (s.severity === 'error') {
      stats.error += 1;
    }
    if (host.jsonData.spec?.online === false) {
      stats.offline += 1;
    }
    if (host.jsonData.spec?.consumerRef?.name) {
      stats.claimed += 1;
    } else {
      stats.free += 1;
    }
    // Genuine problems only: an error, a delayed retry, or a set error type. The other
    // warning states, detached and servicing, are informational and are left out.
    if (s.severity === 'error' || s.errorType || s.operationalStatus === 'delayed') {
      stats.attention.push(host);
    }
  });

  // Errors first in the attention list; other non-OK states follow.
  stats.attention.sort((a, b) => {
    const rank = (h: KubeObject) => (composeStatus(h.jsonData).severity === 'error' ? 0 : 1);
    return rank(a) - rank(b);
  });

  return stats;
}

/** Provisioning states that represent an operation in flight. */
export const TRANSITIONAL_STATES = new Set([
  'registering',
  'inspecting',
  'preparing',
  'provisioning',
  'deprovisioning',
  'deleting',
]);

/** Maps a provisioning state to its `status.operationHistory` metric key, if any. */
const HISTORY_KEY: Record<string, string> = {
  registering: 'register',
  inspecting: 'inspect',
  provisioning: 'provision',
  deprovisioning: 'deprovision',
};

/** A metav1.Time is unset when absent, null, or the Go zero time. */
function isUnsetTime(t: unknown): boolean {
  return !t || String(t).startsWith('0001-01-01');
}

/** Start time (ms) of the current in-flight operation, or null if not timeable. */
function inFlightStartMs(host: KubeObject): number | null {
  const state = host.jsonData.status?.provisioning?.state;
  const key = state ? HISTORY_KEY[state] : undefined;
  const metric = key ? host.jsonData.status?.operationHistory?.[key] : undefined;
  if (!metric || isUnsetTime(metric.start) || !isUnsetTime(metric.end)) {
    return null;
  }
  const t = Date.parse(metric.start);
  return Number.isNaN(t) ? null : t;
}

/**
 * How long, in milliseconds, the host has been in its current in-flight
 * operation, or null when the state carries no operation we can time (no
 * `operationHistory` entry, or the operation has already finished). Uses the
 * operation's start rather than `status.lastUpdated`, which re-stamps on every
 * reconcile and so cannot measure dwell.
 *
 * @param host - The BareMetalHost.
 * @param nowMs - The current time in milliseconds, passed in so this stays pure.
 */
export function timeInState(host: KubeObject, nowMs: number): number | null {
  const start = inFlightStartMs(host);
  return start === null ? null : Math.max(0, nowMs - start);
}

/** A host currently mid-operation, with how long it has been there. */
export interface InProgressHost {
  host: KubeObject;
  state: string;
  durationMs: number | null;
}

/**
 * The hosts in a transitional provisioning state, each with its dwell time,
 * sorted longest first so a stalled host rises to the top.
 *
 * @param hosts - The BareMetalHost list.
 * @param nowMs - The current time in milliseconds.
 */
export function inProgressHosts(hosts: KubeObject[], nowMs: number): InProgressHost[] {
  return hosts
    .filter(h => TRANSITIONAL_STATES.has(h.jsonData.status?.provisioning?.state))
    .map(h => ({
      host: h,
      state: h.jsonData.status.provisioning.state as string,
      durationMs: timeInState(h, nowMs),
    }))
    .sort((a, b) => (b.durationMs ?? -1) - (a.durationMs ?? -1));
}

/** A named group of hosts, treated as one fleet on the overview. */
export interface Fleet {
  name: string;
  hosts: KubeObject[];
}

/** The distinct label keys present across the hosts, sorted, for the group-by control. */
export function labelKeys(hosts: KubeObject[]): string[] {
  const keys = new Set<string>();
  hosts.forEach(h => {
    Object.keys(h.jsonData.metadata?.labels ?? {}).forEach(k => keys.add(k));
  });
  return [...keys].sort();
}

/**
 * Groups hosts into fleets by the value of a label key. Hosts missing the label
 * fall into a "(no <key>)" fleet. An empty key returns a single "All hosts" fleet,
 * since Metal3 has no fleet resource and a label is the only grouping we have.
 *
 * @param hosts - The BareMetalHost list.
 * @param labelKey - The label whose values define the fleets, or '' for no grouping.
 */
export function groupByLabel(hosts: KubeObject[], labelKey: string): Fleet[] {
  if (!labelKey) {
    return [{ name: 'All hosts', hosts }];
  }
  const groups = new Map<string, KubeObject[]>();
  hosts.forEach(h => {
    const value = h.jsonData.metadata?.labels?.[labelKey];
    // Missing label vs a present-but-empty value are distinct; both need a usable name.
    const name = value === undefined ? `(no ${labelKey})` : value === '' ? '(empty)' : value;
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name)!.push(h);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, hs]) => ({ name, hosts: hs }));
}
