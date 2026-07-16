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
import type { MCPSettings, MCPToolsConfig, MCPToolState } from '../types';
import type { MCPClient, MCPConfirmationHandler, MCPSettingsProvider } from './MCPClient';

interface CoreToolDouble {
  name: string;
  schema: unknown;
  invoke(input: Record<string, unknown>): Promise<unknown>;
}

interface CoreToolStateDouble {
  isToolEnabled?(serverName: string, toolName: string): boolean;
  getToolStats?(serverName: string, toolName: string): MCPToolState | null;
  recordToolUsage?(serverName: string, toolName: string): void;
  getConfig?(): MCPToolsConfig;
  setConfig?(config: MCPToolsConfig): void;
}

/** Private MCPClient state exercised by lifecycle and error-path tests. */
interface MCPClientTestHarness {
  clientTools: CoreToolDouble[];
  mcpToolState: CoreToolStateDouble | null;
  isClientInitialized: boolean;
  client: unknown;
  initializationPromise: Promise<void> | null;
  initializeClient(): Promise<void>;
  doInitializeClient(): Promise<void>;
}

function privateCore(client: MCPClient): MCPClientTestHarness {
  return client as unknown as MCPClientTestHarness;
}

// Mock the heavy @langchain/mcp-adapters package so tests load instantly.
// Individual tests that need specific MultiServerMCPClient behaviour use
// vi.doMock() after vi.resetModules() to override this default.
vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: vi.fn().mockImplementation(() => ({
    getTools: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Side-effect import: loads MCPClient (and its TS transform) during file collection
// rather than inside the first test, so individual test timing stays low.
import './MCPClient';

function tmpPath(): string {
  return path.join(os.tmpdir(), `mcp-core-test-${Date.now()}-${Math.random()}.json`);
}

/** In-memory settings provider for tests. */
function makeSettingsProvider(initial: MCPSettings | null = null): MCPSettingsProvider {
  let settings = initial;
  return {
    loadMCPSettings: vi.fn(() => settings),
    saveMCPSettings: vi.fn((nextSettings: MCPSettings) => {
      settings = nextSettings;
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

describe('MCPClient', () => {
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
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await expect(client.handleClustersChange(['cluster-a'])).rejects.toThrow(
      'MCPClient: not initialized'
    );
  });

  it('initialize is idempotent and logs exactly once', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();
    await client.initialize(); // second call should be a no-op

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith('MCPClient: initialized');
  });

  it('handleClustersChange resolves when initialized', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();
    await expect(client.handleClustersChange(['cluster-1'])).resolves.toBeUndefined();
    expect(infoSpy).toHaveBeenCalledWith('MCPClient: clusters changed ->', ['cluster-1']);
  });

  it('cleanup resets state', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();
    await client.cleanup();
    expect(infoSpy).toHaveBeenCalledWith('MCPClient: cleaned up');

    await expect(client.handleClustersChange(['after-cleanup'])).rejects.toThrow(
      'MCPClient: not initialized'
    );
  });

  it('cleanup is safe when not initialized', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await expect(client.cleanup()).resolves.toBeUndefined();
    expect(infoSpy).not.toHaveBeenCalledWith('MCPClient: cleaned up');
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

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();
    // First call sets currentClusters
    await client.handleClustersChange(['same-cluster']);
    // Second call with identical clusters should be a no-op
    await client.handleClustersChange(['same-cluster']);
    // No restart happened - just verify no error
  });

  it('returns early when no cluster-dependent servers', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    // Servers exist but none use HEADLAMP_CURRENT_CLUSTER in args
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 's1', command: 'cmd', args: [], enabled: false }],
    });
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();
    // No servers use HEADLAMP_CURRENT_CLUSTER, so it should skip restart
    await client.handleClustersChange(['cluster-x']);
    expect(infoSpy).toHaveBeenCalledWith('MCPClient: clusters changed ->', ['cluster-x']);
  });

  it('getStatus returns correct state', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    expect(client.getStatus()).toEqual({ isInitialized: false, hasClient: false });

    await client.initialize();
    // No servers configured, so isInitialized = true but hasClient = false
    expect(client.getStatus()).toEqual({ isInitialized: true, hasClient: false });
  });

  it('getConfig returns settings from provider', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const settings = {
      enabled: true,
      servers: [{ name: 'test', command: 'cmd', args: [], enabled: true }],
    };
    const provider = makeSettingsProvider(settings);
    const client = new MCPClient(cfgPath, provider);

    const result = client.getConfig();
    expect(result.success).toBe(true);
    expect(result.config).toEqual(settings);
  });

  it('getConfig returns default when provider returns null', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    const result = client.getConfig();
    expect(result.success).toBe(true);
    expect(result.config).toEqual({ enabled: false, servers: [] });
  });
});

describe('MCPClient#executeTool', () => {
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
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const invoke = vi.fn().mockResolvedValue({ ok: true });
    privateCore(client).clientTools = [{ name: 'serverA__tool1', schema: {}, invoke }];
    privateCore(client).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      getToolStats: vi.fn().mockReturnValue(null),
      recordToolUsage: vi.fn(),
    };
    privateCore(client).isClientInitialized = true;
    privateCore(client).client = {};

    const res = await client.executeTool('serverA__tool1', { a: 1 }, 'call-1');
    expect(res?.success).toBe(true);
    expect(res?.result).toEqual({ ok: true });
    expect(res?.toolCallId).toBe('call-1');
    expect(privateCore(client).mcpToolState?.recordToolUsage).toHaveBeenCalledWith(
      'serverA',
      'tool1'
    );
  });

  it('returns error when tool is disabled', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    privateCore(client).clientTools = [{ name: 's.t', schema: {}, invoke: vi.fn() }];
    privateCore(client).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(false),
      recordToolUsage: vi.fn(),
    };
    privateCore(client).isClientInitialized = true;
    privateCore(client).client = {};

    const res = await client.executeTool('s.t', {}, 'call-3');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/disabled/);
  });

  it('returns error when tool not found', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    privateCore(client).clientTools = [{ name: 'srv.other', schema: {}, invoke: vi.fn() }];
    privateCore(client).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      getToolStats: vi.fn().mockReturnValue(null),
      recordToolUsage: vi.fn(),
    };
    privateCore(client).isClientInitialized = true;
    privateCore(client).client = {};

    const res = await client.executeTool('srv.missing', {}, 'call-4');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/not found/);
  });

  it('returns error when parameter validation fails', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    privateCore(client).clientTools = [{ name: 'serverA.tool1', schema: {}, invoke: vi.fn() }];
    privateCore(client).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      getToolStats: vi.fn().mockReturnValue(null),
      recordToolUsage: vi.fn(),
    };
    privateCore(client).isClientInitialized = true;
    privateCore(client).client = {};

    // Override validateToolArgs to return invalid
    const mcpServerConfig = await import('../config/serverConfig');
    vi.spyOn(mcpServerConfig, 'validateToolArgs').mockReturnValue({
      valid: false,
      error: 'bad-params',
    });

    const res = await client.executeTool('serverA.tool1', {}, 'call-2');
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/Parameter validation failed: bad-params/);
  });

  it('validates arguments against the persisted JSON schema instead of the LangChain schema', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const client = new MCPClient(cfgPath, makeSettingsProvider());
    const invoke = vi.fn();

    privateCore(client).clientTools = [
      { name: 'serverA.tool1', schema: { parse: vi.fn() }, invoke },
    ];
    privateCore(client).mcpToolState = {
      isToolEnabled: vi.fn().mockReturnValue(true),
      getToolStats: vi.fn().mockReturnValue({
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      }),
      recordToolUsage: vi.fn(),
    };
    privateCore(client).isClientInitialized = true;
    privateCore(client).client = {};

    const result = await client.executeTool('serverA.tool1', {}, 'call-schema');

    expect(result?.success).toBe(false);
    expect(result?.error).toMatch(/Required parameter 'query' is missing/);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns undefined when mcpToolState is null', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);

    privateCore(client).mcpToolState = null;
    const res = await client.executeTool('x.y', {}, 'call-5');
    expect(res).toBeUndefined();
  });
});

describe('MCPClient confirmation handling', () => {
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
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    await client.initialize();

    const newSettings = { enabled: true, servers: [] };
    const result = await client.updateConfig(newSettings);

    expect(result.success).toBe(true);
    expect(handler.confirmSettingsChange).toHaveBeenCalledWith(null, newSettings);
    expect(provider.saveMCPSettings).toHaveBeenCalledWith(newSettings);
  });

  it('updateConfig rejects when denied', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    const result = await client.updateConfig({ enabled: true, servers: [] });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelled/);
    expect(provider.saveMCPSettings).not.toHaveBeenCalled();
  });

  it('updateConfig skips confirmation when no handler', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider); // no handler

    await client.initialize();

    const newSettings = { enabled: true, servers: [] };
    const result = await client.updateConfig(newSettings);

    expect(result.success).toBe(true);
    expect(provider.saveMCPSettings).toHaveBeenCalledWith(newSettings);
  });

  it('resetClient confirms before resetting', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    await client.initialize();

    const result = await client.resetClient();
    expect(result.success).toBe(true);
    expect(handler.confirmOperation).toHaveBeenCalled();
  });

  it('resetClient rejects when denied', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    const result = await client.resetClient();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelled/);
  });

  it('updateToolsConfig confirms before updating', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeAutoApproveHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    await client.initialize();

    const newConfig = { server1: { tool1: { enabled: true } } };
    const result = await client.updateToolsConfig(newConfig);
    expect(result.success).toBe(true);
    expect(handler.confirmToolsConfigChange).toHaveBeenCalled();
  });

  it('updateToolsConfig rejects when denied', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const handler = makeDenyHandler();
    const client = new MCPClient(cfgPath, provider, handler);

    const result = await client.updateToolsConfig({ server1: { tool1: { enabled: true } } });
    expect(result.success).toBe(false);
  });
});

describe('MCPClient tool state operations', () => {
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
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const result = client.setToolEnabled('server1', 'tool1', true);
    expect(result.success).toBe(true);
  });

  it('getToolStats returns stats', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const result = client.getToolStats('server1', 'tool1');
    expect(result.success).toBe(true);
  });

  it('getToolsConfig returns config', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const result = client.getToolsConfig();
    expect(result.success).toBe(true);
  });

  it('clusterChange delegates to handleClustersChange', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const result = await client.clusterChange('cluster-1');
    expect(result.success).toBe(true);
  });

  it('clusterChange succeeds with null cluster', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(null);
    const client = new MCPClient(cfgPath, provider);

    await client.initialize();

    const result = await client.clusterChange(null);
    expect(result.success).toBe(true);
  });
});

// ── Error paths ───────────────────────────────────────────────────────────────

describe('MCPClient — error paths', () => {
  let cfgPath: string;

  beforeEach(() => {
    cfgPath = tmpPath();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    try {
      if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
    } catch {}
  });

  // ── closeAndReset with failing client.close() ─────────────────────────────

  it('closeAndReset swallows errors from client.close()', async () => {
    vi.resetModules();
    const close = vi.fn().mockRejectedValue(new Error('close failed'));
    const getTools = vi.fn().mockResolvedValue([]);
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => ({ getTools, close })),
    }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    // cleanup calls closeAndReset internally — client.close() throws but must not propagate
    await expect(client.cleanup()).resolves.toBeUndefined();
    expect(close).toHaveBeenCalled();
  });

  // ── doInitializeClient success path ──────────────────────────────────────

  it('doInitializeClient creates MultiServerMCPClient when servers are configured', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const getTools = vi
      .fn()
      .mockResolvedValue([{ name: 'srv__tool1', schema: {}, invoke: vi.fn() }]);
    const MockMCP = vi.fn().mockImplementation(() => ({ getTools, close }));
    vi.doMock('@langchain/mcp-adapters', () => ({ MultiServerMCPClient: MockMCP }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    // A client was created and tools were loaded
    expect(MockMCP).toHaveBeenCalled();
    expect(getTools).toHaveBeenCalled();
    const status = client.getStatus();
    expect(status.isInitialized).toBe(true);
    expect(status.hasClient).toBe(true);
  });

  // ── doInitializeClient error path ─────────────────────────────────────────

  it('doInitializeClient error is re-thrown and state is reset', async () => {
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => ({
        getTools: vi.fn().mockRejectedValue(new Error('getTools failed')),
        close: vi.fn().mockResolvedValue(undefined),
      })),
    }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);

    await expect(client.initialize()).rejects.toThrow('getTools failed');
    // State must be reset after failure
    expect(client.getStatus()).toEqual({ isInitialized: false, hasClient: false });
  });

  // ── concurrent initialization (initializationPromise already set) ─────────

  it('concurrent calls to initializeClient share the same promise', async () => {
    let resolveGetTools!: (tools: CoreToolDouble[]) => void;
    const getToolsPromise = new Promise<CoreToolDouble[]>(res => (resolveGetTools = res));
    const MockMCP = vi.fn().mockImplementation(() => ({
      getTools: vi.fn().mockReturnValue(getToolsPromise),
      close: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@langchain/mcp-adapters', () => ({ MultiServerMCPClient: MockMCP }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);

    // Start two concurrent initializations
    const p1 = privateCore(client).initializeClient();
    const p2 = privateCore(client).initializeClient();

    // Only ONE MultiServerMCPClient should be created
    expect(MockMCP).toHaveBeenCalledTimes(1);

    resolveGetTools([]);
    await Promise.all([p1, p2]);
    expect(client.getStatus().isInitialized).toBe(true);
  });

  it('cleanup waits for in-flight initialization and closes the created client', async () => {
    let resolveGetTools!: (tools: CoreToolDouble[]) => void;
    const getToolsPromise = new Promise<CoreToolDouble[]>(resolve => {
      resolveGetTools = resolve;
    });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => ({
        getTools: vi.fn().mockReturnValue(getToolsPromise),
        close,
      })),
    }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const client = new MCPClient(
      cfgPath,
      makeSettingsProvider({
        enabled: true,
        servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
      })
    );
    const initialize = client.initialize();
    const cleanup = client.cleanup();
    resolveGetTools([]);

    await Promise.all([initialize, cleanup]);
    expect(close).toHaveBeenCalledOnce();
    expect(client.getStatus()).toEqual({ isInitialized: false, hasClient: false });
  });

  // ── executeTool when client is null after initialization ──────────────────

  it('executeTool throws when client is null after init (no servers)', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider(); // no servers
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    // Force client into state: initialized=true but no client/tools
    privateCore(client).mcpToolState = { isToolEnabled: () => true, recordToolUsage: () => {} };

    const result = await client.executeTool('srv__tool1', {}, 'tc1');
    expect(result?.success).toBe(false);
    expect(result?.error).toContain('not initialized or no tools available');
  });

  // ── getConfig error path ──────────────────────────────────────────────────

  it('getConfig returns failure when provider throws', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider: MCPSettingsProvider = {
      loadMCPSettings: vi.fn().mockImplementation(() => {
        throw new Error('disk read failed');
      }),
      saveMCPSettings: vi.fn(),
    };
    const client = new MCPClient(cfgPath, provider);
    const result = client.getConfig();
    expect(result.success).toBe(false);
    expect(result.error).toContain('disk read failed');
    expect(result.config).toEqual({ enabled: false, servers: [] });
  });

  // ── updateConfig error path ───────────────────────────────────────────────

  it('updateConfig returns failure when initializeClient throws', async () => {
    vi.resetModules();
    let callCount = 0;
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount > 1) throw new Error('re-init failed');
        return {
          getTools: vi.fn().mockResolvedValue([]),
          close: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    // Pass settings with servers so initializeClient tries to create a client again
    const newSettings = {
      enabled: true,
      servers: [{ name: 'srv2', command: 'cmd2', args: [], enabled: true }],
    };
    const result = await client.updateConfig(newSettings);
    expect(result.success).toBe(false);
    expect(result.error).toContain('re-init failed');
  });

  // ── resetClient error path ────────────────────────────────────────────────

  it('resetClient returns failure when initializeClient throws', async () => {
    let callCount = 0;
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount > 1) throw new Error('restart failed');
        return {
          getTools: vi.fn().mockResolvedValue([]),
          close: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [{ name: 'srv', command: 'cmd', args: [], enabled: true }],
    });
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    const result = await client.resetClient();
    expect(result.success).toBe(false);
    expect(result.error).toContain('restart failed');
  });

  // ── getToolsConfig error path ─────────────────────────────────────────────

  it('getToolsConfig returns failure when mcpToolState.getConfig throws', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    privateCore(client).mcpToolState = {
      getConfig: vi.fn().mockImplementation(() => {
        throw new Error('state read error');
      }),
    };

    const result = client.getToolsConfig();
    expect(result.success).toBe(false);
    expect(result.error).toContain('state read error');
  });

  // ── getToolStats error path ───────────────────────────────────────────────

  it('getToolStats returns failure when mcpToolState.getToolStats throws', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    privateCore(client).mcpToolState = {
      getToolStats: vi.fn().mockImplementation(() => {
        throw new Error('stats error');
      }),
    };

    const result = client.getToolStats('srv', 'tool1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('stats error');
  });

  // ── updateToolsConfig error path ──────────────────────────────────────────

  it('updateToolsConfig returns failure when mcpToolState.setConfig throws', async () => {
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider();
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    privateCore(client).mcpToolState = {
      getConfig: vi.fn().mockReturnValue({}),
      setConfig: vi.fn().mockImplementation(() => {
        throw new Error('config write error');
      }),
    };

    const result = await client.updateToolsConfig({ srv: { tool1: { enabled: false } } });
    expect(result.success).toBe(false);
    expect(result.error).toContain('config write error');
  });

  // ── clusterChange error path ──────────────────────────────────────────────

  it('clusterChange returns failure when handleClustersChange throws', async () => {
    vi.resetModules();
    vi.doMock('@langchain/mcp-adapters', () => ({
      MultiServerMCPClient: vi.fn().mockImplementation(() => ({
        getTools: vi.fn().mockResolvedValue([]),
        close: vi.fn().mockResolvedValue(undefined),
      })),
    }));
    const { MCPClient: MCPClient } = await import('./MCPClient');
    const provider = makeSettingsProvider({
      enabled: true,
      servers: [
        {
          name: 'srv',
          command: 'cmd',
          // Use HEADLAMP_CURRENT_CLUSTER to trigger restart on cluster change
          args: ['HEADLAMP_CURRENT_CLUSTER'],
          enabled: true,
        },
      ],
    });
    const client = new MCPClient(cfgPath, provider);
    await client.initialize();

    // Force initializeClient to fail on next call
    privateCore(client).doInitializeClient = vi
      .fn()
      .mockRejectedValue(new Error('cluster restart failed'));
    privateCore(client).initializationPromise = null;
    privateCore(client).isClientInitialized = false;

    const result = await client.clusterChange('new-cluster');
    expect(result.success).toBe(false);
    expect(result.error).toContain('cluster restart failed');
  });
});
