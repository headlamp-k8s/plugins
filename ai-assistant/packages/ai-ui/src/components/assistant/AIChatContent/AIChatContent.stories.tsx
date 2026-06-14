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

import type { Prompt } from '@headlamp-k8s/ai-common/ai/manager';
import { Box } from '@mui/material';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import AIChatContent from './AIChatContent';

const StubTextStream = ({ text }: { text: string }) => <span>{text}</span>;

function TextStreamPreview({
  history = [],
  isLoading = false,
}: {
  history?: Prompt[];
  isLoading?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {history.length === 0 ? (
        <StubTextStream text="No messages yet." />
      ) : (
        history.map((message, index) => (
          <Box key={`${message.role}-${index}`} sx={{ display: 'flex', gap: 1 }}>
            <strong>{message.role}:</strong>
            <StubTextStream text={message.content} />
          </Box>
        ))
      )}
      {isLoading && <StubTextStream text="Loading response…" />}
    </Box>
  );
}

const SettingsLink = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;

export default {
  title: 'AI UI/AIChatContent',
  component: AIChatContent,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof AIChatContent>> = args => (
  <AIChatContent {...args} />
);

const baseArgs: React.ComponentProps<typeof AIChatContent> = {
  history: [],
  isLoading: false,
  apiError: null,
  onOperationSuccess: response => console.log('Operation success:', response),
  onOperationFailure: (error, operationType, resourceInfo) =>
    console.log('Operation failure:', { error, operationType, resourceInfo }),
  onYamlAction: (yaml, title, type, isDeleteOp) =>
    console.log('YAML action:', { yaml, title, type, isDeleteOp }),
  onRetryTool: (toolName, args) => console.log('Retry tool:', { toolName, args }),
  TextStreamSlot: TextStreamPreview,
  SettingsLinkSlot: SettingsLink,
};

export const EmptyHistory = Template.bind({});
EmptyHistory.args = {
  ...baseArgs,
};

export const WithMessages = Template.bind({});
WithMessages.args = {
  ...baseArgs,
  history: [
    {
      role: 'user',
      content: 'Show me unhealthy pods in the default namespace.',
    },
    {
      role: 'assistant',
      content: 'I found one pod stuck in CrashLoopBackOff: nginx-7b6c9f5d4d-rx2jm.',
    },
  ],
};

export const Loading = Template.bind({});
Loading.args = {
  ...baseArgs,
  history: [
    {
      role: 'user',
      content: 'What recent warning events should I investigate?',
    },
  ],
  isLoading: true,
};

export const WithError = Template.bind({});
WithError.args = {
  ...baseArgs,
  apiError: 'Failed to connect',
};
