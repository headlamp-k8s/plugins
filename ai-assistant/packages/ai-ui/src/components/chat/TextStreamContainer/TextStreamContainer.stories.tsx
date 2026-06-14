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
import TextStreamContainer, { type TextStreamContainerProps } from './TextStreamContainer';

export default {
  title: 'Chat/TextStreamContainer',
  component: TextStreamContainer,
  parameters: {
    layout: 'padded',
  },
} as Meta<typeof TextStreamContainer>;

const Template: StoryFn<TextStreamContainerProps> = args => (
  <div style={{ height: 400, width: '100%' }}>
    <TextStreamContainer {...args} />
  </div>
);

/** Empty state — no messages, no errors. */
export const Empty = Template.bind({});
Empty.args = {
  history: [],
  isLoading: false,
  apiError: null,
};

/** Basic conversation with user and assistant messages. */
export const BasicConversation = Template.bind({});
BasicConversation.args = {
  history: [
    { role: 'user', content: 'How do I list pods?' },
    {
      role: 'assistant',
      content:
        'You can list pods using `kubectl get pods`. Add `-A` for all namespaces or `-n <namespace>` for a specific namespace.',
    },
  ] as any,
  isLoading: false,
  apiError: null,
};

/** Loading state while waiting for a response. */
export const Loading = Template.bind({});
Loading.args = {
  history: [{ role: 'user', content: 'What pods are failing?' }] as any,
  isLoading: true,
  apiError: null,
};

/** Displaying an API error when no history exists. */
export const WithError = Template.bind({});
WithError.args = {
  history: [],
  isLoading: false,
  apiError: 'Failed to connect to the AI provider. Please check your API key in Settings.',
};

/** Content filter error on an assistant message. */
export const ContentFilterError = Template.bind({});
ContentFilterError.args = {
  history: [
    { role: 'user', content: 'Write me a poem' },
    {
      role: 'assistant',
      content: 'This request was blocked by content filters.',
      contentFilterError: true,
    },
  ] as any,
  isLoading: false,
  apiError: null,
};

/** Agent thinking steps with tool calls. */
export const WithThinkingSteps = Template.bind({});
WithThinkingSteps.args = {
  history: [
    { role: 'user', content: 'Check the status of my deployments' },
    {
      role: 'assistant',
      content: 'All deployments are running correctly.',
      agentThinkingSteps: [
        { type: 'tool-start', tool: 'kubectl_get', args: { resource: 'deployments' } },
        {
          type: 'tool-result',
          tool: 'kubectl_get',
          result: 'nginx: 3/3, redis: 1/1',
        },
      ],
      agentThinkingDone: true,
    },
  ] as any,
  isLoading: false,
  apiError: null,
};
