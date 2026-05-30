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
import { PureComplianceBadge } from './ComplianceBadge';
import { StoryWrapper } from './storyHelper';

const meta: Meta<typeof PureComplianceBadge> = {
  title: 'Kyverno/ComplianceBadge',
  component: PureComplianceBadge,
  decorators: [
    Story => (
      <StoryWrapper>
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Story />
          <div style={{ color: '#666', fontSize: '12px' }}>↑ Click the icon to see the compliance summary menu</div>
        </div>
      </StoryWrapper>
    ),
  ],
  argTypes: {
    onViewViolations: { action: 'onViewViolations clicked' },
  },
};
export default meta;

type Story = StoryObj<typeof PureComplianceBadge>;

// ── Default (Passed) ───────────────────────────────────────────────────────
export const Default: Story = {
  args: {
    isLoading: false,
    counts: { pass: 15, fail: 0, warn: 0, error: 0, skip: 0 },
  },
};

// ── Loading (Renders Nothing) ──────────────────────────────────────────────
export const Loading: Story = {
  args: {
    isLoading: true,
    counts: { pass: 0, fail: 0, warn: 0, error: 0, skip: 0 },
  },
};

// ── Failed ─────────────────────────────────────────────────────────────────
export const Failed: Story = {
  args: {
    isLoading: false,
    counts: { pass: 0, fail: 5, warn: 0, error: 0, skip: 0 },
  },
};

// ── Mixed ──────────────────────────────────────────────────────────────────
export const Mixed: Story = {
  args: {
    isLoading: false,
    counts: { pass: 30, fail: 5, warn: 2, error: 1, skip: 4 },
  },
};
