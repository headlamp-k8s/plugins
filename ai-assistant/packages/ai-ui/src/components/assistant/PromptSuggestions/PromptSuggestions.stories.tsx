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
import { PromptSuggestions } from './PromptSuggestions';

export default {
  title: 'AI UI/PromptSuggestions',
  component: PromptSuggestions,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof PromptSuggestions>> = args => (
  <PromptSuggestions {...args} />
);

export const Default = Template.bind({});
Default.args = {
  suggestions: [
    'What pods are running in the default namespace?',
    'Show me deployments with issues',
    'How do I scale a deployment?',
  ],
  apiError: null,
  loading: false,
  onPromptSelect: (prompt: string) => console.log('Selected:', prompt),
  onPromptSend: (prompt: string) => console.log('Sent:', prompt),
  onErrorClear: () => console.log('Error cleared'),
};

export const WithContentFilterError = Template.bind({});
WithContentFilterError.args = {
  suggestions: [
    'List all pods in the cluster',
    'Check node health status',
    'Show recent Kubernetes events',
  ],
  apiError: 'Response blocked by content filter policy',
  loading: false,
  onPromptSelect: (prompt: string) => console.log('Selected:', prompt),
  onPromptSend: (prompt: string) => console.log('Sent:', prompt),
  onErrorClear: () => console.log('Error cleared'),
};

export const Loading = Template.bind({});
Loading.args = {
  suggestions: [],
  apiError: null,
  loading: true,
  onPromptSelect: () => {},
  onPromptSend: () => {},
  onErrorClear: () => {},
};

export const ManySuggestions = Template.bind({});
ManySuggestions.args = {
  suggestions: [
    'What pods are running?',
    'Show me deployments',
    'Check node status',
    'List services in kube-system',
    'Show recent events',
    'Describe the nginx deployment',
  ],
  apiError: null,
  loading: false,
  onPromptSelect: (prompt: string) => console.log('Selected:', prompt),
  onPromptSend: (prompt: string) => console.log('Sent:', prompt),
  onErrorClear: () => console.log('Error cleared'),
};
