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
import { StoryWrapper } from './storyHelper';
import { PureViolationsView, ViolationEntry } from './ViolationsView';

const mockViolations = [
  {
    policy: 'require-labels',
    rule: 'check-team',
    message: 'team label is required',
    result: 'fail' as const,
    severity: 'high',
    resources: [{ name: 'my-pod', kind: 'Pod', namespace: 'default' }],
  },
  {
    policy: 'disallow-latest-tag',
    rule: 'validate-image',
    message: 'image uses latest tag',
    result: 'warn' as const,
    severity: 'medium',
    resources: [{ name: 'nginx-deployment', kind: 'Deployment', namespace: 'production' }],
  },
  {
    policy: 'restrict-node-ports',
    rule: 'validate-node-port',
    message: 'NodePort is not allowed',
    result: 'error' as const,
    severity: 'critical',
    resources: [{ name: 'frontend-svc', kind: 'Service', namespace: 'production' }],
  },
] as ViolationEntry[];

const meta: Meta<typeof PureViolationsView> = {
  title: 'Kyverno/ViolationsView',
  component: PureViolationsView,
  decorators: [
    Story => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PureViolationsView>;

export const Default: Story = {
  args: {
    isLoading: false,
    violations: mockViolations,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    violations: [],
  },
};

export const Empty: Story = {
  args: {
    isLoading: false,
    violations: [],
  },
};
