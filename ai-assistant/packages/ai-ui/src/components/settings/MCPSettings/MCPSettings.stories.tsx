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
import {
  type ConfigStore,
  type MCPConfig,
  MCPSettings,
  type MCPSettingsProps,
} from './MCPSettings';

function createMockStore(initial: Record<string, any> = {}): ConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: (patch: any) => {
      data = { ...data, ...patch };
    },
  };
}

function createDesktopApi(store: ConfigStore) {
  return {
    mcp: {
      getTools: async () => ({ success: true, tools: [] }),
      executeTool: async () => ({ success: true, result: null }),
      getStatus: async () => ({ isInitialized: true, hasClient: true }),
      resetClient: async () => ({ success: true }),
      getConfig: async () => ({ success: true, config: store.get()?.mcpConfig }),
      updateConfig: async (config: MCPConfig) => {
        const current = store.get() || {};
        store.update({ ...current, mcpConfig: config });
        return { success: true, config };
      },
      getToolsConfig: async () => ({ success: true, config: {} }),
      updateToolsConfig: async () => ({ success: true }),
      setToolEnabled: async () => ({ success: true }),
      getToolStats: async () => ({ success: true, stats: {} }),
    },
  };
}

export default {
  title: 'AI UI/MCPSettings',
  component: MCPSettings,
} as Meta;

const Template: StoryFn<MCPSettingsProps> = args => {
  const storeRef = React.useRef(args.configStore);

  if (typeof window !== 'undefined') {
    (window as any).desktopApi = createDesktopApi(storeRef.current);
  }

  return <MCPSettings {...args} configStore={storeRef.current} />;
};

const disabledStore = createMockStore({
  mcpConfig: {
    enabled: false,
    servers: [],
  },
});

const configuredStore = createMockStore({
  mcpConfig: {
    enabled: true,
    servers: [
      {
        name: 'cluster-inspector',
        command: 'npx',
        args: ['@headlamp/mcp-cluster-inspector'],
        enabled: true,
        autoApprove: true,
      },
      {
        name: 'metrics',
        command: 'npx',
        args: ['@headlamp/mcp-metrics'],
        env: { KUBECONFIG: 'HEADLAMP_CURRENT_CLUSTER' },
        enabled: false,
        autoApprove: false,
      },
    ],
  },
});

export const Disabled = Template.bind({});
Disabled.args = {
  isRunningAsApp: true,
  configStore: disabledStore,
  onConfigChange: config => console.log('MCP config changed:', config),
};

export const Configured = Template.bind({});
Configured.args = {
  isRunningAsApp: true,
  configStore: configuredStore,
  onConfigChange: config => console.log('MCP config changed:', config),
};

export const BrowserOnly = Template.bind({});
BrowserOnly.args = {
  isRunningAsApp: false,
  configStore: configuredStore,
  onConfigChange: config => console.log('MCP config changed:', config),
};
