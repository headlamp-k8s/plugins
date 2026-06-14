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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { MCPConfirmationHandler, MCPSettingsProvider } from './MCPClientCore';

function tmpPath(): string {
  return path.join(os.tmpdir(), `mcp-core-test-${Date.now()}-${Math.random()}.json`);
}

/** In-memory settings provider for tests. */
function makeSettingsProvider(initial: any = null): MCPSettingsProvider {
  let settings = initial;
  return {
    loadMCPSettings: vi.fn(() => settings),
    saveMCPSettings: vi.fn((s: any) => {
      settings = s;
    }),
  };
}

/** Auto-approve confirmation handler for tests. */
function makeAutoApproveHandler(): MCPConfirmationHandler {
  return {
    confirmSettingsChange: vi.fn(async () => true),
    confirmToolsConfigChange: vi.fn(async () => true),
    confirmOperation: vi.fn(async () => true),
  };
}

/** Auto-deny confirmation handler for tests. */
function makeDenyHandler(): MCPConfirmationHandler {
  return {
    confirmSettingsChange: vi.fn(async () => false),
    confirmToolsConfigChange: vi.fn(async () => false),
    confirmOperation: vi.fn(async () => false),
  };
}

describe('MCPClientCore', () => {
  let cfgPath: string;
  let infoSpy: Mock;

  beforeEach(() => {
    cfgPath = tmpPath();
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {}) as unknown as Mock;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
    } catch {
      // ignore
    }
  });

  it('throws from handleClustersChange if not initialized', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await expect(client.handleClustersChange(['cluster-a'])).rejects.toThrow(
      'MCPClientCore: not initialized'
    );
  });

  it('initialize is idempotent and logs exactly once', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();
    await client.initialize(); // second call should be a no-op

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith('MCPClientCore: initialized');
  });

  it('handleClustersChange resolves when initialized', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();
    await expect(client.handleClustersChange(['cluster-1'])).resolves.toBeUndefined();
    expect(infoSpy).toHaveBeenCalledWith('MCPClientCore: clusters changed ->', ['cluster-1']);
  });

  it('cleanup resets state', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();
    await client.cleanup();
    expect(infoSpy).toHaveBeenCalledWith('MCPClientCore: cleaned up');

    await expect(client.handleClustersChange(['after-cleanup'])).rejects.toThrow(
      'MCPClientCore: not initialized'
    );
  });

  it('cleanup is safe when not initialized', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await expect(client.cleanup()).resolves.toBeUndefined();
    expect(infoSpy).not.toHaveBeenCalledWith('MCPClientCore: cleaned up');
  });

  it('handleClustersChange does nothing when clusters are identical', async () => {
    vi.resetModules();
    const getTools = vi.fn().mockResolvedValue([]);
    const close = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => ({ getTools, close })),
    }));

    // No cluster-dependent servers, but enabled so initialization works
    const provider = makeSettingsProvider(null);

    const { MCPClientCore } = await import('./MCPClientCore');
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();
    // First call sets currentClusters
    await client.handleClustersChange(['same-cluster']);
    // Second call with identical clusters should be a no-op
    await client.handleClustersChange(['same-cluster']);
    // No restart happened - just verify no error
  });

  it('returns early when no cluster-dependent servers', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    // Servers exist but none use HEADLAMP_CURRENT_CLUSTER in args
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 's1', command: 'cmd', args: [], enabled: false }],
    });
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();
    // No servers use HEADLAMP_CURRENT_CLUSTER, so it should skip restart
    await client.handleClustersChange(['cluster-x']);
    expect(infoSpy).toHaveBeenCalledWith('MCPClientCore: clusters changed ->', ['cluster-x']);
  });

  it('getStatus returns correct state', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    expect(client.getStatus()).toEqual({ isInitialized: false, hasClient: false });

    await client.initialize();
    // No servers configured, so isInitialized = true but hasClient = false
    expect(client.getStatus()).toEqual({ isInitialized: true, hasClient: false });
  });

  it('getConfig returns settings from provider', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const settings = {
      enabled: true,
      servers: [{ name: 'test', command: 'cmd', args: [], enabled: true }],
    };
    const provider = makeSettingsProvider(settings);
    const client = new MCPClientCore(cfgPath, provider);

    const result = client.getConfig();
    expect(result.success).toBe(true);
    expect(result.config).toEqual(settings);
  });

  it('getConfig returns default when provider returns null', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    const result = client.getConfig();
    expect(result.success).toBe(true);
    expect(result.config).toEqual({ enabled: false, servers: [] });
  });
});

describe('MCPClientCore#executeTool', () => {
  let cfgPath: string;

  beforeEach(() => {
    cfgPath = tmpPath();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
    } catch {
      // ignore
    }
  });

  it('executes a tool successfully and records usage', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const invoke = vi.fn().mockResolvedValue({ ok: true });
    (client as any).clientTools = [{ name: 'serverA__tool1', schema: {}, invoke }];
    (client as any).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      recordToolUsage: vi.fn(),
    };
    (client as any).isClientInitialized = true;
    (client as any).client = {};

    const res = await client.executeTool('serverA__tool1', [{ a: 1 }], 'call-1');
    expect(res?.success).toBe(true);
    expect(res?.result).toEqual({ ok: true });
    expect(res?.toolCallId).toBe('call-1');
    expect((client as any).mcpToolState.recordToolUsage).toHaveBeenCalledWith('serverA', 'tool1');
  });

  it('returns error when tool is disabled', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    (client as any).clientTools = [{ name: 's.t', schema: {}, invoke: vi.fn() }];
    (client as any).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(false),
      recordToolUsage: vi.fn(),
    };
    (client as any).isClientInitialized = true;
    (client as any).client = {};

    const res = await client.executeTool('s.t', [], 'call-3');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/disabled/);
  });

  it('returns error when tool not found', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    (client as any).clientTools = [{ name: 'srv.other', schema: {}, invoke: vi.fn() }];
    (client as any).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      recordToolUsage: vi.fn(),
    };
    (client as any).isClientInitialized = true;
    (client as any).client = {};

    const res = await client.executeTool('srv.missing', [], 'call-4');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/not found/);
  });

  it('returns error when parameter validation fails', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    (client as any).clientTools = [{ name: 'serverA.tool1', schema: {}, invoke: vi.fn() }];
    (client as any).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      recordToolUsage: vi.fn(),
    };
    (client as any).isClientInitialized = true;
    (client as any).client = {};

    // Override validateToolArgs to return invalid
    const mcpServerConfig = await import('./mcpServerConfig');
    vi.spyOn(mcpServerConfig, 'validateToolArgs').mockReturnValue({
      valid: false,
      error: 'bad-params',
    });

    const res = await client.executeTool('serverA.tool1', [], 'call-2');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/Parameter validation failed: bad-params/);
  });

  it('returns undefined when mcpToolState is null', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider();
    const client = new MCPClientCore(cfgPath, provider);

    (client as any).mcpToolState = null;
    const res = await client.executeTool('x.y', [], 'call-5');
    expect(res).toBeUndefined();
  });
});

describe('MCPClientCore confirmation handling', () => {
  let cfgPath: string;

  beforeEach(() => {
    cfgPath = tmpPath();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
    } catch {
      // ignore
    }
  });

  it('updateConfig saves when confirmed', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    await client.initialize();

    const newSettings = { enabled: true, servers: [] };
    const result = await client.updateConfig(newSettings);

    expect(result.success).toBe(true);
    expect(handler.confirmSettingsChange).toHaveBeenCalledWith(null, newSettings);
    expect(provider.saveMCPSettings).toHaveBeenCalledWith(newSettings);
  });

  it('updateConfig rejects when denied', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    const result = await client.updateConfig({ enabled: true, servers: [] });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelled/);
    expect(provider.saveMCPSettings).not.toHaveBeenCalled();
  });

  it('updateConfig skips confirmation when no handler', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider); // no handler

    await client.initialize();

    const newSettings = { enabled: true, servers: [] };
    const result = await client.updateConfig(newSettings);

    expect(result.success).toBe(true);
    expect(provider.saveMCPSettings).toHaveBeenCalledWith(newSettings);
  });

  it('resetClient confirms before resetting', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    await client.initialize();

    const result = await client.resetClient();
    expect(result.success).toBe(true);
    expect(handler.confirmOperation).toHaveBeenCalled();
  });

  it('resetClient rejects when denied', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    const result = await client.resetClient();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelled/);
  });

  it('updateToolsConfig confirms before updating', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    await client.initialize();

    const newConfig = { server1: { tool1: { enabled: true } } };
    const result = await client.updateToolsConfig(newConfig);
    expect(result.success).toBe(true);
    expect(handler.confirmToolsConfigChange).toHaveBeenCalled();
  });

  it('updateToolsConfig rejects when denied', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClientCore(cfgPath, provider, handler);

    const result = await client.updateToolsConfig({ server1: { tool1: { enabled: true } } });
    expect(result.success).toBe(false);
  });
});

describe('MCPClientCore tool state operations', () => {
  let cfgPath: string;

  beforeEach(() => {
    cfgPath = tmpPath();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
    } catch {
      // ignore
    }
  });

  it('setToolEnabled updates tool state', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const result = client.setToolEnabled('server1', 'tool1', true);
    expect(result.success).toBe(true);
  });

  it('getToolStats returns stats', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const result = client.getToolStats('server1', 'tool1');
    expect(result.success).toBe(true);
  });

  it('getToolsConfig returns config', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const result = client.getToolsConfig();
    expect(result.success).toBe(true);
  });

  it('clusterChange delegates to handleClustersChange', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const result = await client.clusterChange('cluster-1');
    expect(result.success).toBe(true);
  });

  it('clusterChange succeeds with null cluster', async () => {
    const { MCPClientCore } = await import('./MCPClientCore');
    const provider = makeSettingsProvider(null);
    const client = new MCPClientCore(cfgPath, provider);

    await client.initialize();

    const result = await client.clusterChange(null);
    expect(result.success).toBe(true);
  });
});
