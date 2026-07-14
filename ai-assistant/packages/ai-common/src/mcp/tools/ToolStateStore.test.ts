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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileStorage } from '../persistence/FileStorage';
import type { Storage } from '../persistence/Storage';
import type { MCPToolsConfig } from '../types';
import { ToolStateStore } from './ToolStateStore';

function tmpPath(): string {
  return path.join(os.tmpdir(), `mcp-test-${Date.now()}-${Math.random()}.json`);
}

/** Convenience factory: mirrors the old `new MCPToolStateStore(path)` signature. */
function makeStore(p: string): ToolStateStore {
  return new ToolStateStore(new FileStorage(p));
}

/** Private queue surface used to await fire-and-forget persistence in tests. */
function pendingWrites(store: ToolStateStore): Promise<void> {
  return (store as unknown as { writeQueue: Promise<void> }).writeQueue;
}

describe('MCPToolStateStore', () => {
  let toolStatePath: string;

  beforeEach(() => {
    toolStatePath = tmpPath();
    try {
      if (fs.existsSync(toolStatePath)) fs.unlinkSync(toolStatePath);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(toolStatePath)) fs.unlinkSync(toolStatePath);
    } catch {
      // ignore
    }
  });

  it('defaults to enabled for unknown server/tool', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();
    expect(toolState.isToolEnabled('cluster-x', 'tool-a')).toBe(true);
  });

  it('contains synchronous errors from a debounced storage write', async () => {
    const storage: Storage = {
      read: async () => null,
      write: () => {
        throw new Error('write failed');
      },
      writeSync: () => {},
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();

    try {
      const toolState = new ToolStateStore(storage);
      toolState.setToolEnabled('cluster-x', 'tool-a', false);

      expect(() => vi.runAllTimers()).not.toThrow();
      await pendingWrites(toolState);
      expect(consoleError).toHaveBeenCalledWith(
        'Error saving MCP tools configuration:',
        expect.objectContaining({ message: 'write failed' })
      );
    } finally {
      vi.useRealTimers();
      consoleError.mockRestore();
    }
  });

  it('serializes debounced writes so newer state is persisted last', async () => {
    const snapshots: string[] = [];
    const resolvers: Array<() => void> = [];
    let notifySecondStarted: () => void = () => {};
    const secondStarted = new Promise<void>(resolve => {
      notifySecondStarted = resolve;
    });
    const storage: Storage = {
      read: async () => null,
      write: data =>
        new Promise<void>(resolve => {
          snapshots.push(data);
          resolvers.push(resolve);
          if (snapshots.length === 2) notifySecondStarted();
        }),
      writeSync: () => {},
    };
    vi.useFakeTimers();

    try {
      const toolState = new ToolStateStore(storage);
      toolState.setToolEnabled('cluster-x', 'tool-a', false);
      vi.advanceTimersByTime(50);
      await Promise.resolve();
      expect(snapshots).toHaveLength(1);

      toolState.setToolEnabled('cluster-x', 'tool-a', true);
      vi.advanceTimersByTime(50);
      await Promise.resolve();
      expect(snapshots).toHaveLength(1);

      resolvers[0]();
      await secondStarted;
      expect(snapshots).toHaveLength(2);
      expect(JSON.parse(snapshots[0])['cluster-x']['tool-a'].enabled).toBe(false);
      expect(JSON.parse(snapshots[1])['cluster-x']['tool-a'].enabled).toBe(true);
      resolvers[1]();
      await pendingWrites(toolState);
    } finally {
      vi.useRealTimers();
    }
  });

  it('contains rejected errors from a debounced storage write', async () => {
    const storage: Storage = {
      read: async () => null,
      write: async () => {
        throw new Error('async write failed');
      },
      writeSync: () => {},
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();

    try {
      const toolState = new ToolStateStore(storage);
      toolState.setToolEnabled('cluster-x', 'tool-a', false);
      vi.runAllTimers();
      await pendingWrites(toolState);

      expect(consoleError).toHaveBeenCalledWith(
        'Error saving MCP tools configuration:',
        expect.objectContaining({ message: 'async write failed' })
      );
    } finally {
      vi.useRealTimers();
      consoleError.mockRestore();
    }
  });

  it('contains synchronous errors while serializing a debounced write', () => {
    const write = vi.fn();
    const storage: Storage = {
      read: async () => null,
      write,
      writeSync: () => {},
    };
    const cyclicConfig: MCPToolsConfig = {};
    (cyclicConfig as Record<string, unknown>).self = cyclicConfig;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();

    try {
      const toolState = new ToolStateStore(storage);
      toolState.replaceConfig(cyclicConfig);

      expect(() => vi.runAllTimers()).not.toThrow();
      expect(write).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Error saving MCP tools configuration:',
        expect.any(TypeError)
      );
    } finally {
      vi.useRealTimers();
      consoleError.mockRestore();
    }
  });

  it('treats missing/undefined enabled field as enabled (default-enabled for corrupt/old configs)', async () => {
    // Regression: toolState.enabled was returned directly; undefined → falsy → treated as disabled.
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    // Inject a config entry without an explicit enabled field to simulate a
    // corrupt or older persisted config that predates the field.
    toolState.setConfig({
      srv: {
        'no-enabled-field': { usageCount: 0 }, // enabled intentionally absent — valid per optional type
        'explicitly-false': { enabled: false, usageCount: 0 },
        'explicitly-true': { enabled: true, usageCount: 0 },
      },
    });

    expect(toolState.isToolEnabled('srv', 'no-enabled-field')).toBe(true); // not false
    expect(toolState.isToolEnabled('srv', 'explicitly-false')).toBe(false);
    expect(toolState.isToolEnabled('srv', 'explicitly-true')).toBe(true);

    // getDisabledTools must only list tools with enabled === false, not undefined
    expect(toolState.getDisabledTools('srv')).toEqual(['explicitly-false']);

    // getEnabledTools must include tools with enabled undefined (default-enabled)
    const enabled = toolState.getEnabledTools('srv');
    expect(enabled).toContain('no-enabled-field');
    expect(enabled).toContain('explicitly-true');
    expect(enabled).not.toContain('explicitly-false');
  });

  it('setToolEnabled updates state and getDisabled/getEnabled reflect it', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    toolState.setToolEnabled('cluster-a', 'tool-1', false);
    expect(toolState.isToolEnabled('cluster-a', 'tool-1')).toBe(false);
    expect(toolState.getDisabledTools('cluster-a')).toContain('tool-1');
    expect(toolState.getEnabledTools('cluster-a')).not.toContain('tool-1');

    toolState.setToolEnabled('cluster-a', 'tool-1', true);
    expect(toolState.isToolEnabled('cluster-a', 'tool-1')).toBe(true);
    expect(toolState.getEnabledTools('cluster-a')).toContain('tool-1');
  });

  it('recordToolUsage increments usageCount and sets lastUsed (in-memory)', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    toolState.recordToolUsage('cluster-u', 'tool-u');
    toolState.recordToolUsage('cluster-u', 'tool-u');

    const stats = toolState.getToolStats('cluster-u', 'tool-u');
    expect(stats).not.toBeNull();
    expect(stats?.usageCount).toBe(2);
    expect(stats?.lastUsed).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('persists enabled state and usage to disk across instances', async () => {
    const cfg1 = makeStore(toolStatePath);
    await cfg1.initialize();
    cfg1.setToolEnabled('cluster-p', 'tool-p', false);
    cfg1.recordToolUsage('cluster-p', 'tool-p');
    // Flush the debounced write before reading from a new instance.
    cfg1.flushSync();

    // create a fresh instance which loads from the same file
    const cfg2 = makeStore(toolStatePath);
    await cfg2.initialize();
    expect(cfg2.isToolEnabled('cluster-p', 'tool-p')).toBe(false);

    const stats = cfg2.getToolStats('cluster-p', 'tool-p');
    // After save/load via JSON, lastUsed is an ISO-8601 string
    expect(stats?.usageCount).toBe(1);
    expect(typeof stats?.lastUsed).toBe('string');
  });

  it('initializeToolsConfig creates and updates schemas and descriptions', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    const schemaA = { type: 'object', properties: { a: { type: 'string' } } };
    toolState.initializeToolsConfig('srv', [
      { name: 'tool-x', inputSchema: schemaA, description: 'desc x' },
      { name: 'tool-y', inputSchema: { type: 'string' }, description: 'desc y' },
    ]);

    const s1 = toolState.getToolStats('srv', 'tool-x');
    expect(s1).not.toBeNull();
    expect(s1?.inputSchema).toEqual(schemaA);
    expect(s1?.description).toBe('desc x');

    // re-initialize with changed schema/description for tool-x
    const schemaA2 = { type: 'object', properties: { a: { type: 'number' } } };
    toolState.initializeToolsConfig('srv', [
      { name: 'tool-x', inputSchema: schemaA2, description: 'desc x updated' },
    ]);

    const s2 = toolState.getToolStats('srv', 'tool-x');
    expect(s2?.inputSchema).toEqual(schemaA2);
    expect(s2?.description).toBe('desc x updated');
  });

  it('replaceToolsConfig preserves enabled state and usageCount and removes missing tools', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    // create initial tools and modify state
    toolState.initializeToolsConfig('cluster-r', [
      { name: 'keep-tool', inputSchema: null, description: 'keep' },
      { name: 'drop-tool', inputSchema: null, description: 'drop' },
    ]);
    toolState.setToolEnabled('cluster-r', 'keep-tool', false);
    // increment usage for keep-tool
    toolState.recordToolUsage('cluster-r', 'keep-tool');
    toolState.recordToolUsage('cluster-r', 'keep-tool');

    // replace with only keep-tool (and maybe new-tool)
    toolState.replaceToolsConfig({
      'cluster-r': [
        { name: 'keep-tool', inputSchema: null, description: 'keep' },
        { name: 'new-tool', inputSchema: null, description: 'new' },
      ],
    });

    // dropped tool should be gone
    expect(toolState.getToolStats('cluster-r', 'drop-tool')).toBeNull();

    // keep-tool should preserve enabled and usageCount
    const keep = toolState.getToolStats('cluster-r', 'keep-tool');
    expect(keep).not.toBeNull();
    expect(keep?.usageCount).toBe(2);
    expect(keep?.enabled).toBe(false);

    // new-tool should exist with defaults
    const n = toolState.getToolStats('cluster-r', 'new-tool');
    expect(n).not.toBeNull();
    expect(n?.usageCount).toBe(0);
    expect(n?.enabled).toBe(true);
  });

  it('getConfig, setConfig, replaceConfig and resetConfig behave as expected', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    toolState.resetConfig();
    expect(Object.keys(toolState.getConfig())).toHaveLength(0);

    const newConf = {
      s1: {
        t1: { enabled: false, usageCount: 3, inputSchema: null, description: 'd' },
      },
    };
    toolState.setConfig(newConf);
    expect(toolState.getConfig()).toEqual(newConf);

    // replaceConfig should overwrite entirely
    const replaced = {
      s2: {
        t2: { enabled: true, usageCount: 0, inputSchema: null, description: '' },
      },
    };
    toolState.replaceConfig(replaced);
    expect(toolState.getConfig()).toEqual(replaced);

    // Flush the debounced write before reading from a new instance.
    toolState.flushSync();

    // persisted to disk and load into new instance
    const toolState2 = makeStore(toolStatePath);
    await toolState2.initialize();
    expect(toolState2.getConfig()).toEqual(replaced);
  });

  it('getConfig returns a deep clone — mutating the result does not alter store state', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    toolState.setConfig({
      srv: { 'tool-1': { enabled: true, usageCount: 0, inputSchema: null, description: '' } },
    });

    const snapshot = toolState.getConfig();
    // Mutate the returned object deeply
    snapshot['srv']['tool-1'].enabled = false;
    snapshot['srv']['tool-1'].usageCount = 99;

    // Store state must be unaffected
    expect(toolState.isToolEnabled('srv', 'tool-1')).toBe(true);
    expect(toolState.getToolStats('srv', 'tool-1')?.usageCount).toBe(0);
  });

  it('setConfig deep-clones the input — mutating the original does not alter store state', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    const conf = {
      srv: { 'tool-2': { enabled: true, usageCount: 0, inputSchema: null, description: '' } },
    };
    toolState.setConfig(conf);

    // Mutate the original object after calling setConfig
    conf['srv']['tool-2'].enabled = false;
    conf['srv']['tool-2'].usageCount = 77;

    // Store state must be unaffected
    expect(toolState.isToolEnabled('srv', 'tool-2')).toBe(true);
    expect(toolState.getToolStats('srv', 'tool-2')?.usageCount).toBe(0);
  });
});

describe('initConfigFromClientTools', () => {
  let toolStatePath: string;

  beforeEach(() => {
    toolStatePath = tmpPath();
    try {
      if (fs.existsSync(toolStatePath)) fs.unlinkSync(toolStatePath);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(toolStatePath)) fs.unlinkSync(toolStatePath);
    } catch {
      // ignore
    }
  });

  it('clears config when no client tools are provided', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    // Seed with some config
    toolState.setConfig({
      someServer: {
        someTool: { enabled: false, usageCount: 2, inputSchema: null, description: '' },
      },
    });
    expect(Object.keys(toolState.getConfig()).length).toBeGreaterThan(0);

    // init with empty client tools should clear the config
    toolState.initConfigFromClientTools([]);
    expect(Object.keys(toolState.getConfig())).toHaveLength(0);
  });

  it('groups tools by server, extracts schema and description, and sets defaults', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    const clientTools = [
      {
        name: 'srvA__tool-x',
        schema: { type: 'object', properties: { a: { type: 'string' } } },
        description: 'desc x',
      },
      { name: 'tool-no-server', description: 'global tool' }, // no schema provided
    ];

    toolState.initConfigFromClientTools(clientTools);

    const sx = toolState.getToolStats('srvA', 'tool-x');
    expect(sx).not.toBeNull();
    expect(sx?.inputSchema).toEqual({
      type: 'object',
      properties: { a: { type: 'string' } },
    });
    expect(sx?.description).toBe('desc x');
    expect(sx?.enabled).toBe(true);
    expect(sx?.usageCount).toBe(0);

    const gn = toolState.getToolStats('default', 'tool-no-server');
    expect(gn).not.toBeNull();
    expect(gn?.inputSchema).toBeNull();
    expect(gn?.description).toBe('global tool');
    expect(gn?.enabled).toBe(true);
  });

  it('preserves enabled state and usageCount from existing config when tool still exists', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    // Seed with a tool that has specific enabled/usage values
    toolState.setConfig({
      myServer: {
        preservedTool: {
          enabled: false,
          usageCount: 5,
          inputSchema: null,
          description: 'old desc',
        },
      },
    });

    // Client reports same tool (with updated schema/description)
    const clientTools = [
      { name: 'myServer__preservedTool', schema: { type: 'string' }, description: 'new desc' },
    ];

    toolState.initConfigFromClientTools(clientTools);

    const p = toolState.getToolStats('myServer', 'preservedTool');
    expect(p).not.toBeNull();
    // preserved values should remain
    expect(p?.enabled).toBe(false);
    expect(p?.usageCount).toBe(5);
    // schema/description should be updated from client tools
    expect(p?.inputSchema).toEqual({ type: 'string' });
    expect(p?.description).toBe('new desc');
  });

  it('prefers inputSchema over schema and rejects Zod-like objects', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    // Simulate a LangChain tool: .schema is a Zod object (no JSON-Schema shape),
    // .inputSchema is the proper JSON Schema provided by the MCP server.
    const zodLikeSchema = {
      _def: { typeName: 'ZodObject' },
      parse: () => {},
      safeParse: () => {},
      shape: { url: {}, method: {} },
    };
    const jsonSchema = { type: 'object', properties: { url: { type: 'string' } } };

    const clientTools = [
      // Tool with both: should use inputSchema, not schema (Zod)
      { name: 'srv__prefer-input', schema: zodLikeSchema, inputSchema: jsonSchema },
      // Tool with only Zod schema: should store null (not the Zod object)
      { name: 'srv__zod-only', schema: zodLikeSchema },
      // Tool with only JSON Schema on .schema: should store it
      { name: 'srv__schema-only', schema: jsonSchema },
    ];

    toolState.initConfigFromClientTools(clientTools);

    const preferInput = toolState.getToolStats('srv', 'prefer-input');
    expect(preferInput?.inputSchema).toEqual(jsonSchema);

    const zodOnly = toolState.getToolStats('srv', 'zod-only');
    // A Zod object must NOT be persisted
    expect(zodOnly?.inputSchema).toBeNull();

    const schemaOnly = toolState.getToolStats('srv', 'schema-only');
    expect(schemaOnly?.inputSchema).toEqual(jsonSchema);
  });

  it('initializeToolsConfig rejects non-serialisable schemas without throwing', async () => {
    // Regression: initializeToolsConfig previously stored inputSchema raw, so a
    // Zod-like object would be persisted and JSON.stringify would throw on the
    // next schema-comparison. It must now pass through toJsonSchema() the same
    // way initConfigFromClientTools does.
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    const zodLike = { _def: { typeName: 'ZodObject' }, parse: () => {}, shape: {} };
    const jsonSchema = { type: 'object', properties: { x: { type: 'string' } } };

    expect(() =>
      toolState.initializeToolsConfig('srv', [
        { name: 'zod-tool', inputSchema: zodLike },
        { name: 'json-tool', inputSchema: jsonSchema },
      ])
    ).not.toThrow();

    expect(toolState.getToolStats('srv', 'zod-tool')?.inputSchema).toBeNull();
    expect(toolState.getToolStats('srv', 'json-tool')?.inputSchema).toEqual(jsonSchema);

    // Calling again with a changed Zod schema must not throw on the JSON.stringify comparison
    expect(() =>
      toolState.initializeToolsConfig('srv', [
        { name: 'zod-tool', inputSchema: { ...zodLike, extra: true } },
      ])
    ).not.toThrow();
  });

  it('replaceToolsConfig rejects non-serialisable schemas without throwing', async () => {
    const toolState = makeStore(toolStatePath);
    await toolState.initialize();

    const zodLike = { _def: { typeName: 'ZodObject' }, parse: () => {}, shape: {} };
    const jsonSchema = { type: 'object', properties: { y: { type: 'number' } } };

    expect(() =>
      toolState.replaceToolsConfig({
        srv: [
          { name: 'zod-tool', inputSchema: zodLike },
          { name: 'json-tool', inputSchema: jsonSchema },
        ],
      })
    ).not.toThrow();

    expect(toolState.getToolStats('srv', 'zod-tool')?.inputSchema).toBeNull();
    expect(toolState.getToolStats('srv', 'json-tool')?.inputSchema).toEqual(jsonSchema);
  });
});
