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
import { PureClusterPolicyTable } from './ClusterPolicyList';
import { PolicyRow } from './PolicyList';
import { StoryWrapper } from './storyHelper';

// ── Mock data ──────────────────────────────────────────────────────────────
const mockPolicies: PolicyRow[] = [
  {
    name: 'require-ro-rootfs',
    ready: true,
    validationFailureAction: 'Enforce',
    background: true,
    ruleTypes: ['Validate'],
    ruleCount: 1,
    creationTimestamp: '2025-01-01T00:00:00Z',
    results: { fail: 2, total: 12 },
  },
  {
    name: 'add-default-resources',
    ready: false,
    validationFailureAction: 'Audit',
    background: false,
    ruleTypes: ['Mutate'],
    ruleCount: 1,
    creationTimestamp: '2025-01-02T00:00:00Z',
    results: null,
  },
  {
    name: 'check-image-signatures',
    ready: true,
    validationFailureAction: 'Enforce',
    background: true,
    ruleTypes: ['VerifyImages'],
    ruleCount: 2,
    creationTimestamp: '2025-01-03T00:00:00Z',
    results: { fail: 0, total: 30 },
  },
  {
    name: 'restrict-node-ports',
    ready: true,
    validationFailureAction: 'Enforce',
    background: true,
    ruleTypes: ['Validate'],
    ruleCount: 1,
    creationTimestamp: '2025-02-10T00:00:00Z',
    results: { fail: 5, total: 20 },
  },
];

// ── Story setup ────────────────────────────────────────────────────────────
const meta: Meta<typeof PureClusterPolicyTable> = {
  title: 'Kyverno/ClusterPolicyList',
  component: PureClusterPolicyTable,
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

type Story = StoryObj<typeof PureClusterPolicyTable>;

// ── Default — table with items ─────────────────────────────────────────────
export const Default: Story = {
  args: { items: mockPolicies },
};

// ── Empty ──────────────────────────────────────────────────────────────────
export const Empty: Story = {
  args: { items: [] },
};

// ── All passing (no failures) ──────────────────────────────────────────────
export const AllPassing: Story = {
  args: {
    items: mockPolicies.map(p => ({
      ...p,
      ready: true,
      results: p.results ? { fail: 0, total: p.results.total } : null,
    })),
  },
};

// ── All failing ───────────────────────────────────────────────────────────
export const AllFailing: Story = {
  args: {
    items: mockPolicies.map(p => ({
      ...p,
      ready: false,
      results: p.results
        ? { fail: p.results.total, total: p.results.total }
        : { fail: 5, total: 5 },
    })),
  },
};

// ── No results data (counts still loading) ────────────────────────────────
export const NoResults: Story = {
  args: {
    items: mockPolicies.map(p => ({ ...p, results: null })),
  },
};
