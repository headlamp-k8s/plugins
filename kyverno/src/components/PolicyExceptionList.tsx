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
import { DateLabel, SectionHeader, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, Link as MuiLink } from '@mui/material';
import { PolicyException } from '../resources/policyException';
import { ExceptionViewer } from './ExceptionViewer';

// ── Pure component for Storybook (no API calls, accepts props directly) ───
export interface PolicyExceptionRow {
  name: string;
  namespace?: string;
  policyNames: string[];
  exceptionCount: number;
  background: boolean;
  creationTimestamp?: string;
}

export function PurePolicyExceptionTable({
  items,
  onNameClick,
}: {
  items: PolicyExceptionRow[];
  onNameClick?: (item: PolicyExceptionRow) => void;
}) {
  return (
    <Box>
      <SectionHeader title="Policy Exceptions" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (row: PolicyExceptionRow) =>
              onNameClick ? (
                <MuiLink component="button" onClick={() => onNameClick(row)} sx={{ textAlign: 'left' }}>
                  {row.name}
                </MuiLink>
              ) : (
                row.name
              ),
          },
          { label: 'Namespace', getter: (row: PolicyExceptionRow) => row.namespace ?? '—' },
          {
            label: 'Policies',
            getter: (row: PolicyExceptionRow) => (
              <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                {row.policyNames.map(p => (
                  <Chip key={p} label={p} size="small" variant="outlined" />
                ))}
              </span>
            ),
          },
          { label: 'Rules', getter: (row: PolicyExceptionRow) => row.exceptionCount },
          { label: 'Background', getter: (row: PolicyExceptionRow) => (row.background ? 'True' : 'False') },
          { label: 'Age', getter: (row: PolicyExceptionRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No policy exceptions found"
      />
    </Box>
  );
}

function openExceptionActivity(item: PolicyException) {
  Activity.launch({
    id: `kyverno-polex-${item.jsonData.metadata.namespace}-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-off" />,
    title: `${item.jsonData.metadata.namespace}/${item.jsonData.metadata.name}`,
    content: (
      <ExceptionViewer
        name={item.jsonData.metadata.name}
        namespace={item.jsonData.metadata.namespace}
      />
    ),
  });
}

export function PolicyExceptionList() {
  return (
    <ResourceListView
      title="Policy Exceptions"
      resourceClass={PolicyException}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openExceptionActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        'namespace',
        {
          id: 'policies',
          label: 'Policies',
          getValue: item => item.policyNames.join(', '),
          render: item => (
            <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
              {item.policyNames.map(p => (
                <Chip key={p} label={p} size="small" variant="outlined" />
              ))}
            </span>
          ),
        },
        {
          id: 'exceptions',
          label: 'Rules',
          getValue: item => item.exceptions.length,
          gridTemplate: '0.5fr',
        },
        {
          id: 'background',
          label: 'Background',
          getValue: item => (item.background ? 'True' : 'False'),
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}
