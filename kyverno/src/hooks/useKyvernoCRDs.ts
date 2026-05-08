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
  kyvernoV2Reports: boolean; // kyverno.io/v2 (Admission/BackgroundScan reports)
  ephemeralReports: boolean; // reports.kyverno.io/v1 (EphemeralReport, ClusterEphemeralReport)
  loading: boolean;
}

async function checkAPIGroup(path: string): Promise<boolean> {
  try {
    await ApiProxy.request(path, { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}

export function useKyvernoCRDs(): KyvernoCRDStatus {
  const cluster = K8s.useCluster();
  const [status, setStatus] = useState<KyvernoCRDStatus>({
    legacy: false,
    cel: false,
    cleanup: false,
    reports: false,
    exceptions: false,
    kyvernoV2Reports: false,
    ephemeralReports: false,
    loading: true,
  });

  useEffect(() => {
    let isCancelled = false;
    setStatus(prev => ({ ...prev, loading: true }));

    async function detect() {
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

      if (!isCancelled) {
        setStatus({
          legacy,
          cel,
          cleanup,
          reports,
          exceptions,
          kyvernoV2Reports,
          ephemeralReports,
          loading: false,
        });
      }
    }

    detect();

    return () => {
      isCancelled = true;
    };
  }, [cluster]);

  return status;
}
