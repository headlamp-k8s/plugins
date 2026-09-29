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
import {
  PureDeletingPolicyTable,
  PureGeneratingPolicyTable,
  PureMutatingPolicyTable,
  PureValidatingPolicyTable,
} from './CELPolicyList';
import { StoryWrapper } from './storyHelper';

export default {
  title: 'Kyverno/CELPolicyList',
  decorators: [
    Story => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
} as Meta;

// ── Validating Policies ────────────────────────────────────────────────────
export const Validating = {
  render: () => (
    <PureValidatingPolicyTable
      items={[
        {
          name: 'check-deployment-labels',
          ready: true,
          validationActions: ['Audit'],
          validationCount: 2,
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
        {
          name: 'disallow-latest-tag',
          ready: false,
          validationActions: ['Enforce'],
          validationCount: 1,
          creationTimestamp: '2025-01-02T00:00:00Z',
        },
      ]}
    />
  ),
};

export const ValidatingEmpty = {
  render: () => <PureValidatingPolicyTable items={[]} />,
};

// ── Mutating Policies ──────────────────────────────────────────────────────
export const Mutating = {
  render: () => (
    <PureMutatingPolicyTable
      items={[
        {
          name: 'add-default-resources',
          ready: true,
          mutationCount: 3,
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
        {
          name: 'inject-sidecar',
          ready: true,
          mutationCount: 1,
          creationTimestamp: '2025-01-02T00:00:00Z',
        },
      ]}
    />
  ),
};

// ── Generating Policies ────────────────────────────────────────────────────
export const Generating = {
  render: () => (
    <PureGeneratingPolicyTable
      items={[
        {
          name: 'generate-default-rolebinding',
          ready: true,
          generateCount: 1,
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
      ]}
    />
  ),
};

// ── Deleting Policies ──────────────────────────────────────────────────────
export const Deleting = {
  render: () => (
    <PureDeletingPolicyTable
      items={[
        {
          name: 'cleanup-completed-jobs',
          ready: true,
          schedule: '0 0 * * *',
          creationTimestamp: '2025-01-01T00:00:00Z',
        },
      ]}
    />
  ),
};
