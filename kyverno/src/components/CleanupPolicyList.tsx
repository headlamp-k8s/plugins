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
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DateLabel, SectionHeader, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip } from '@mui/material';
import { CleanupPolicy, ClusterCleanupPolicy } from '../resources/cleanupPolicy';

// ── Pure components for Storybook (no API calls, accepts props directly) ───
export interface CleanupPolicyRow {
  name: string;
  namespace?: string;
  ready: boolean;
  schedule: string;
  lastExecutionTime?: string;
  creationTimestamp?: string;
}

export function PureCleanupPolicyTable({ items }: { items: CleanupPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Cleanup Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: CleanupPolicyRow) => row.name },
          { label: 'Namespace', getter: (row: CleanupPolicyRow) => row.namespace ?? '—' },
          { label: 'Ready', getter: (row: CleanupPolicyRow) => <Chip label={row.ready ? 'True' : 'False'} color={row.ready ? 'success' : 'error'} size="small" /> },
          { label: 'Schedule', getter: (row: CleanupPolicyRow) => row.schedule },
          { label: 'Last Execution', getter: (row: CleanupPolicyRow) => row.lastExecutionTime || '-' },
          { label: 'Age', getter: (row: CleanupPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No cleanup policies found"
      />
    </Box>
  );
}

export function PureClusterCleanupPolicyTable({ items }: { items: CleanupPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Cluster Cleanup Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: CleanupPolicyRow) => row.name },
          { label: 'Ready', getter: (row: CleanupPolicyRow) => <Chip label={row.ready ? 'True' : 'False'} color={row.ready ? 'success' : 'error'} size="small" /> },
          { label: 'Schedule', getter: (row: CleanupPolicyRow) => row.schedule },
          { label: 'Last Execution', getter: (row: CleanupPolicyRow) => row.lastExecutionTime || '-' },
          { label: 'Age', getter: (row: CleanupPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No cluster cleanup policies found"
      />
    </Box>
  );
}

export function CleanupPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cleanup Policies')}
      resourceClass={CleanupPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        'namespace',
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => (
            <Chip
              label={item.ready ? 'True' : 'False'}
              color={item.ready ? 'success' : 'error'}
              size="small"
            />
          ),
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: t('Schedule'),
          getValue: item => item.schedule,
        },
        {
          id: 'lastExecution',
          label: t('Last Execution'),
          getValue: item => item.lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}

export function ClusterCleanupPolicyList() {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cluster Cleanup Policies')}
      resourceClass={ClusterCleanupPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => (
            <Chip
              label={item.ready ? 'True' : 'False'}
              color={item.ready ? 'success' : 'error'}
              size="small"
            />
          ),
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: t('Schedule'),
          getValue: item => item.schedule,
        },
        {
          id: 'lastExecution',
          label: t('Last Execution'),
          getValue: item => item.lastExecutionTime || '-',
        },
        'age',
      ]}
    />
  );
}
