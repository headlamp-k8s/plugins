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

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import AgentThinkingBlock, { ThinkingStep } from './AgentThinkingBlock';

export default {
  title: 'AI UI/AgentThinkingBlock',
  component: AgentThinkingBlock,
  argTypes: {
    isActive: { control: 'boolean' },
  },
} as Meta;

const Template: StoryFn<{ steps: ThinkingStep[]; isActive: boolean }> = args => (
  <AgentThinkingBlock {...args} />
);

export const ActiveWithToolCalls = Template.bind({});
ActiveWithToolCalls.args = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: Date.now() - 3000,
    },
    {
      id: '2',
      content: 'Tool kubernetes_api_request returned 5 pods',
      type: 'tool-result',
      timestamp: Date.now() - 2000,
    },
    {
      id: '3',
      content: 'Analyzing pod statuses and checking for errors...',
      type: 'intermediate-text',
      timestamp: Date.now() - 1000,
    },
  ],
};

export const CompletedWithSteps = Template.bind({});
CompletedWithSteps.args = {
  isActive: false,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: Date.now() - 5000,
    },
    {
      id: '2',
      content: 'Tool kubernetes_api_request returned 3 deployments',
      type: 'tool-result',
      timestamp: Date.now() - 4000,
    },
    {
      id: '3',
      content: 'Updating plan to check deployment health',
      type: 'todo-update',
      timestamp: Date.now() - 3000,
    },
    {
      id: '4',
      content: 'Tool start: kubernetes_api_request (events)',
      type: 'tool-start',
      timestamp: Date.now() - 2000,
    },
    {
      id: '5',
      content: 'Tool kubernetes_api_request returned 12 events',
      type: 'tool-result',
      timestamp: Date.now() - 1000,
    },
  ],
};

export const SingleStep = Template.bind({});
SingleStep.args = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Tool start: kubernetes_api_request',
      type: 'tool-start',
      timestamp: Date.now(),
    },
  ],
};

export const PlanUpdate = Template.bind({});
PlanUpdate.args = {
  isActive: true,
  steps: [
    {
      id: '1',
      content: 'Updating investigation plan based on initial findings...',
      type: 'todo-update',
      timestamp: Date.now(),
    },
  ],
};

export const EmptySteps = Template.bind({});
EmptySteps.args = {
  isActive: false,
  steps: [],
};
