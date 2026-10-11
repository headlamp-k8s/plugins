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

import { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { KyvernoReportRow, PureKyvernoReportTable } from './KyvernoReportList';
import { StoryWrapper } from './storyHelper';

const mockReports: KyvernoReportRow[] = [
  {
    name: 'req-ro-rootfs-1234',
    namespace: 'default',
    owner: 'Pod/my-pod',
    pass: 1,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
  {
    name: 'disallow-latest-tag-5678',
    namespace: 'kube-system',
    owner: 'Deployment/my-dep',
    pass: 0,
    fail: 2,
    warn: 1,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-02T00:00:00Z',
  },
];

const mockClusterReports: KyvernoReportRow[] = [
  {
    name: 'check-namespace-labels',
    owner: 'Namespace/default',
    pass: 5,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
];

const meta: Meta<typeof PureKyvernoReportTable> = {
  title: 'Kyverno/KyvernoReportList',
  component: PureKyvernoReportTable,
  decorators: [
    Story => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  argTypes: {
    onNameClick: { action: 'nameClicked' },
  },
};
export default meta;

type Story = StoryObj<typeof PureKyvernoReportTable>;

export const NamespacedAdmission: Story = {
  args: {
    title: 'Admission Reports',
    isNamespaced: true,
    items: mockReports,
  },
};

export const ClusterBackgroundScan: Story = {
  args: {
    title: 'Cluster Background Scan Reports',
    isNamespaced: false,
    items: mockClusterReports,
  },
};

export const Empty: Story = {
  args: {
    title: 'Ephemeral Reports',
    isNamespaced: true,
    items: [],
  },
};
