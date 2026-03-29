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

export interface KyvernoCRDStatus {
  legacy: boolean; // kyverno.io/v1 (ClusterPolicy, Policy)
  cel: boolean; // policies.kyverno.io/v1 (ValidatingPolicy, MutatingPolicy, etc.)
  cleanup: boolean; // kyverno.io/v2 (CleanupPolicy, ClusterCleanupPolicy)
  reports: boolean; // wgpolicyk8s.io/v1alpha2 (PolicyReport, ClusterPolicyReport)
  exceptions: boolean; // kyverno.io/v2 (PolicyException)
  loading: boolean;
}

const initialStatus: KyvernoCRDStatus = {
  legacy: false,
  cel: false,
  cleanup: false,
  reports: false,
  exceptions: false,
  loading: true,
};

async function checkAPIGroup(path: string): Promise<boolean> {
  try {
    await ApiProxy.request(path, { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}

// Module-level cache keyed by cluster name. Every CRDGuard mount would otherwise
// fire 3-4 probe requests; with this cache each cluster pays the cost once per
// page load and subsequent guards reuse the result synchronously.
const probeCache = new Map<string, KyvernoCRDStatus>();
const inFlight = new Map<string, Promise<KyvernoCRDStatus>>();
const listeners = new Map<string, Set<(status: KyvernoCRDStatus) => void>>();

function notify(cluster: string, status: KyvernoCRDStatus) {
  listeners.get(cluster)?.forEach(fn => fn(status));
}

async function probeCluster(cluster: string): Promise<KyvernoCRDStatus> {
  const existing = inFlight.get(cluster);
  if (existing) return existing;

  const promise = (async () => {
    const [legacy, cel, reports] = await Promise.all([
      checkAPIGroup('/apis/kyverno.io/v1'),
      checkAPIGroup('/apis/policies.kyverno.io/v1'),
      checkAPIGroup('/apis/wgpolicyk8s.io/v1alpha2'),
    ]);

    // kyverno.io/v2 hosts both cleanup and exceptions
    let cleanup = false;
    let exceptions = false;
    if (legacy) {
      const v2 = await checkAPIGroup('/apis/kyverno.io/v2');
      if (v2) {
        cleanup = true;
        exceptions = true;
      }
    }

    const status: KyvernoCRDStatus = { legacy, cel, cleanup, reports, exceptions, loading: false };
    probeCache.set(cluster, status);
    inFlight.delete(cluster);
    notify(cluster, status);
    return status;
  })();

  inFlight.set(cluster, promise);
  return promise;
}

export function useKyvernoCRDs(): KyvernoCRDStatus {
  const cluster = K8s.useCluster();
  const cacheKey = cluster ?? '';
  const cached = probeCache.get(cacheKey);
  const [status, setStatus] = useState<KyvernoCRDStatus>(cached ?? initialStatus);

  useEffect(() => {
    let cancelled = false;
    const current = probeCache.get(cacheKey);
    if (current) {
      setStatus(current);
    } else {
      setStatus(initialStatus);
    }

    const listener = (next: KyvernoCRDStatus) => {
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
