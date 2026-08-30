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
import { combineReportSources } from './policyReportSources';

export type PolicyReportSource =
  | PolicyReport
  | ClusterPolicyReport
  | EphemeralReport
  | ClusterEphemeralReport;

export interface PolicyReportSources {
  reports: PolicyReportSource[];
  loading: boolean;
}

export function usePolicyReportSources(): PolicyReportSources {
  const { items: policyReports, error: policyReportsError } = PolicyReport.useList();
  const { items: clusterPolicyReports, error: clusterPolicyReportsError } =
    ClusterPolicyReport.useList();
  const { items: ephemeralReports, error: ephemeralReportsError } = EphemeralReport.useList();
  const { items: clusterEphemeralReports, error: clusterEphemeralReportsError } =
    ClusterEphemeralReport.useList();

  return useMemo(
    () =>
      combineReportSources<PolicyReportSource>([
        { items: policyReports, error: policyReportsError },
        { items: clusterPolicyReports, error: clusterPolicyReportsError },
        { items: ephemeralReports, error: ephemeralReportsError },
        { items: clusterEphemeralReports, error: clusterEphemeralReportsError },
      ]),
    [
      policyReports,
      policyReportsError,
      clusterPolicyReports,
      clusterPolicyReportsError,
      ephemeralReports,
      ephemeralReportsError,
      clusterEphemeralReports,
      clusterEphemeralReportsError,
    ]
  );
}
