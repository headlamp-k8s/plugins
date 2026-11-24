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

function normalizeSource(items: PolicyReportResource[] | null, error: unknown): ReportSourceList {
  return {
    items: items?.map(normalizeReport) || null,
    error,
  };
}

function useNamespacedReportLists(cluster?: string, namespace?: string) {
  const [policyReports, policyReportsError] = PolicyReport.useList({ cluster, namespace });
  const [ephemeralReports, ephemeralReportsError] = EphemeralReport.useList({ cluster, namespace });

  return useMemo(
    () => ({
      durable: normalizeSource(policyReports, policyReportsError),
      ephemeral: normalizeSource(ephemeralReports, ephemeralReportsError),
    }),
    [policyReports, policyReportsError, ephemeralReports, ephemeralReportsError]
  );
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
  const [clusterPolicyReports, clusterPolicyReportsError] = ClusterPolicyReport.useList({
    cluster,
  });
  const [clusterEphemeralReports, clusterEphemeralReportsError] = ClusterEphemeralReport.useList({
    cluster,
  });

  return useMemo(
    () =>
      combineReportSources([
        durable,
        normalizeSource(clusterPolicyReports, clusterPolicyReportsError),
        ephemeral,
        normalizeSource(clusterEphemeralReports, clusterEphemeralReportsError),
      ]),
    [
      durable,
      clusterPolicyReports,
      clusterPolicyReportsError,
      ephemeral,
      clusterEphemeralReports,
      clusterEphemeralReportsError,
    ]
  );
}
