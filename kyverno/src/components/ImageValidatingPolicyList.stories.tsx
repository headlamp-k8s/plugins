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
import {
  ImageValidatingPolicyRow,
  PureImageValidatingPolicyTable,
} from './ImageValidatingPolicyList';
import { StoryWrapper } from './storyHelper';

const mockPolicies: ImageValidatingPolicyRow[] = [
  {
    name: 'check-image-signatures',
    ready: true,
    imagePatterns: ['ghcr.io/kyverno/*'],
    attestorCount: 2,
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
  {
    name: 'verify-attestations',
    ready: false,
    imagePatterns: ['docker.io/library/*'],
    attestorCount: 1,
    creationTimestamp: '2025-01-02T00:00:00Z',
  },
];

const meta: Meta<typeof PureImageValidatingPolicyTable> = {
  title: 'Kyverno/ImageValidatingPolicyList',
  component: PureImageValidatingPolicyTable,
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

type Story = StoryObj<typeof PureImageValidatingPolicyTable>;

export const Default: Story = {
  args: { items: mockPolicies },
};

export const Empty: Story = {
  args: { items: [] },
};
