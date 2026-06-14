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

import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AIChatContent, { type AIChatContentProps } from './AIChatContent';

const StubTextStream = ({ text }: { text: string }) => <span>{text}</span>;

function TextStreamPreview({
  history = [],
  isLoading = false,
}: {
  history?: ConversationMessage[];
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

const SettingsLink = ({ children }: { children: React.ReactNode }) => (
  <a href="#settings">{children}</a>
);

const meta = {
  title: 'AI UI/AIChatContent',
  component: AIChatContent,
} satisfies Meta<typeof AIChatContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const baseAIChatContentArgs: AIChatContentProps = {
  history: [],
  isLoading: false,
  apiError: null,
  onOperationSuccess: () => undefined,
  onOperationFailure: () => undefined,
  onYamlAction: () => undefined,
  onRetryTool: () => undefined,
  TextStreamSlot: TextStreamPreview,
  SettingsLinkSlot: SettingsLink,
};

export const EmptyHistory: Story = { args: baseAIChatContentArgs };

export const withMessagesArgs: AIChatContentProps = {
  ...baseAIChatContentArgs,
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
export const WithMessages: Story = { args: withMessagesArgs };

export const loadingArgs: AIChatContentProps = {
  ...baseAIChatContentArgs,
  history: [
    {
      role: 'user',
      content: 'What recent warning events should I investigate?',
    },
  ],
  isLoading: true,
};
export const Loading: Story = { args: loadingArgs };

export const withErrorArgs: AIChatContentProps = {
  ...baseAIChatContentArgs,
  apiError: 'Failed to connect',
};
export const WithError: Story = { args: withErrorArgs };
