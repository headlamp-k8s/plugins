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
import { PolicyReportRow, PurePolicyReportTable } from './PolicyReportList';
import { StoryWrapper } from './storyHelper';

// ── Mock data ──────────────────────────────────────────────────────────────
const mockReports: PolicyReportRow[] = [
  {
    name: 'polr-test-1',
    namespace: 'default',
    scope: 'Pod/nginx',
    pass: 10,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
  {
    name: 'polr-test-2',
    namespace: 'kube-system',
    scope: 'Deployment/coredns',
    pass: 5,
    fail: 3,
    warn: 1,
    error: 0,
    skip: 0,
    creationTimestamp: '2025-01-02T00:00:00Z',
  },
  {
    name: 'polr-test-3',
    namespace: 'production',
    scope: 'Service/frontend',
    pass: 2,
    fail: 0,
    warn: 5,
    error: 2,
    skip: 1,
    creationTimestamp: '2025-01-03T00:00:00Z',
  },
];

// ── Story setup ────────────────────────────────────────────────────────────
const meta: Meta<typeof PurePolicyReportTable> = {
  title: 'Kyverno/PolicyReportList',
  component: PurePolicyReportTable,
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

type Story = StoryObj<typeof PurePolicyReportTable>;

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
      pass: 10,
      fail: 0,
      warn: 0,
      error: 0,
      skip: 0,
    })),
  },
};
