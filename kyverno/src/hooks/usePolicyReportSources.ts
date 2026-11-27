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
import { ClusterEphemeralReport, EphemeralReport } from '../resources/kyvernoReports';
import { ClusterPolicyReport, PolicyReport } from '../resources/policyReport';
import {
  CombinedReportSources,
  combineNamespacedReportSources,
  combineReportSources,
  normalizeReportResource,
  PolicyReportSource,
  ReportSourceList,
} from './policyReportSources';

type PolicyReportResource =
  | PolicyReport
  | ClusterPolicyReport
  | EphemeralReport
  | ClusterEphemeralReport;

export type { PolicyReportSource } from './policyReportSources';

export type PolicyReportSources = CombinedReportSources;

function normalizeReport(report: PolicyReportResource): PolicyReportSource {
  return normalizeReportResource({
    cluster: report.cluster,
    metadata: {
      name: report.jsonData.metadata.name,
      namespace: report.jsonData.metadata.namespace,
      labels: report.jsonData.metadata.labels,
      annotations: report.jsonData.metadata.annotations,
      ownerReferences: report.jsonData.metadata.ownerReferences,
    },
    scope: report.scope,
    summary: report.summary,
    results: report.results,
  });
}

type ReportListQuery = [PolicyReportResource[] | null, unknown] & {
  items?: PolicyReportResource[] | null;
  isLoading?: boolean;
  errors?: readonly unknown[] | null;
};

function useReportSource(query: ReportListQuery): ReportSourceList {
  const [legacyItems, legacyError] = query;
  const items = query.items ?? legacyItems;
  const { errors, isLoading } = query;

  return useMemo(
    () => ({
      items: items?.map(normalizeReport) ?? null,
      loading: isLoading ?? (items === null && !legacyError),
      errors: errors?.length ? errors : legacyError ? [legacyError] : [],
    }),
    [items, isLoading, errors, legacyError]
  );
}

function useNamespacedReportLists(cluster?: string, namespace?: string) {
  const durable = useReportSource(PolicyReport.useList({ cluster, namespace }));
  const ephemeral = useReportSource(EphemeralReport.useList({ cluster, namespace }));
  return { durable, ephemeral };
}

/** A namespaced policy only needs reports from its own namespace. */
export function useNamespacedPolicyReportSources(
  namespace: string,
  cluster?: string
): PolicyReportSources {
  const { durable, ephemeral } = useNamespacedReportLists(cluster, namespace);
  return useMemo(() => combineNamespacedReportSources(durable, ephemeral), [durable, ephemeral]);
}

export function usePolicyReportSources(cluster?: string): PolicyReportSources {
  const { durable, ephemeral } = useNamespacedReportLists(cluster);
  const clusterPolicyReports = useReportSource(ClusterPolicyReport.useList({ cluster }));
  const clusterEphemeralReports = useReportSource(ClusterEphemeralReport.useList({ cluster }));

  return useMemo(
    () => combineReportSources([durable, clusterPolicyReports, ephemeral, clusterEphemeralReports]),
    [durable, clusterPolicyReports, ephemeral, clusterEphemeralReports]
  );
}
