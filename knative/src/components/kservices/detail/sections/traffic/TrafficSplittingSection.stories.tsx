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

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Stack, Typography } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import { ReduxDecorator } from '../../../../../helpers/storybook';
import { ReadyStatusLabel } from '../../../../common/ReadyStatusLabel';
import { PureTrafficSplittingSectionProps, TrafficTableRowData } from './TrafficSplittingSection';

function getAge(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function PureTrafficSplittingSection({
  tableData,
  totalTraffic,
}: PureTrafficSplittingSectionProps) {
  const columns = [
    {
      label: 'Name',
      getter: (row: TrafficTableRowData) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2">{row.nameLabel}</Typography>
          {row.showLatestBadge && row.badgeLabel && (
            <Chip label={row.badgeLabel} color="info" size="small" variant="outlined" />
          )}
          {row.showUnavailableBadge && (
            <Chip label="Unavailable" color="warning" size="small" variant="outlined" />
          )}
        </Stack>
      ),
    },
    {
      label: 'Ready',
      getter: (row: TrafficTableRowData) => {
        let status: 'True' | 'False' | 'Unknown' = 'Unknown';
        if (row.hasStatus) {
          status = row.readyCond?.status === 'True' ? 'True' : 'False';
        }
        return (
          <ReadyStatusLabel
            status={status}
            reason={row.readyCond?.reason}
            message={row.readyCond?.message}
          />
        );
      },
    },
    {
      label: 'Age',
      getter: (row: TrafficTableRowData) =>
        row.creationTimestamp ? getAge(row.creationTimestamp) : '-',
    },
    {
      label: 'Traffic',
      getter: (row: TrafficTableRowData) => <Typography variant="body2">{row.percent}%</Typography>,
    },
    {
      label: 'Tags',
      getter: (row: TrafficTableRowData) =>
        row.tags.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {row.tags.map(tag => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Stack>
        ),
    },
  ];

  const isValid = totalTraffic === 100;

  return (
    <SectionBox title="Traffic Splitting">
      <Stack spacing={2}>
        <SimpleTable columns={columns} data={tableData} />
        <Typography variant="body2" color={isValid ? 'text.secondary' : 'error'}>
          Total: {totalTraffic}% (must equal 100%)
        </Typography>
      </Stack>
    </SectionBox>
  );
}

export default {
  title: 'knative/KService/Detail/TrafficSplittingSection',
  component: PureTrafficSplittingSection,
  decorators: [ReduxDecorator],
} as Meta;

const Template: StoryFn<PureTrafficSplittingSectionProps> = args => (
  <PureTrafficSplittingSection {...args} />
);

const baseTableData: TrafficTableRowData[] = [
  {
    id: 'latest',
    isLatestRow: true,
    nameLabel: 'Latest Ready Revision',
    showLatestBadge: true,
    badgeLabel: 'hello-00005',
    showUnavailableBadge: false,
    hasStatus: true,
    readyCond: { status: 'True', reason: 'Ready' },
    creationTimestamp: '2025-03-20T10:00:00Z',
    percent: 80,
    tags: ['current'],
  },
  {
    id: 'hello-00004',
    isLatestRow: false,
    nameLabel: 'hello-00004',
    showLatestBadge: false,
    showUnavailableBadge: false,
    hasStatus: true,
    readyCond: { status: 'True', reason: 'Ready' },
    creationTimestamp: '2025-03-19T08:00:00Z',
    percent: 15,
    tags: ['canary'],
  },
  {
    id: 'hello-00003',
    isLatestRow: false,
    nameLabel: 'hello-00003',
    showLatestBadge: false,
    showUnavailableBadge: false,
    hasStatus: true,
    readyCond: { status: 'True', reason: 'Ready' },
    creationTimestamp: '2025-03-18T06:00:00Z',
    percent: 5,
    tags: [],
  },
];

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  tableData: baseTableData,
  totalTraffic: 100,
  isReadOnly: true,
};

export const SingleRevision = Template.bind({});
SingleRevision.args = {
  tableData: [
    {
      id: 'latest',
      isLatestRow: true,
      nameLabel: 'Latest Ready Revision',
      showLatestBadge: true,
      badgeLabel: 'hello-00001',
      showUnavailableBadge: false,
      hasStatus: true,
      readyCond: { status: 'True', reason: 'Ready' },
      creationTimestamp: '2025-03-20T10:00:00Z',
      percent: 100,
      tags: [],
    },
  ],
  totalTraffic: 100,
  isReadOnly: true,
};

export const LatestUnavailable = Template.bind({});
LatestUnavailable.args = {
  tableData: [
    {
      id: 'latest',
      isLatestRow: true,
      nameLabel: 'Latest Ready Revision',
      showLatestBadge: false,
      showUnavailableBadge: true,
      hasStatus: false,
      percent: 50,
      tags: [],
    },
    {
      id: 'hello-00002',
      isLatestRow: false,
      nameLabel: 'hello-00002',
      showLatestBadge: false,
      showUnavailableBadge: false,
      hasStatus: true,
      readyCond: { status: 'True', reason: 'Ready' },
      creationTimestamp: '2025-03-18T06:00:00Z',
      percent: 50,
      tags: ['stable'],
    },
  ],
  totalTraffic: 100,
  isReadOnly: true,
};

export const WithFailedRevision = Template.bind({});
WithFailedRevision.args = {
  tableData: [
    ...baseTableData.slice(0, 1),
    {
      id: 'hello-00002',
      isLatestRow: false,
      nameLabel: 'hello-00002',
      showLatestBadge: false,
      showUnavailableBadge: false,
      hasStatus: true,
      readyCond: { status: 'False', reason: 'ContainerMissing' },
      creationTimestamp: '2025-03-15T10:00:00Z',
      percent: 0,
      tags: ['old'],
    },
  ],
  totalTraffic: 80,
  isReadOnly: true,
};
