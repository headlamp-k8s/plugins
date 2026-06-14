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

import type { MCPToolsConfig } from '@headlamp-k8s/ai-common/mcp/types';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import type { DesktopApi } from '../../../types/electron';
import { ToolsDialog } from './ToolsDialog';

const sampleMcpConfig = {
  enabled: true,
  servers: [
    {
      name: 'cluster-inspector',
      command: 'npx',
      args: ['@headlamp/mcp-cluster-inspector'],
      enabled: true,
      autoApprove: false,
    },
    {
      name: 'metrics',
      command: 'npx',
      args: ['@headlamp/mcp-metrics'],
      enabled: true,
      autoApprove: true,
    },
  ],
};

const sampleToolsConfig = {
  'cluster-inspector': {
    get_pods: { enabled: true, usageCount: 12 },
    get_logs: { enabled: false, usageCount: 3 },
  },
  metrics: {
    top_pods: { enabled: true, usageCount: 7 },
  },
};

function createDesktopApi(initialToolsConfig: MCPToolsConfig = sampleToolsConfig): DesktopApi {
  let toolsConfig = structuredClone(initialToolsConfig);

  return {
    send: () => {},
    receive: () => undefined,
    removeListener: () => {},
    mcp: {
      getTools: async () => ({ success: true, tools: [] }),
      executeTool: async () => ({ success: true, result: null }),
      getStatus: async () => ({ isInitialized: true, hasClient: true }),
      resetClient: async () => ({ success: true }),
      getConfig: async () => ({ success: true, config: sampleMcpConfig }),
      updateConfig: async () => ({ success: true }),
      getToolsConfig: async () => ({ success: true, config: toolsConfig }),
      updateToolsConfig: async (config: MCPToolsConfig) => {
        toolsConfig = structuredClone(config);
        return { success: true };
      },
      setToolEnabled: async () => ({ success: true }),
      getToolStats: async () => ({ success: true, stats: {} }),
    },
  };
}

export default {
  title: 'AI UI/ToolsDialog',
  component: ToolsDialog,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof ToolsDialog>> = args => {
  const [enabledTools, setEnabledTools] = React.useState(args.enabledTools);
  const [desktopApi] = React.useState(createDesktopApi);

  if (typeof window !== 'undefined') {
    window.desktopApi = desktopApi;
  }

  return (
    <ToolsDialog
      {...args}
      enabledTools={enabledTools}
      onToolsChange={tools => {
        setEnabledTools(tools);
        args.onToolsChange(tools);
      }}
    />
  );
};

export const Open = Template.bind({});
Open.args = {
  open: true,
  onClose: () => console.log('Closed'),
  enabledTools: ['kubernetes_api_request'],
  onToolsChange: enabled => console.log('Enabled tools:', enabled),
};

export const Closed = Template.bind({});
Closed.args = {
  open: false,
  onClose: () => {},
  enabledTools: ['kubernetes_api_request'],
  onToolsChange: () => {},
};

export const EmptyTools = Template.bind({});
EmptyTools.args = {
  open: true,
  onClose: () => console.log('Closed'),
  enabledTools: [],
  onToolsChange: enabled => console.log('Enabled tools:', enabled),
};
