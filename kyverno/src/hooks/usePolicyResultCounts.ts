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
import { ClusterPolicyReport, ClusterReport, PolicyReport, Report } from '../resources/policyReport';
import { bucketReportResults, PolicyResultCounts } from './policyResultBucket';
import { useKyvernoCRDs } from './useKyvernoCRDs';

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
  const crds = useKyvernoCRDs();
  const { items: policyReports } = PolicyReport.useList();
  const { items: clusterPolicyReports } = ClusterPolicyReport.useList();
  const { items: openReports } = Report.useList();
  const { items: openClusterReports } = ClusterReport.useList();

  return useMemo(() => {
    const effectivePolicyReports = crds.wgreports ? policyReports : [];
    const effectiveClusterPolicyReports = crds.wgreports ? clusterPolicyReports : [];
    const effectiveOpenReports = crds.openreports ? openReports : [];
    const effectiveOpenClusterReports = crds.openreports ? openClusterReports : [];

    const { cluster, namespaced } = bucketReportResults([
      ...(effectivePolicyReports || []),
      ...(effectiveClusterPolicyReports || []),
      ...(effectiveOpenReports || []),
      ...(effectiveOpenClusterReports || []),
    ]);

    const isWgreportsLoading = crds.wgreports && (policyReports === null || clusterPolicyReports === null);
    const isOpenreportsLoading = crds.openreports && (openReports === null || openClusterReports === null);
    const loading = crds.loading || isWgreportsLoading || isOpenreportsLoading;

    return {
      forCluster: name => cluster.get(name),
      forNamespaced: (name, namespace) => namespaced.get(`${namespace}/${name}`),
      loading,
    };
  }, [crds, policyReports, clusterPolicyReports, openReports, openClusterReports]);
}
