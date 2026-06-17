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
import { bucketReportResults, PolicyResultCounts } from './policyResultBucket';

export type { PolicyResultCounts };

export interface PolicyResultLookup {
  forCluster(name: string): PolicyResultCounts | undefined;
  forNamespaced(name: string, namespace: string): PolicyResultCounts | undefined;
  loading: boolean;
}

/**
 * Aggregates PolicyReport / ClusterPolicyReport results by policy name so list
 * views can show "X of Y failed" without each row re-walking every report.
 *
 * The actual bucketing logic lives in `policyResultBucket.ts` so it can be
 * unit-tested without the Headlamp SDK shim.
 */
export function usePolicyResultCounts(): PolicyResultLookup {
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();

  return useMemo(() => {
    const { cluster, namespaced } = bucketReportResults([
      ...(policyReports || []),
      ...(clusterPolicyReports || []),
    ]);

    return {
      forCluster: name => cluster.get(name),
      forNamespaced: (name, namespace) => namespaced.get(`${namespace}/${name}`),
      // Loading until BOTH streams resolve — partial data would undercount per-row totals.
      loading: policyReports === null || clusterPolicyReports === null,
    };
  }, [policyReports, clusterPolicyReports]);
}
