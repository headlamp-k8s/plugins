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

import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { queryInstant } from '../resources/prometheusQueries';

export interface PrometheusStatus {
  // "<namespace>/<pods|services>/<name>:<port>", ready to pass straight to
  // prometheusQueries.ts, or null if no reachable Prometheus was found.
  prefix: string | null;
  loading: boolean;
}

const initialStatus: PrometheusStatus = { prefix: null, loading: true };

// Same opt-in label the official `prometheus` plugin looks for first, so a Prometheus a user
// already tagged for that plugin is found here too with no extra setup. Falls back to the
// labels a stock Prometheus install carries.
const CUSTOM_LABEL = 'headlamp-prometheus=true';
const COMMON_POD_LABEL = 'app.kubernetes.io/name=prometheus';
const COMMON_SERVICE_LABEL = 'app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server';
const DEFAULT_PORT = '9090';

type ResourceType = 'pods' | 'services';

interface ListItem {
  metadata: { name: string; namespace: string };
  spec: {
    containers?: { ports?: { containerPort: number; protocol: string }[] }[];
    ports?: { port: number; protocol: string }[];
  };
}

function portsFromItem(type: ResourceType, item: ListItem): string[] {
  const ports: string[] =
    type === 'pods'
      ? (item.spec.containers ?? [])
          .flatMap(c => c.ports ?? [])
          .filter(p => p.protocol === 'TCP')
          .map(p => String(p.containerPort))
      : (item.spec.ports ?? []).filter(p => p.protocol === 'TCP').map(p => String(p.port));
  return ports.length > 0 ? ports : [DEFAULT_PORT];
}

// A label selector can match several pods/services (e.g. multiple Prometheus replicas, or a
// stale leftover next to the real one). Trying only the first result would let an unreachable
// item hide a perfectly reachable one further down the list, so every returned item gets tried,
// in order, stopping at the first one that actually answers a query.
//
// `cluster` is threaded through both the list request and the validation query explicitly,
// rather than relying on ApiProxy's default "whichever cluster is currently active" behavior:
// this function runs inside an async probe that can still be in flight after the user has
// switched clusters, and ApiProxy.request reads the active cluster fresh at the moment each
// request actually fires, not at the moment probeCluster captured its `cluster` argument. Without
// this, a probe started for cluster A can have its list/validation requests silently redirected
// to cluster B mid-flight, and whatever it finds there gets cached under A's key.
async function findByLabel(
  type: ResourceType,
  labelSelector: string,
  cluster: string
): Promise<string | null> {
  const params = new URLSearchParams({ labelSelector });
  let response: { items?: ListItem[] };
  try {
    response = await ApiProxy.request(`/api/v1/${type}?${params}`, { method: 'GET', cluster });
  } catch {
    return null;
  }

  for (const item of response.items ?? []) {
    const candidates = portsFromItem(type, item).map(
      port => `${item.metadata.namespace}/${type}/${item.metadata.name}:${port}`
    );

    const results = await Promise.all(
      candidates.map(async prefix => {
        try {
          const query = await queryInstant(prefix, 'up', cluster);
          return query.status === 'success' ? prefix : null;
        } catch {
          return null;
        }
      })
    );

    const found = results.find(r => r !== null);
    if (found) return found;
  }

  return null;
}

// Services tried before pods within each label tier: a Service's name is stable across a
// Prometheus rollout, a Pod's isn't (a new replica gets a new generated name), so preferring a
// Service when both match avoids caching a prefix a routine rollout is about to turn into a dead
// proxy path. Doesn't eliminate the problem (a setup with only a matching Pod and no matching
// Service still caches a pod-based prefix), the TTL re-probe below covers what this can't.
async function discoverPrometheus(cluster: string): Promise<string | null> {
  for (const [type, label] of [
    ['services', CUSTOM_LABEL],
    ['pods', CUSTOM_LABEL],
    ['services', COMMON_SERVICE_LABEL],
    ['pods', COMMON_POD_LABEL],
  ] as [ResourceType, string][]) {
    const found = await findByLabel(type, label, cluster);
    if (found) return found;
  }
  return null;
}

// A discovered prefix is never structurally re-validated once cached: a Prometheus rollout can
// replace the pod a cached pod-based prefix names, or the very first probe can lose a race against
// Prometheus still starting up and cache a dead-end `null` for the rest of the session, with
// nothing to ever notice either and re-probe. PROBE_TTL_MS bounds how long either kind of stale
// result survives; re-probing on a timer rather than reacting to a query failure keeps this
// entirely self-contained in this hook instead of needing PolicyEngineHealth (or any other
// consumer) to report failures back here.
const PROBE_TTL_MS = 5 * 60_000;

interface CacheEntry {
  status: PrometheusStatus;
  probedAt: number;
}

// Same module-level cache-per-cluster + listener pattern as useKyvernoCRDs, so every component
// that renders the health section doesn't each trigger their own discovery search.
const probeCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PrometheusStatus>>();
const listeners = new Map<string, Set<(status: PrometheusStatus) => void>>();

function notify(cluster: string, status: PrometheusStatus) {
  listeners.get(cluster)?.forEach(fn => fn(status));
}

async function probeCluster(cluster: string): Promise<PrometheusStatus> {
  const existing = inFlight.get(cluster);
  if (existing) return existing;

  const promise = (async () => {
    const prefix = await discoverPrometheus(cluster);
    const status: PrometheusStatus = { prefix, loading: false };
    probeCache.set(cluster, { status, probedAt: Date.now() });
    inFlight.delete(cluster);
    notify(cluster, status);
    return status;
  })();

  inFlight.set(cluster, promise);
  return promise;
}

function isStale(entry: CacheEntry | undefined): boolean {
  return !entry || Date.now() - entry.probedAt > PROBE_TTL_MS;
}

export function usePrometheus(): PrometheusStatus {
  const cluster = K8s.useCluster();
  const cacheKey = cluster ?? '';
  const cached = probeCache.get(cacheKey);
  const [status, setStatus] = useState<PrometheusStatus>(cached?.status ?? initialStatus);

  useEffect(() => {
    let cancelled = false;
    const current = probeCache.get(cacheKey);
    if (current) {
      setStatus(current.status);
    } else {
      setStatus(initialStatus);
    }

    const listener = (next: PrometheusStatus) => {
      if (!cancelled) setStatus(next);
    };
    const set = listeners.get(cacheKey) ?? new Set();
    set.add(listener);
    listeners.set(cacheKey, set);

    let timeoutId: ReturnType<typeof setTimeout>;

    // Re-checks staleness on a timer rather than only on mount/cluster-switch, since this
    // component (the Dashboard's health section) stays mounted far longer than PROBE_TTL_MS. The
    // already-known status keeps rendering immediately throughout, this only refreshes it in the
    // background; probeCluster's own inFlight dedup means several mounted consumers checking at
    // once still only trigger one real discovery request.
    //
    // Scheduled via a setTimeout chain relative to the cache entry's own probedAt, not a fixed
    // setInterval anchored to whenever this effect happened to run: probedAt is only set once an
    // async discovery genuinely finishes, so a fixed-period timer drifts out of phase with it. A
    // tick landing a hair before the TTL has actually elapsed sees "not stale yet" and skips, so
    // the real reprobe doesn't happen until the FOLLOWING tick, silently halving the effective
    // refresh rate. Recomputing the delay from the latest probedAt after every check (and waiting
    // out any reprobe before doing so) keeps this honoring the stated TTL instead of drifting.
    const checkAndReschedule = async () => {
      if (isStale(probeCache.get(cacheKey))) {
        await probeCluster(cacheKey);
      }
      if (cancelled) return;
      const entry = probeCache.get(cacheKey);
      const delay = entry
        ? Math.max(0, PROBE_TTL_MS - (Date.now() - entry.probedAt))
        : PROBE_TTL_MS;
      timeoutId = setTimeout(checkAndReschedule, delay);
    };

    void checkAndReschedule();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      set.delete(listener);
      if (set.size === 0) listeners.delete(cacheKey);
    };
  }, [cacheKey]);

  return status;
}
