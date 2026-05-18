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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportInterface,
  PolicyReportResult,
  PolicyReportSummary,
} from '../resources/policyReport';
import { SummaryChips } from './common';
import { ResultsTable } from './ResultsTable';

// Any report class (PolicyReport, ClusterPolicyReport, AdmissionReport, EphemeralReport, ...)
// must expose these accessors. They normalise the wgpolicyk8s and kyverno.io schema differences.
export interface ReportLike {
  jsonData: PolicyReportInterface;
  summary: PolicyReportSummary;
  results: PolicyReportResult[];
  scope?: PolicyReportInterface['scope'];
}

// Generic over the item type so we don't need an `unknown as ReportLike` cast at the
// use site. Each concrete class (PolicyReport, AdmissionReport, ...) exposes the
// required summary/results/scope getters via a shared base — they all satisfy
// `ReportClass<T extends ReportLike>`.
export interface ReportClass<T extends ReportLike> {
  useGet: (name: string, namespace?: string) => readonly [T | null, unknown];
}

interface ReportViewerProps<T extends ReportLike = ReportLike> {
  name: string;
  namespace?: string;
  isClusterScoped?: boolean;
  /** Override the resource class (e.g. for AdmissionReport / EphemeralReport). */
  resourceClass?: ReportClass<T>;
}

function ReportSummarySection({ summary }: { summary: PolicyReportSummary }) {
  const { t } = useTranslation();
  return (
    <SectionBox title={t('Summary')}>
      <Box sx={{ mb: 2 }}>
        <SummaryChips summary={summary} />
      </Box>
      <NameValueTable
        rows={[
          { name: t('Pass'), value: String(summary.pass || 0) },
          { name: t('Fail'), value: String(summary.fail || 0) },
          { name: t('Warn'), value: String(summary.warn || 0) },
          { name: t('Error'), value: String(summary.error || 0) },
          { name: t('Skip'), value: String(summary.skip || 0) },
        ]}
      />
    </SectionBox>
  );
}

function ReportResultsSection({ results }: { results: PolicyReportResult[] }) {
  const { t } = useTranslation();
  return (
    <SectionBox title={t('Results ({{count}})', { count: results.length })}>
      <ResultsTable results={results} />
    </SectionBox>
  );
}

function ReportContent({ report }: { report: ReportLike }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title={t('Details')}>
        <NameValueTable
          rows={[
            { name: t('Name'), value: report.jsonData.metadata.name },
            ...(report.jsonData.metadata.namespace
              ? [{ name: t('Namespace'), value: report.jsonData.metadata.namespace }]
              : []),
            ...(report.scope
              ? [{ name: t('Scope'), value: `${report.scope.kind}/${report.scope.name}` }]
              : []),
            {
              name: t('Created'),
              value: report.jsonData.metadata.creationTimestamp,
            },
          ]}
        />
      </SectionBox>
      <ReportSummarySection summary={report.summary} />
      <ReportResultsSection results={report.results} />
    </Box>
  );
}

export function ReportViewer<T extends ReportLike = ReportLike>({
  name,
  namespace,
  isClusterScoped,
  resourceClass,
}: ReportViewerProps<T>) {
  const { t } = useTranslation();
  // PolicyReport/ClusterPolicyReport's static-side `useGet<K extends KubeObject>` is
  // wider than ReportClass<ReportLike>, so we cast through unknown here. The runtime
  // shape is enforced by the shared base class accessors.
  const fallback = isClusterScoped ? ClusterPolicyReport : PolicyReport;
  const ResourceClass: ReportClass<ReportLike> =
    (resourceClass as ReportClass<ReportLike> | undefined) ??
    (fallback as unknown as ReportClass<ReportLike>);
  const [report, error] = ResourceClass.useGet(name, namespace);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          {t('Failed to load report: {{error}}', { error: String(error) })}
        </Typography>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ReportContent report={report} />;
}
