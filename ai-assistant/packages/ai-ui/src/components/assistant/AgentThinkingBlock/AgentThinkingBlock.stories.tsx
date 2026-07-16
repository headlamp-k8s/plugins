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

import type { Meta, StoryObj } from '@storybook/react';
import AgentThinkingBlock, { type AgentThinkingBlockProps } from './AgentThinkingBlock';

const meta = {
  title: 'AI UI/AgentThinkingBlock',
  component: AgentThinkingBlock,
  argTypes: {
    isActive: { control: 'boolean' },
  },
} satisfies Meta<typeof AgentThinkingBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const activeWithToolCallsArgs: AgentThinkingBlockProps = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: 1,
    },
    {
      id: '2',
      content: 'Tool kubernetes_api_request returned 5 pods',
      type: 'tool-result',
      timestamp: 2,
    },
    {
      id: '3',
      content: 'Analyzing pod statuses and checking for errors...',
      type: 'intermediate-text',
      timestamp: 3,
    },
  ],
};
export const ActiveWithToolCalls: Story = { args: activeWithToolCallsArgs };

export const completedWithStepsArgs: AgentThinkingBlockProps = {
  isActive: false,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: 1,
    },
    {
      id: '2',
      content: 'Tool kubernetes_api_request returned 3 deployments',
      type: 'tool-result',
      timestamp: 2,
    },
    {
      id: '3',
      content: 'Updating plan to check deployment health',
      type: 'todo-update',
      timestamp: 3,
    },
    {
      id: '4',
      content: 'Tool start: kubernetes_api_request (events)',
      type: 'tool-start',
      timestamp: 4,
    },
    {
      id: '5',
      content: 'Tool kubernetes_api_request returned 12 events',
      type: 'tool-result',
      timestamp: 5,
    },
  ],
};
export const CompletedWithSteps: Story = { args: completedWithStepsArgs };

export const singleStepArgs: AgentThinkingBlockProps = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: 1,
    },
  ],
};
export const SingleStep: Story = { args: singleStepArgs };

export const planUpdateArgs: AgentThinkingBlockProps = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Updating investigation plan based on initial findings...',
      type: 'todo-update',
      timestamp: 1,
    },
  ],
};
export const PlanUpdate: Story = { args: planUpdateArgs };

export const emptyStepsArgs: AgentThinkingBlockProps = {
  isActive: false,
  steps: [],
};
export const EmptySteps: Story = { args: emptyStepsArgs };
