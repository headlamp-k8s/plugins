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
import {
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';
import { CELPolicyViewer } from './CELPolicyViewer';

// ── Pure components for Storybook (no API calls, accepts props directly) ───
export interface ValidatingPolicyRow {
  name: string;
  ready: boolean;
  validationActions: string[];
  validationCount: number;
  creationTimestamp?: string;
}

export function PureValidatingPolicyTable({ items }: { items: ValidatingPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Validating Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: ValidatingPolicyRow) => row.name },
          { label: 'Ready', getter: (row: ValidatingPolicyRow) => <ReadyChip ready={row.ready} /> },
          { label: 'Actions', getter: (row: ValidatingPolicyRow) => row.validationActions.join(', ') },
          { label: 'Validations', getter: (row: ValidatingPolicyRow) => row.validationCount },
          { label: 'Age', getter: (row: ValidatingPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No validating policies found"
      />
    </Box>
  );
}

export interface MutatingPolicyRow {
  name: string;
  ready: boolean;
  mutationCount: number;
  creationTimestamp?: string;
}

export function PureMutatingPolicyTable({ items }: { items: MutatingPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Mutating Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: MutatingPolicyRow) => row.name },
          { label: 'Ready', getter: (row: MutatingPolicyRow) => <ReadyChip ready={row.ready} /> },
          { label: 'Mutations', getter: (row: MutatingPolicyRow) => row.mutationCount },
          { label: 'Age', getter: (row: MutatingPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No mutating policies found"
      />
    </Box>
  );
}

export interface GeneratingPolicyRow {
  name: string;
  ready: boolean;
  generateCount: number;
  creationTimestamp?: string;
}

export function PureGeneratingPolicyTable({ items }: { items: GeneratingPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Generating Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: GeneratingPolicyRow) => row.name },
          { label: 'Ready', getter: (row: GeneratingPolicyRow) => <ReadyChip ready={row.ready} /> },
          { label: 'Generators', getter: (row: GeneratingPolicyRow) => row.generateCount },
          { label: 'Age', getter: (row: GeneratingPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No generating policies found"
      />
    </Box>
  );
}

export interface DeletingPolicyRow {
  name: string;
  ready: boolean;
  schedule: string;
  creationTimestamp?: string;
}

export function PureDeletingPolicyTable({ items }: { items: DeletingPolicyRow[] }) {
  return (
    <Box>
      <SectionHeader title="Deleting Policies" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: DeletingPolicyRow) => row.name },
          { label: 'Ready', getter: (row: DeletingPolicyRow) => <ReadyChip ready={row.ready} /> },
          { label: 'Schedule', getter: (row: DeletingPolicyRow) => row.schedule },
          { label: 'Age', getter: (row: DeletingPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No deleting policies found"
      />
    </Box>
  );
}

function ReadyChip({ ready }: { ready: boolean }) {
  return (
    <Chip
      label={ready ? 'True' : 'False'}
      color={ready ? 'success' : 'error'}
      size="small"
    />
  );
}

type CELPolicy = ValidatingPolicy | MutatingPolicy | GeneratingPolicy | DeletingPolicy;

function openCELPolicyActivity(item: CELPolicy) {
  Activity.launch({
    id: `kyverno-cel-${item.jsonData.metadata.uid || item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-edit" />,
    title: item.jsonData.metadata.name,
    content: <CELPolicyViewer policy={item} />,
  });
}

export function ValidatingPolicyList() {
  return (
    <ResourceListView
      title="Validating Policies"
      resourceClass={ValidatingPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openCELPolicyActivity(item as ValidatingPolicy)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'actions',
          label: 'Actions',
          getValue: item => item.validationActions.join(', '),
        },
        {
          id: 'validations',
          label: 'Validations',
          getValue: item => item.validationCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function MutatingPolicyList() {
  return (
    <ResourceListView
      title="Mutating Policies"
      resourceClass={MutatingPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openCELPolicyActivity(item as MutatingPolicy)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'mutations',
          label: 'Mutations',
          getValue: item => item.mutationCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function GeneratingPolicyList() {
  return (
    <ResourceListView
      title="Generating Policies"
      resourceClass={GeneratingPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openCELPolicyActivity(item as GeneratingPolicy)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'generators',
          label: 'Generators',
          getValue: item => item.generateCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}

export function DeletingPolicyList() {
  return (
    <ResourceListView
      title="Deleting Policies"
      resourceClass={DeletingPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openCELPolicyActivity(item as DeletingPolicy)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => <ReadyChip ready={item.ready} />,
          gridTemplate: '0.5fr',
        },
        {
          id: 'schedule',
          label: 'Schedule',
          getValue: item => item.schedule,
        },
        'age',
      ]}
    />
  );
}
