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
import { ImageValidatingPolicy } from '../resources/celPolicies';
import { ImageValidatingPolicyViewer } from './ImageValidatingPolicyViewer';

// ── Pure component for Storybook (no API calls, accepts props directly) ───
export interface ImageValidatingPolicyRow {
  name: string;
  ready: boolean;
  imagePatterns: string[];
  attestorCount: number;
  creationTimestamp?: string;
}

export function PureImageValidatingPolicyTable({
  items,
  onNameClick,
}: {
  items: ImageValidatingPolicyRow[];
  onNameClick?: (item: ImageValidatingPolicyRow) => void;
}) {
  return (
    <Box>
      <SectionHeader title="Image Validating Policies" />
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (row: ImageValidatingPolicyRow) =>
              onNameClick ? (
                <MuiLink component="button" onClick={() => onNameClick(row)} sx={{ textAlign: 'left' }}>
                  {row.name}
                </MuiLink>
              ) : (
                row.name
              ),
          },
          { label: 'Ready', getter: (row: ImageValidatingPolicyRow) => <Chip label={row.ready ? 'True' : 'False'} color={row.ready ? 'success' : 'error'} size="small" /> },
          { label: 'Image Patterns', getter: (row: ImageValidatingPolicyRow) => row.imagePatterns.join(', ') || '-' },
          { label: 'Attestors', getter: (row: ImageValidatingPolicyRow) => row.attestorCount },
          { label: 'Age', getter: (row: ImageValidatingPolicyRow) => row.creationTimestamp ? <DateLabel date={row.creationTimestamp} format="mini" /> : '—' },
        ]}
        data={items}
        emptyMessage="No image validating policies found"
      />
    </Box>
  );
}

function openActivity(item: ImageValidatingPolicy) {
  Activity.launch({
    id: `kyverno-ivpol-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-lock" />,
    title: item.jsonData.metadata.name,
    content: <ImageValidatingPolicyViewer name={item.jsonData.metadata.name} />,
  });
}

export function ImageValidatingPolicyList() {
  return (
    <ResourceListView
      title="Image Validating Policies"
      resourceClass={ImageValidatingPolicy}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openActivity(item)}
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
          id: 'images',
          label: 'Image Patterns',
          getValue: item => item.imagePatterns.join(', ') || '-',
        },
        {
          id: 'attestors',
          label: 'Attestors',
          getValue: item => item.attestorCount,
          gridTemplate: '0.5fr',
        },
        'age',
      ]}
    />
  );
}
