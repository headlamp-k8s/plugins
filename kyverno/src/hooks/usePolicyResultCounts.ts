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

import { useMemo } from 'react';
import { ClusterPolicyReport, PolicyReport } from '../resources/policyReport';

export interface PolicyResultCounts {
  fail: number;
  total: number;
}

export interface PolicyResultLookup {
  forCluster(name: string): PolicyResultCounts | undefined;
  forNamespaced(name: string, namespace: string): PolicyResultCounts | undefined;
  loading: boolean;
}

/**
 * Aggregates PolicyReport / ClusterPolicyReport results by policy name so list
 * views can show "X of Y failed" without each row re-walking every report.
 *
 * Kyverno prefixes namespaced-policy results with "<namespace>/<name>"; cluster
 * policies stay unprefixed. The two maps keep these spaces separate so a
 * ClusterPolicy and a same-named Policy in some namespace don't merge counts.
 */
export function usePolicyResultCounts(): PolicyResultLookup {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  return useMemo(() => {
    const cluster = new Map<string, PolicyResultCounts>();
    const namespaced = new Map<string, PolicyResultCounts>();

    function bump(map: Map<string, PolicyResultCounts>, key: string, isFail: boolean) {
      const entry = map.get(key) || { fail: 0, total: 0 };
      entry.total += 1;
      if (isFail) entry.fail += 1;
      map.set(key, entry);
    }

    for (const report of [...(policyReports || []), ...(clusterPolicyReports || [])]) {
      for (const r of report.results) {
        const isFail = r.result === 'fail' || r.result === 'error';
        const slash = r.policy.indexOf('/');
        if (slash > 0) {
          bump(namespaced, r.policy, isFail);
        } else {
          bump(cluster, r.policy, isFail);
        }
      }
    }

    return {
      forCluster: name => cluster.get(name),
      forNamespaced: (name, namespace) => namespaced.get(`${namespace}/${name}`),
      // Loading until BOTH streams resolve — partial data would undercount per-row totals.
      loading: policyReports === null || clusterPolicyReports === null,
    };
  }, [policyReports, clusterPolicyReports]);
}
