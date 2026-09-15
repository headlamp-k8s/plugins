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

import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeSet = vi.fn();
let storedConfig: Record<string, unknown> | undefined;

vi.mock('../pluginState', () => ({
  pluginStore: {
    get: () => storedConfig,
    set: (value: unknown) => storeSet(value),
  },
}));

const getConfig = vi.fn();
const updateConfig = vi.fn();

const SEEDED_AKS_MCP = {
  name: 'aks-mcp',
  command: 'aks-mcp',
  args: ['--transport', 'stdio', '--access-level', 'readonly'],
  enabled: true,
};

const SEEDED_DEFINITION = {
  command: SEEDED_AKS_MCP.command,
  args: SEEDED_AKS_MCP.args,
};

const OTHER_SERVER = { name: 'other', command: 'other', args: [], enabled: true };

/** Makes the desktop MCP bridge available with the given stored servers. */
function givenDesktopConfig(config: unknown): void {
  getConfig.mockResolvedValue({ success: true, config });
  updateConfig.mockResolvedValue({ success: true });
  window.desktopApi = { mcp: { getConfig, updateConfig } } as unknown as typeof window.desktopApi;
}

const { removeSeededAksMcpServer } = await import('./removeSeededAksMcpServer');

describe('removeSeededAksMcpServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storedConfig = undefined;
    delete window.desktopApi;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('does nothing when the install never seeded built-in servers', async () => {
    storedConfig = { mcpConfig: { enabled: true, servers: [SEEDED_AKS_MCP] } };
    givenDesktopConfig({ enabled: true, servers: [SEEDED_AKS_MCP] });

    await removeSeededAksMcpServer();

    expect(getConfig).not.toHaveBeenCalled();
    expect(storeSet).not.toHaveBeenCalled();
  });

  it('removes the seeded server and clears the reconciliation state', async () => {
    storedConfig = {
      seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION },
      mcpConfig: { enabled: true, servers: [SEEDED_AKS_MCP, OTHER_SERVER] },
    };
    givenDesktopConfig({ enabled: true, servers: [SEEDED_AKS_MCP, OTHER_SERVER] });

    await removeSeededAksMcpServer();

    expect(updateConfig).toHaveBeenCalledWith({ enabled: true, servers: [OTHER_SERVER] });
    expect(storeSet).toHaveBeenCalledWith({
      mcpConfig: { enabled: true, servers: [OTHER_SERVER] },
    });
  });

  it('removes an entry seeded before definitions were recorded', async () => {
    const customized = { ...SEEDED_AKS_MCP, args: ['--transport', 'stdio'] };
    storedConfig = { seededBuiltinMCPServers: ['aks-mcp'] };
    givenDesktopConfig({ enabled: true, servers: [customized] });

    await removeSeededAksMcpServer();

    expect(updateConfig).toHaveBeenCalledWith({ enabled: true, servers: [] });
    expect(storeSet).toHaveBeenCalledWith({ mcpConfig: { enabled: true, servers: [] } });
  });

  it('keeps a server the user customized', async () => {
    const customized = { ...SEEDED_AKS_MCP, args: ['--transport', 'sse'] };
    storedConfig = { seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION } };
    givenDesktopConfig({ enabled: true, servers: [customized] });

    await removeSeededAksMcpServer();

    expect(updateConfig).not.toHaveBeenCalled();
    expect(storeSet).toHaveBeenCalledWith({ mcpConfig: { enabled: true, servers: [customized] } });
  });

  it('keeps a server the plugin never seeded under that name', async () => {
    const userServer = { ...SEEDED_AKS_MCP, command: 'my-aks-mcp' };
    storedConfig = { seededBuiltinMCPServers: { 'other-builtin': null } };
    givenDesktopConfig({ enabled: true, servers: [userServer] });

    await removeSeededAksMcpServer();

    expect(getConfig).not.toHaveBeenCalled();
    expect(storeSet).toHaveBeenCalledWith({});
  });

  it('retries on the next launch when the configuration cannot be read', async () => {
    storedConfig = { seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION } };
    givenDesktopConfig({ enabled: true, servers: [SEEDED_AKS_MCP] });
    getConfig.mockResolvedValue({ success: false, error: 'nope' });

    await removeSeededAksMcpServer();

    expect(updateConfig).not.toHaveBeenCalled();
    expect(storeSet).not.toHaveBeenCalled();
  });

  it('retries on the next launch when the configuration cannot be written', async () => {
    storedConfig = { seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION } };
    givenDesktopConfig({ enabled: true, servers: [SEEDED_AKS_MCP] });
    updateConfig.mockResolvedValue({ success: false, error: 'nope' });

    await removeSeededAksMcpServer();

    expect(storeSet).not.toHaveBeenCalled();
  });

  it('defers until the desktop bridge is available', async () => {
    storedConfig = {
      seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION },
      mcpConfig: { enabled: true, servers: [SEEDED_AKS_MCP, OTHER_SERVER] },
    };

    await removeSeededAksMcpServer();

    expect(storeSet).not.toHaveBeenCalled();
  });

  it('removes every duplicate of the seeded server', async () => {
    const customized = { ...SEEDED_AKS_MCP, args: ['--transport', 'sse'] };
    storedConfig = { seededBuiltinMCPServers: { 'aks-mcp': SEEDED_DEFINITION } };
    givenDesktopConfig({
      enabled: true,
      servers: [SEEDED_AKS_MCP, OTHER_SERVER, customized, { ...SEEDED_AKS_MCP, name: 'AKS-MCP' }],
    });

    await removeSeededAksMcpServer();

    expect(updateConfig).toHaveBeenCalledWith({
      enabled: true,
      servers: [OTHER_SERVER, customized],
    });
  });
});
