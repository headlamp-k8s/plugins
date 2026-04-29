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

interface ReportViewerProps {
  name: string;
  namespace?: string;
  isClusterScoped?: boolean;
}

function ReportSummarySection({ summary }: { summary: PolicyReportSummary }) {
  return (
    <SectionBox title="Summary">
      <Box sx={{ mb: 2 }}>
        <SummaryChips summary={summary} />
      </Box>
      <NameValueTable
        rows={[
          { name: 'Pass', value: String(summary.pass || 0) },
          { name: 'Fail', value: String(summary.fail || 0) },
          { name: 'Warn', value: String(summary.warn || 0) },
          { name: 'Error', value: String(summary.error || 0) },
          { name: 'Skip', value: String(summary.skip || 0) },
        ]}
      />
    </SectionBox>
  );
}

function ReportResultsSection({ results }: { results: PolicyReportResult[] }) {
  return (
    <SectionBox title={`Results (${results.length})`}>
      <ResultsTable results={results} />
    </SectionBox>
  );
}

function ReportContent({
  report,
}: {
  report: { jsonData: PolicyReportInterface; summary: PolicyReportSummary; results: PolicyReportResult[]; scope?: PolicyReportInterface['scope'] };
}) {
  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title="Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: report.jsonData.metadata.name },
            ...(report.jsonData.metadata.namespace
              ? [{ name: 'Namespace', value: report.jsonData.metadata.namespace }]
              : []),
            ...(report.scope
              ? [{ name: 'Scope', value: `${report.scope.kind}/${report.scope.name}` }]
              : []),
            {
              name: 'Created',
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

export function ReportViewer({ name, namespace, isClusterScoped }: ReportViewerProps) {
  const ResourceClass = isClusterScoped ? ClusterPolicyReport : PolicyReport;
  const [report, error] = ResourceClass.useGet(name, namespace);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load report: {String(error)}</Typography>
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
