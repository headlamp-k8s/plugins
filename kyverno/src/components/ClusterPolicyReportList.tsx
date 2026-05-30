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

import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link as MuiLink } from '@mui/material';
import { ClusterPolicyReport } from '../resources/policyReport';
import { SummaryChips } from './common';
import { PolicyReportRow } from './PolicyReportList';
import { ReportViewer } from './ReportViewer';

// ── Pure component for Storybook (no API calls, accepts props directly) ───
export function PureClusterPolicyReportTable({
  items,
  onNameClick,
}: {
  items: PolicyReportRow[];
  onNameClick?: (item: PolicyReportRow) => void;
}) {
  return (
    <Box>
      <SectionHeader title="Cluster Policy Reports" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (row: PolicyReportRow) =>
              onNameClick ? (
                <MuiLink component="button" onClick={() => onNameClick(row)} sx={{ textAlign: 'left' }}>
                  {row.name}
                </MuiLink>
              ) : (
                row.name
              ),
          },
          { label: 'Scope', getter: (row: PolicyReportRow) => row.scope ?? '—' },
          { label: 'Pass', getter: (row: PolicyReportRow) => row.pass },
          { label: 'Fail', getter: (row: PolicyReportRow) => row.fail },
          { label: 'Warn', getter: (row: PolicyReportRow) => row.warn },
          { label: 'Error', getter: (row: PolicyReportRow) => row.error },
          { label: 'Skip', getter: (row: PolicyReportRow) => row.skip },
          {
            label: 'Summary',
            getter: (row: PolicyReportRow) => (
              <SummaryChips summary={{ pass: row.pass, fail: row.fail, warn: row.warn, error: row.error, skip: row.skip }} />
            ),
          },
          {
            label: 'Age',
            getter: (row: PolicyReportRow) =>
              row.creationTimestamp ? (
                <DateLabel date={row.creationTimestamp} format="mini" />
              ) : (
                '—'
              ),
          },
        ]}
        data={items}
        emptyMessage="No cluster policy reports found"
      />
    </Box>
  );
}

function openClusterReportActivity(item: ClusterPolicyReport) {
  Activity.launch({
    id: `kyverno-cpolr-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-check" />,
    title: item.jsonData.metadata.name,
    content: (
      <ReportViewer name={item.jsonData.metadata.name} isClusterScoped />
    ),
  });
}

export function ClusterPolicyReportList() {
  return (
    <ResourceListView
      title="Cluster Policy Reports"
      resourceClass={ClusterPolicyReport}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openClusterReportActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'scope',
          label: 'Scope',
          getValue: item => {
            const scope = item.scope;
            if (!scope) return '';
            return `${scope.kind}/${scope.name}`;
          },
        },
        {
          id: 'pass',
          label: 'Pass',
          getValue: item => item.summary.pass || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'fail',
          label: 'Fail',
          getValue: item => item.summary.fail || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'warn',
          label: 'Warn',
          getValue: item => item.summary.warn || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'error',
          label: 'Error',
          getValue: item => item.summary.error || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'skip',
          label: 'Skip',
          getValue: item => item.summary.skip || 0,
          gridTemplate: '0.5fr',
        },
        {
          id: 'summary',
          label: 'Summary',
          render: item => <SummaryChips summary={item.summary} />,
          getValue: item => item.totalResults,
        },
        'age',
      ]}
    />
  );
}
