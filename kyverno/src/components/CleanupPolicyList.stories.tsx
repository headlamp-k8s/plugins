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

import { Meta } from '@storybook/react';
import React from 'react';
import { PureCleanupPolicyTable, PureClusterCleanupPolicyTable } from './CleanupPolicyList';
import { StoryWrapper } from './storyHelper';

export default {
  title: 'Kyverno/CleanupPolicyList',
  decorators: [
    Story => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
} as Meta;

// ── Cleanup Policies (Namespaced) ──────────────────────────────────────────
export const Namespaced = {
  render: () => (
    <PureCleanupPolicyTable
      items={[
        {
          name: 'clean-stale-pods',
          namespace: 'default',
          ready: true,
          schedule: '0 1 * * *',
          lastExecutionTime: '2025-05-30T10:00:00Z',
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
        {
          name: 'clean-failed-jobs',
          namespace: 'kube-system',
          ready: false,
          schedule: '*/5 * * * *',
          lastExecutionTime: '-',
          creationTimestamp: '2025-01-02T00:00:00Z',
        },
      ]}
    />
  ),
};

export const NamespacedEmpty = {
  render: () => <PureCleanupPolicyTable items={[]} />,
};

// ── Cluster Cleanup Policies ───────────────────────────────────────────────
export const ClusterScoped = {
  render: () => (
    <PureClusterCleanupPolicyTable
      items={[
        {
          name: 'cluster-clean-stale-namespaces',
          ready: true,
          schedule: '@daily',
          lastExecutionTime: '2025-05-30T00:00:00Z',
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
      ]}
    />
  ),
};

export const ClusterScopedEmpty = {
  render: () => <PureClusterCleanupPolicyTable items={[]} />,
};
