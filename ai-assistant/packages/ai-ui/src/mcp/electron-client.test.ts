import type { MCPToolsConfig } from '@headlamp-k8s/ai-common/mcp/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ElectronMCPApi } from '../types/electron';
import tools, { ElectronMCPClient } from './electron-client';

function makeMCPApi(overrides: Partial<ElectronMCPApi> = {}): ElectronMCPApi {
  return {
    getTools: vi.fn(async () => ({ success: true, tools: [] })),
    executeTool: vi.fn(async () => ({ success: true, result: null })),
    getStatus: vi.fn(async () => ({ isInitialized: true, hasClient: true })),
    resetClient: vi.fn(async () => ({ success: true })),
    getConfig: vi.fn(async () => ({ success: true, config: { enabled: true, servers: [] } })),
    updateConfig: vi.fn(async () => ({ success: true })),
    getToolsConfig: vi.fn(async () => ({ success: true, config: {} })),
    updateToolsConfig: vi.fn(async () => ({ success: true })),
    setToolEnabled: vi.fn(async () => ({ success: true })),
    getToolStats: vi.fn(async () => ({ success: true, stats: null })),
    ...overrides,
  };
}

function installDesktopApi(mcp: ElectronMCPApi): void {
  window.desktopApi = {
    send: vi.fn(),
    receive: vi.fn(),
    removeListener: vi.fn(),
    mcp,
  };
}

afterEach(() => {
  delete window.desktopApi;
  vi.restoreAllMocks();
});

describe('ElectronMCPClient', () => {
  it('detects a bridge injected after client construction', () => {
    const client = new ElectronMCPClient();

    expect(client.isAvailable()).toBe(false);
    installDesktopApi(makeMCPApi());
    expect(client.isAvailable()).toBe(true);
  });

  it('returns discovered tools', async () => {
    const discovered = [{ name: 'cluster__pods', description: 'List pods' }];
    installDesktopApi(
      makeMCPApi({ getTools: vi.fn(async () => ({ success: true, tools: discovered })) })
    );

    await expect(new ElectronMCPClient().getTools()).resolves.toEqual(discovered);
  });

  it('falls back to persisted enabled tools when host discovery is unavailable', async () => {
    const mcp = makeMCPApi({
      getToolsConfig: vi.fn(async () => ({
        success: true,
        config: {
          cluster: {
            pods: { description: 'List pods' },
            secrets: { enabled: false },
          },
        },
      })),
    });
    delete mcp.getTools;
    installDesktopApi(mcp);

    await expect(new ElectronMCPClient().getTools()).resolves.toEqual([
      {
        name: 'cluster__pods',
        description: 'List pods',
        inputSchema: undefined,
        server: 'cluster',
      },
    ]);
  });

  it.each([
    ['without a bridge', undefined],
    [
      'when discovery fails',
      makeMCPApi({ getTools: vi.fn(async () => ({ success: false, error: 'failed' })) }),
    ],
    [
      'when discovery omits tools',
      makeMCPApi({ getTools: vi.fn(async () => ({ success: true })) }),
    ],
    [
      'when discovery rejects',
      makeMCPApi({ getTools: vi.fn(async () => Promise.reject(new Error('offline'))) }),
    ],
  ])('returns no tools %s', async (_description, mcp) => {
    if (mcp) installDesktopApi(mcp);
    vi.spyOn(console, mcp ? 'error' : 'warn').mockImplementation(() => undefined);

    await expect(new ElectronMCPClient().getTools()).resolves.toEqual([]);
  });

  it('executes tools and forwards the optional call identifier', async () => {
    const executeTool = vi.fn(async () => ({ success: true, result: { pods: 2 } }));
    installDesktopApi(makeMCPApi({ executeTool }));

    await expect(
      new ElectronMCPClient().executeTool('cluster__pods', { namespace: 'default' }, 'call-1')
    ).resolves.toEqual({ pods: 2 });
    expect(executeTool).toHaveBeenCalledWith('cluster__pods', { namespace: 'default' }, 'call-1');
  });

  it('rejects tool execution without a bridge', async () => {
    await expect(new ElectronMCPClient().executeTool('tool', {})).rejects.toThrow(
      'MCP client not available'
    );
  });

  it.each([
    [{ success: false, error: 'denied' }, 'denied'],
    [{ success: false }, 'Unknown error executing MCP tool'],
  ])('rejects an unsuccessful execution response', async (response, message) => {
    installDesktopApi(makeMCPApi({ executeTool: vi.fn(async () => response) }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(new ElectronMCPClient().executeTool('tool', {})).rejects.toThrow(message);
  });

  it('rethrows bridge execution failures', async () => {
    const failure = new Error('transport failed');
    installDesktopApi(makeMCPApi({ executeTool: vi.fn(async () => Promise.reject(failure)) }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(new ElectronMCPClient().executeTool('tool', {})).rejects.toBe(failure);
  });

  it('gets status and falls back when unavailable or rejected', async () => {
    const client = new ElectronMCPClient();
    await expect(client.getStatus()).resolves.toEqual({ isInitialized: false, hasClient: false });

    installDesktopApi(makeMCPApi());
    await expect(client.getStatus()).resolves.toEqual({ isInitialized: true, hasClient: true });

    installDesktopApi(
      makeMCPApi({ getStatus: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.getStatus()).resolves.toEqual({ isInitialized: false, hasClient: false });
  });

  it('resets the bridge client and reports unavailable or rejected resets', async () => {
    const client = new ElectronMCPClient();
    await expect(client.resetClient()).resolves.toBe(false);

    installDesktopApi(makeMCPApi());
    await expect(client.resetClient()).resolves.toBe(true);

    installDesktopApi(
      makeMCPApi({ resetClient: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.resetClient()).resolves.toBe(false);
  });

  it('gets server configuration and describes unavailable or rejected reads', async () => {
    const client = new ElectronMCPClient();
    await expect(client.getConfig()).resolves.toMatchObject({ success: false });

    installDesktopApi(makeMCPApi());
    await expect(client.getConfig()).resolves.toEqual({
      success: true,
      config: { enabled: true, servers: [] },
    });

    installDesktopApi(
      makeMCPApi({ getConfig: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.getConfig()).resolves.toEqual({ success: false, error: 'Error: offline' });
  });

  it('gets tool configuration and describes unavailable or rejected reads', async () => {
    const client = new ElectronMCPClient();
    await expect(client.getToolsConfig()).resolves.toMatchObject({ success: false });

    installDesktopApi(makeMCPApi());
    await expect(client.getToolsConfig()).resolves.toEqual({ success: true, config: {} });

    installDesktopApi(
      makeMCPApi({ getToolsConfig: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.getToolsConfig()).resolves.toEqual({
      success: false,
      error: 'Error: offline',
    });
  });

  it('updates tool configuration and reports unavailable or rejected writes', async () => {
    const config: MCPToolsConfig = { cluster: { pods: { enabled: false } } };
    const client = new ElectronMCPClient();
    await expect(client.updateToolsConfig(config)).resolves.toBe(false);

    const updateToolsConfig = vi.fn(async () => ({ success: true }));
    installDesktopApi(makeMCPApi({ updateToolsConfig }));
    await expect(client.updateToolsConfig(config)).resolves.toBe(true);
    expect(updateToolsConfig).toHaveBeenCalledWith(config);

    installDesktopApi(
      makeMCPApi({ updateToolsConfig: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.updateToolsConfig(config)).resolves.toBe(false);
  });

  it('updates one tool and reports unavailable or rejected writes', async () => {
    const client = new ElectronMCPClient();
    await expect(client.setToolEnabled('cluster', 'pods', false)).resolves.toBe(false);

    const setToolEnabled = vi.fn(async () => ({ success: true }));
    installDesktopApi(makeMCPApi({ setToolEnabled }));
    await expect(client.setToolEnabled('cluster', 'pods', false)).resolves.toBe(true);
    expect(setToolEnabled).toHaveBeenCalledWith('cluster', 'pods', false);

    installDesktopApi(
      makeMCPApi({ setToolEnabled: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.setToolEnabled('cluster', 'pods', false)).resolves.toBe(false);
  });

  it('gets tool statistics and normalizes missing or unsuccessful results', async () => {
    const client = new ElectronMCPClient();
    await expect(client.getToolStats('cluster', 'pods')).resolves.toBeNull();

    installDesktopApi(
      makeMCPApi({ getToolStats: vi.fn(async () => ({ success: true, stats: { usageCount: 3 } })) })
    );
    await expect(client.getToolStats('cluster', 'pods')).resolves.toEqual({ usageCount: 3 });

    installDesktopApi(makeMCPApi({ getToolStats: vi.fn(async () => ({ success: true })) }));
    await expect(client.getToolStats('cluster', 'pods')).resolves.toBeNull();

    installDesktopApi(makeMCPApi({ getToolStats: vi.fn(async () => ({ success: false })) }));
    await expect(client.getToolStats('cluster', 'pods')).resolves.toBeNull();

    installDesktopApi(
      makeMCPApi({ getToolStats: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.getToolStats('cluster', 'pods')).resolves.toBeNull();
  });

  it.each([
    ['cluster__pods', { serverName: 'cluster', toolName: 'pods' }],
    ['cluster__nested__tool', { serverName: 'cluster', toolName: 'nested__tool' }],
    ['pods', { serverName: 'default', toolName: 'pods' }],
  ])('parses %s', (name, expected) => {
    expect(new ElectronMCPClient().parseToolName(name)).toEqual(expected);
  });

  it('treats absent and omitted enablement as enabled and explicit false as disabled', async () => {
    const client = new ElectronMCPClient();
    await expect(client.isToolEnabled('cluster__pods')).resolves.toBe(true);

    const config: MCPToolsConfig = {
      cluster: {
        pods: {},
        secrets: { enabled: false },
      },
    };
    installDesktopApi(
      makeMCPApi({ getToolsConfig: vi.fn(async () => ({ success: true, config })) })
    );
    await expect(client.isToolEnabled('cluster__pods')).resolves.toBe(true);
    await expect(client.isToolEnabled('cluster__secrets')).resolves.toBe(false);
    await expect(client.isToolEnabled('cluster__new-tool')).resolves.toBe(true);
    await expect(client.isToolEnabled('other__tool')).resolves.toBe(true);
  });

  it('defaults enablement to true when configuration cannot be read', async () => {
    installDesktopApi(makeMCPApi({ getToolsConfig: vi.fn(async () => ({ success: false })) }));
    await expect(new ElectronMCPClient().isToolEnabled('cluster__pods')).resolves.toBe(true);

    installDesktopApi(
      makeMCPApi({ getToolsConfig: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(new ElectronMCPClient().isToolEnabled('cluster__pods')).resolves.toBe(true);
  });

  it('projects enabled configured tools with qualified names', async () => {
    const config: MCPToolsConfig = {
      cluster: {
        pods: { description: 'List pods', inputSchema: { type: 'object' } },
        secrets: { enabled: false },
      },
    };
    installDesktopApi(
      makeMCPApi({ getToolsConfig: vi.fn(async () => ({ success: true, config })) })
    );

    await expect(new ElectronMCPClient().getEnabledTools()).resolves.toEqual([
      {
        name: 'cluster__pods',
        description: 'List pods',
        inputSchema: { type: 'object' },
        server: 'cluster',
      },
    ]);
    await expect(tools()).resolves.toHaveLength(1);
  });

  it('returns no enabled tools when unavailable, unconfigured, or rejected', async () => {
    const client = new ElectronMCPClient();
    await expect(client.getEnabledTools()).resolves.toEqual([]);

    installDesktopApi(makeMCPApi({ getToolsConfig: vi.fn(async () => ({ success: false })) }));
    await expect(client.getEnabledTools()).resolves.toEqual([]);

    installDesktopApi(
      makeMCPApi({ getToolsConfig: vi.fn(async () => Promise.reject(new Error('offline'))) })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(client.getEnabledTools()).resolves.toEqual([]);
  });
});
