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
async function findByLabel(type: ResourceType, labelSelector: string): Promise<string | null> {
  const params = new URLSearchParams({ labelSelector });
  let response: { items?: ListItem[] };
  try {
    response = await ApiProxy.request(`/api/v1/${type}?${params}`, { method: 'GET' });
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
          const query = await queryInstant(prefix, 'up');
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

async function discoverPrometheus(): Promise<string | null> {
  for (const [type, label] of [
    ['pods', CUSTOM_LABEL],
    ['services', CUSTOM_LABEL],
    ['pods', COMMON_POD_LABEL],
    ['services', COMMON_SERVICE_LABEL],
  ] as [ResourceType, string][]) {
    const found = await findByLabel(type, label);
    if (found) return found;
  }
  return null;
}

// Same module-level cache-per-cluster + listener pattern as useKyvernoCRDs, so every component
// that renders the health section doesn't each trigger their own discovery search.
const probeCache = new Map<string, PrometheusStatus>();
const inFlight = new Map<string, Promise<PrometheusStatus>>();
const listeners = new Map<string, Set<(status: PrometheusStatus) => void>>();

function notify(cluster: string, status: PrometheusStatus) {
  listeners.get(cluster)?.forEach(fn => fn(status));
}

async function probeCluster(cluster: string): Promise<PrometheusStatus> {
  const existing = inFlight.get(cluster);
  if (existing) return existing;

  const promise = (async () => {
    const prefix = await discoverPrometheus();
    const status: PrometheusStatus = { prefix, loading: false };
    probeCache.set(cluster, status);
    inFlight.delete(cluster);
    notify(cluster, status);
    return status;
  })();

  inFlight.set(cluster, promise);
  return promise;
}

export function usePrometheus(): PrometheusStatus {
  const cluster = K8s.useCluster();
  const cacheKey = cluster ?? '';
  const cached = probeCache.get(cacheKey);
  const [status, setStatus] = useState<PrometheusStatus>(cached ?? initialStatus);

  useEffect(() => {
    let cancelled = false;
    const current = probeCache.get(cacheKey);
    if (current) {
      setStatus(current);
    } else {
      setStatus(initialStatus);
    }

    const listener = (next: PrometheusStatus) => {
      if (!cancelled) setStatus(next);
    };
    const set = listeners.get(cacheKey) ?? new Set();
    set.add(listener);
    listeners.set(cacheKey, set);

    if (!current) {
      void probeCluster(cacheKey);
    }

    return () => {
      cancelled = true;
      set.delete(listener);
      if (set.size === 0) listeners.delete(cacheKey);
    };
  }, [cacheKey]);

  return status;
}
