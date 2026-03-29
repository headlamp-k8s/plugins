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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';

export interface KyvernoCRDStatus {
  legacy: boolean; // kyverno.io/v1 (ClusterPolicy, Policy)
  cel: boolean; // policies.kyverno.io/v1 (ValidatingPolicy, MutatingPolicy, etc.)
  cleanup: boolean; // kyverno.io/v2 (CleanupPolicy, ClusterCleanupPolicy)
  reports: boolean; // wgpolicyk8s.io/v1alpha2 (PolicyReport, ClusterPolicyReport)
  exceptions: boolean; // kyverno.io/v2 (PolicyException)
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
  const [status, setStatus] = useState<KyvernoCRDStatus>({
    legacy: false,
    cel: false,
    cleanup: false,
    reports: false,
    exceptions: false,
    loading: true,
  });

  useEffect(() => {
    async function detect() {
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

      setStatus({ legacy, cel, cleanup, reports, exceptions, loading: false });
    }

    detect();
  }, []);

  return status;
}
