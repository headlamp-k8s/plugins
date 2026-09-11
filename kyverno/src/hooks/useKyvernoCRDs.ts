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

export type CRDAvailability = boolean | undefined;

export interface KyvernoCRDStatus {
  legacy: CRDAvailability; // kyverno.io/v1 (ClusterPolicy, Policy)
  cel: CRDAvailability; // policies.kyverno.io/v1 (ValidatingPolicy, MutatingPolicy, etc.)
  cleanup: CRDAvailability; // kyverno.io/v2 (CleanupPolicy, ClusterCleanupPolicy)
  reports: CRDAvailability; // wgpolicyk8s.io/v1alpha2 (PolicyReport, ClusterPolicyReport)
  exceptions: CRDAvailability; // kyverno.io/v2 (PolicyException)
  kyvernoV2Reports: CRDAvailability; // kyverno.io/v2 (Admission/BackgroundScan reports)
  ephemeralReports: CRDAvailability; // reports.kyverno.io/v1 (EphemeralReport, ClusterEphemeralReport)
  loading: boolean;
}

const initialStatus: KyvernoCRDStatus = {
  legacy: undefined,
  cel: undefined,
  cleanup: undefined,
  reports: undefined,
  exceptions: undefined,
  kyvernoV2Reports: undefined,
  ephemeralReports: undefined,
  loading: true,
};

async function checkAPIGroup(path: string): Promise<CRDAvailability> {
  try {
    await ApiProxy.request(path, { method: 'GET' });
    return true;
  } catch (error) {
    return (error as { status?: number }).status === 404 ? false : undefined;
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
    const [legacy, cel, reports, ephemeralReports] = await Promise.all([
      checkAPIGroup('/apis/kyverno.io/v1'),
      checkAPIGroup('/apis/policies.kyverno.io/v1'),
      checkAPIGroup('/apis/wgpolicyk8s.io/v1alpha2'),
      checkAPIGroup('/apis/reports.kyverno.io/v1'),
    ]);

    // kyverno.io/v2 hosts cleanup, exceptions, and admission/background scan reports.
    // The API-group-level probe doesn't tell us *which* CRDs are inside, so we treat
    // all v2 features as available together, matching what stock Kyverno installs.
    let cleanup = false;
    let exceptions = false;
    let kyvernoV2Reports = false;
    if (legacy) {
      const v2 = await checkAPIGroup('/apis/kyverno.io/v2');
      if (v2) {
        cleanup = true;
        exceptions = true;
        kyvernoV2Reports = true;
      }
    }

    const status: KyvernoCRDStatus = {
      legacy,
      cel,
      cleanup,
      reports,
      exceptions,
      kyvernoV2Reports,
      ephemeralReports,
      loading: false,
    };
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
