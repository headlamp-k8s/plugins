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
import { ResultsTable } from './ResultsTable';
import { StoryWrapper } from './storyHelper';
import { PolicyReportResult } from '../resources/policyReport';

const mockResults: PolicyReportResult[] = [
  {
    policy: 'disallow-default-namespace',
    rule: 'validate-namespace',
    result: 'fail',
    severity: 'high',
    category: 'Best Practices',
    message: 'Using default namespace is not allowed',
    resources: [{ name: 'my-pod', kind: 'Pod', namespace: 'default' }],
  },
  {
    policy: 'require-labels',
    rule: 'check-team',
    result: 'pass',
    severity: 'low',
    category: 'Security',
    message: 'team label is present',
    resources: [{ name: 'nginx', kind: 'Deployment', namespace: 'prod' }],
  },
  {
    policy: 'restrict-node-ports',
    rule: 'validate-node-port',
    result: 'error',
    severity: 'critical',
    message: 'NodePort is not allowed',
    resources: [{ name: 'frontend-svc', kind: 'Service', namespace: 'prod' }],
  },
];

const meta: Meta<typeof ResultsTable> = {
  title: 'Kyverno/ResultsTable',
  component: ResultsTable,
  decorators: [
    Story => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResultsTable>;

export const Default: Story = {
  args: { results: mockResults },
};

export const Empty: Story = {
  args: { results: [] },
};
