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
import { PureClusterPolicyReportTable } from './ClusterPolicyReportList';
import { PolicyReportRow } from './PolicyReportList';
import { StoryWrapper } from './storyHelper';

// ── Mock data ──────────────────────────────────────────────────────────────
const mockReports: PolicyReportRow[] = [
  {
    name: 'cpolr-test-1',
    scope: 'Node/worker-1',
    pass: 20,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
  {
    name: 'cpolr-test-2',
    scope: 'ClusterRole/admin',
    pass: 5,
    fail: 12,
    warn: 2,
    error: 1,
    skip: 0,
    creationTimestamp: '2025-01-02T00:00:00Z',
  },
  {
    name: 'cpolr-test-3',
    scope: 'Namespace/kube-system',
    pass: 2,
    fail: 0,
    warn: 15,
    error: 0,
    skip: 3,
    creationTimestamp: '2025-01-03T00:00:00Z',
  },
];

// ── Story setup ────────────────────────────────────────────────────────────
const meta: Meta<typeof PureClusterPolicyReportTable> = {
  title: 'Kyverno/ClusterPolicyReportList',
  component: PureClusterPolicyReportTable,
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

type Story = StoryObj<typeof PureClusterPolicyReportTable>;

// ── Default — table with items ─────────────────────────────────────────────
export const Default: Story = {
  args: { items: mockReports },
};

// ── Empty ──────────────────────────────────────────────────────────────────
export const Empty: Story = {
  args: { items: [] },
};

// ── All passing ────────────────────────────────────────────────────────────
export const AllPassing: Story = {
  args: {
    items: mockReports.map(r => ({
      ...r,
      pass: 25,
      fail: 0,
      warn: 0,
      error: 0,
      skip: 0,
    })),
  },
};
