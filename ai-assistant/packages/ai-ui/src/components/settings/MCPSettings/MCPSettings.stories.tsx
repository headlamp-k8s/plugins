import type { Meta, StoryObj } from '@storybook/react';
import type { DesktopApi } from '../../../types/electron';
import {
  type ConfigStore,
  type MCPConfig,
  MCPSettings,
  type MCPSettingsProps,
} from './MCPSettings';

const meta = {
  title: 'AI UI/MCPSettings',
  component: MCPSettings,
} satisfies Meta<typeof MCPSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export interface MemoryConfigStore extends ConfigStore {
  /** @returns Current in-memory plugin data. */
  data: () => Record<string, unknown>;
  /** @returns Current typed MCP config, when present. */
  mcpConfig: () => MCPConfig | undefined;
}

/** @returns Whether a fixture value has the minimum typed MCP settings shape. */
function isFixtureMCPConfig(value: unknown): value is MCPConfig {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('enabled' in value) ||
    typeof value.enabled !== 'boolean' ||
    !('servers' in value) ||
    !Array.isArray(value.servers)
  ) {
    return false;
  }
  return value.servers.every(
    server =>
      typeof server === 'object' &&
      server !== null &&
      'name' in server &&
      typeof server.name === 'string' &&
      'command' in server &&
      typeof server.command === 'string' &&
      'args' in server &&
      Array.isArray(server.args) &&
      server.args.every((argument: unknown) => typeof argument === 'string') &&
      'enabled' in server &&
      typeof server.enabled === 'boolean'
  );
}

/** Creates a mutable in-memory plugin configuration store. */
export function createMemoryConfigStore(initial: Record<string, unknown> = {}): MemoryConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: patch => {
      data = { ...data, ...patch };
    },
    data: () => data,
    mcpConfig: () => {
      const config = data.mcpConfig;
      return isFixtureMCPConfig(config) ? config : undefined;
    },
  };
}

/** Creates the complete desktop bridge surface required by the renderer declaration. */
export function createDesktopApi(configStore: MemoryConfigStore): DesktopApi {
  return {
    send: () => undefined,
    receive: () => undefined,
    removeListener: () => undefined,
    mcp: {
      getTools: async () => ({ success: true, tools: [] }),
      executeTool: async () => ({ success: true, result: null }),
      getStatus: async () => ({ isInitialized: true, hasClient: true }),
      resetClient: async () => ({ success: true }),
      getConfig: async () => {
        const config = configStore.mcpConfig();
        return config ? { success: true, config } : { success: false, error: 'No config' };
      },
      updateConfig: async config => {
        configStore.update({ mcpConfig: config });
        return { success: true };
      },
      getToolsConfig: async () => ({ success: true, config: {} }),
      updateToolsConfig: async () => ({ success: true }),
      setToolEnabled: async () => ({ success: true }),
      getToolStats: async () => ({ success: true, stats: null }),
    },
  };
}

export const disabledMCPConfig: MCPConfig = { enabled: false, servers: [] };
export const configuredMCPConfig: MCPConfig = {
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
};

const disabledStore = createMemoryConfigStore({ mcpConfig: disabledMCPConfig });
const configuredStore = createMemoryConfigStore({ mcpConfig: configuredMCPConfig });

export const disabledMCPSettingsArgs: MCPSettingsProps = {
  isRunningAsApp: true,
  configStore: disabledStore,
};
export const Disabled: Story = {
  args: disabledMCPSettingsArgs,
  render: args => {
    window.desktopApi = createDesktopApi(disabledStore);
    return <MCPSettings {...args} />;
  },
};

export const configuredMCPSettingsArgs: MCPSettingsProps = {
  isRunningAsApp: true,
  configStore: configuredStore,
};
export const Configured: Story = {
  args: configuredMCPSettingsArgs,
  render: args => {
    window.desktopApi = createDesktopApi(configuredStore);
    return <MCPSettings {...args} />;
  },
};

export const browserOnlyMCPSettingsArgs: MCPSettingsProps = {
  isRunningAsApp: false,
  configStore: configuredStore,
};
export const BrowserOnly: Story = { args: browserOnlyMCPSettingsArgs };
