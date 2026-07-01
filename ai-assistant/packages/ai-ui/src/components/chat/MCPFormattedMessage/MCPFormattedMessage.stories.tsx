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
import MCPFormattedMessage from './MCPFormattedMessage';

export default {
  title: 'AI UI/MCPFormattedMessage',
  component: MCPFormattedMessage,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof MCPFormattedMessage>> = args => (
  <MCPFormattedMessage {...args} />
);

export const FormattedTableOutput = Template.bind({});
FormattedTableOutput.args = {
  content: JSON.stringify({
    formatted: true,
    mcpOutput: {
      type: 'table',
      title: 'Running Pods',
      summary: '3 pods in default namespace',
      data: {
        headers: ['Name', 'Status', 'Restarts'],
        rows: [
          ['nginx-abc123', 'Running', '0'],
          ['redis-xyz456', 'Running', '1'],
          ['app-def789', 'CrashLoopBackOff', '12'],
        ],
      },
      warnings: ['app-def789 is crash-looping'],
      metadata: {
        toolName: 'kubernetes_get_pods',
        responseSize: 512,
        processingTime: 100,
      },
    },
    raw: 'NAME            STATUS             RESTARTS\nnginx-abc123    Running            0\nredis-xyz456    Running            1\napp-def789      CrashLoopBackOff   12',
  }),
  isAssistant: true,
  onRetryTool: (toolName: string, args: Record<string, any>) =>
    console.log('Retry:', toolName, args),
};

export const FormattedErrorOutput = Template.bind({});
FormattedErrorOutput.args = {
  content: JSON.stringify({
    formatted: true,
    mcpOutput: {
      type: 'error',
      title: 'API Request Failed',
      summary: 'Connection refused to cluster API',
      data: {
        message: 'ECONNREFUSED: Could not connect to https://10.0.0.1:6443',
        code: 'ECONNREFUSED',
      },
      metadata: {
        toolName: 'kubernetes_api_request',
        responseSize: 64,
        processingTime: 5000,
      },
    },
    raw: 'Error: ECONNREFUSED',
    isError: true,
  }),
  isAssistant: true,
};

export const NonMCPContent = Template.bind({});
NonMCPContent.args = {
  content: 'This is a regular text message, not formatted MCP output.',
  isAssistant: true,
};

export const InvalidJSON = Template.bind({});
InvalidJSON.args = {
  content: '{ invalid json content',
  isAssistant: false,
};
