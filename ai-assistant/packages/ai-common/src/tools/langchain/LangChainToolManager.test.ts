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

import { describe, expect, it, vi } from 'vitest';
import {
  NullToolClient as NullMCPClientAdapter,
  type ToolClient as MCPClientAdapter,
} from '../../mcp/client/ToolClient';
import type { LangChainTool } from './LangChainTool';
import { LangChainToolManager } from './LangChainToolManager';

/** Private ToolManager surface exercised by focused unit tests. */
interface ToolManagerTestHarness {
  hasActualValue(value: unknown): boolean;
  createDefaultParameterStructure(schema: unknown): Record<string, unknown>;
  buildMCPToolDescription(toolData: Record<string, unknown>): string;
  detectMCPError(result: string): boolean;
  extractErrorMessage(result: string): string;
  mapMCPToolArguments(args: unknown, schema?: unknown): Record<string, unknown>;
  filterMCPArguments(args: unknown, schema?: unknown): Record<string, unknown>;
  tools: LangChainTool[];
  addTool(tool: LangChainTool): void;
}

function privateManager(manager: LangChainToolManager): ToolManagerTestHarness {
  return manager as unknown as ToolManagerTestHarness;
}

describe('NullMCPClientAdapter', () => {
  const adapter = new NullMCPClientAdapter();

  it('isAvailable returns false', () => {
    expect(adapter.isAvailable()).toBe(false);
  });

  it('getConfig returns success: false', async () => {
    const result = await adapter.getConfig();
    expect(result.success).toBe(false);
  });

  it('getToolsConfig returns success: false', async () => {
    const result = await adapter.getToolsConfig();
    expect(result.success).toBe(false);
  });

  it('executeTool returns null', async () => {
    expect(await adapter.executeTool()).toBeNull();
  });

  it('isToolEnabled returns false', async () => {
    expect(await adapter.isToolEnabled()).toBe(false);
  });

  it('setToolEnabled returns false', async () => {
    expect(await adapter.setToolEnabled()).toBe(false);
  });

  it('getToolStats returns null', async () => {
    expect(await adapter.getToolStats()).toBeNull();
  });

  it('updateToolsConfig returns false', async () => {
    expect(await adapter.updateToolsConfig()).toBe(false);
  });

  it('parseToolName splits on double-underscore', () => {
    expect(adapter.parseToolName('myServer__myTool')).toEqual({
      serverName: 'myServer',
      toolName: 'myTool',
    });
  });

  it('parseToolName falls back to default server when no separator', () => {
    expect(adapter.parseToolName('plainTool')).toEqual({
      serverName: 'default',
      toolName: 'plainTool',
    });
  });
});

describe('ToolManager with injected MCPClientAdapter', () => {
  it('uses NullMCPClientAdapter by default', () => {
    const mgr = new LangChainToolManager();
    expect(mgr.getMCPClient().isAvailable()).toBe(false);
  });

  it('accepts a custom MCPClientAdapter', async () => {
    let wasCalled = false;
    const customAdapter: MCPClientAdapter = {
      isAvailable: () => true,
      getConfig: async () => ({ success: true, config: { enabled: true, servers: [] } }),
      getToolsConfig: async () => ({ success: false }),
      executeTool: async () => null,
      isToolEnabled: async () => true,
      setToolEnabled: async () => true,
      getToolStats: async () => null,
      updateToolsConfig: async () => {
        wasCalled = true;
        return true;
      },
      parseToolName: name => ({ serverName: 'x', toolName: name }),
    };

    const mgr = new LangChainToolManager({ mcpClient: customAdapter });
    expect(mgr.getMCPClient().isAvailable()).toBe(true);
    await mgr.updateMCPToolsConfig({});
    expect(wasCalled).toBe(true);
  });
});

// ── Helper: build a minimal MCPClientAdapter that has tools ──────────────────

function makeMCPAdapter(overrides: Partial<MCPClientAdapter> = {}): MCPClientAdapter {
  return {
    isAvailable: () => true,
    getConfig: async () => ({
      success: true,
      config: {
        enabled: true,
        servers: [{ name: 'test-server', command: 'test', args: [], enabled: true }],
      },
    }),
    getToolsConfig: async () => ({
      success: true,
      config: {
        'test-server': {
          my_tool: {
            description: 'A test tool',
            inputSchema: {
              properties: { query: { type: 'string', description: 'Search query' } },
              required: ['query'],
            },
            enabled: true,
          },
        },
      },
    }),
    executeTool: async (_name, _args) => ({ result: 'tool output' }),
    isToolEnabled: async () => true,
    setToolEnabled: async () => true,
    getToolStats: async () => null,
    updateToolsConfig: async () => true,
    parseToolName: fullName => {
      const [serverName, toolName] = fullName.split('__');
      return { serverName: serverName || 'default', toolName: toolName || fullName };
    },
    ...overrides,
  };
}

// ── hasActualValue ────────────────────────────────────────────────────────────

describe('ToolManager — hasActualValue (private)', () => {
  const mgr = new LangChainToolManager();
  const has = (value: unknown) => privateManager(mgr).hasActualValue(value);

  it('returns false for null', () => expect(has(null)).toBe(false));
  it('returns false for undefined', () => expect(has(undefined)).toBe(false));
  it('returns false for empty string', () => expect(has('')).toBe(false));
  it('returns false for empty array', () => expect(has([])).toBe(false));
  it('returns false for empty object', () => expect(has({})).toBe(false));

  it('returns true for 0 (zero is an actual value)', () => expect(has(0)).toBe(true));
  it('returns true for false (false is an actual value)', () => expect(has(false)).toBe(true));
  it('returns true for non-empty string', () => expect(has('hello')).toBe(true));
  it('returns true for positive number', () => expect(has(42)).toBe(true));
  it('returns true for non-empty array', () => expect(has([1, 2])).toBe(true));
  it('returns true for non-empty object', () => expect(has({ a: 1 })).toBe(true));

  it('returns false for NaN (fixed: NaN is not an actual value)', () => {
    // BUG FIX: NaN previously passed the `typeof === 'number'` check and returned
    // true. Fixed by adding an explicit Number.isNaN() guard.
    expect(has(NaN)).toBe(false);
  });
});

// ── createDefaultParameterStructure ──────────────────────────────────────────

describe('ToolManager — createDefaultParameterStructure (private)', () => {
  const mgr = new LangChainToolManager();
  const create = (schema: unknown) => privateManager(mgr).createDefaultParameterStructure(schema);

  it('returns {} for null schema', () => expect(create(null)).toEqual({}));
  it('returns {} for schema with no properties', () => expect(create({})).toEqual({}));

  it('creates string default for required string property', () => {
    const schema = {
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    expect(create(schema)).toEqual({ name: '' });
  });

  it('uses propSchema.default when available', () => {
    const schema = {
      properties: { count: { type: 'number', default: 5 } },
      required: ['count'],
    };
    expect(create(schema)).toEqual({ count: 5 });
  });

  it('creates number default (0) for required number property', () => {
    const schema = {
      properties: { limit: { type: 'number' } },
      required: ['limit'],
    };
    expect(create(schema)).toEqual({ limit: 0 });
  });

  it('creates boolean default (false) for required boolean property', () => {
    const schema = {
      properties: { enabled: { type: 'boolean' } },
      required: ['enabled'],
    };
    expect(create(schema)).toEqual({ enabled: false });
  });

  it('creates array default ([]) for required array property', () => {
    const schema = {
      properties: { items: { type: 'array' } },
      required: ['items'],
    };
    expect(create(schema)).toEqual({ items: [] });
  });

  it('creates object default ({}) for required object property', () => {
    const schema = {
      properties: { config: { type: 'object' } },
      required: ['config'],
    };
    expect(create(schema)).toEqual({ config: {} });
  });

  it('only creates defaults for required properties, not optional', () => {
    const schema = {
      properties: {
        required_field: { type: 'string' },
        optional_field: { type: 'string' },
      },
      required: ['required_field'],
    };
    const result = create(schema);
    expect(result).toHaveProperty('required_field');
    expect(result).not.toHaveProperty('optional_field');
  });

  it('skips required property that is not in schema properties', () => {
    const schema = {
      properties: { name: { type: 'string' } },
      required: ['name', 'ghost_prop'], // ghost_prop not in properties
    };
    const result = create(schema);
    expect(result).toHaveProperty('name');
    expect(result).not.toHaveProperty('ghost_prop');
  });
});

// ── buildMCPToolDescription ───────────────────────────────────────────────────

describe('ToolManager — buildMCPToolDescription (private)', () => {
  const mgr = new LangChainToolManager();
  const build = (toolData: Record<string, unknown>) =>
    privateManager(mgr).buildMCPToolDescription(toolData);

  it('returns bare description when no schema properties', () => {
    expect(build({ name: 'tool', description: 'Does stuff' })).toBe('Does stuff');
  });

  it('falls back to "MCP tool: <name>" when no description', () => {
    expect(build({ name: 'my_tool' })).toBe('MCP tool: my_tool');
  });

  it('appends parameters section when schema has properties', () => {
    const toolData = {
      name: 'search_tool',
      description: 'Search for stuff',
      inputSchema: {
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    };
    const result = build(toolData);
    expect(result).toContain('Search for stuff');
    expect(result).toContain('Parameters:');
    expect(result).toContain('query');
    expect(result).toContain('(required)');
  });

  it('marks optional parameters without (required)', () => {
    const toolData = {
      name: 'tool',
      description: 'desc',
      inputSchema: {
        properties: { limit: { type: 'number' } },
        required: [],
      },
    };
    const result = build(toolData);
    expect(result).toContain('limit');
    expect(result).not.toContain('(required)');
  });

  it('uses prop.type when description is missing', () => {
    const toolData = {
      name: 'tool',
      description: 'desc',
      inputSchema: {
        properties: { count: { type: 'integer' } },
        required: ['count'],
      },
    };
    expect(build(toolData)).toContain('integer');
  });
});

// ── detectMCPError ────────────────────────────────────────────────────────────

describe('ToolManager — detectMCPError (private)', () => {
  const mgr = new LangChainToolManager();
  const detect = (result: string) => privateManager(mgr).detectMCPError(result);

  it('detects success:false as error', () => expect(detect('{"success":false}')).toBe(true));
  it('detects error:true as error', () => expect(detect('{"error":true}')).toBe(true));
  it('returns false for clean success response', () => {
    expect(detect('{"success":true,"data":{}}')).toBe(false);
  });
  it('detects message containing "error" as error', () => {
    expect(detect('{"message":"An error occurred"}')).toBe(true);
  });
  it('returns false for message not containing "error"', () => {
    expect(detect('{"message":"Operation completed"}')).toBe(false);
  });
  it('detects non-JSON "error" string as error', () => {
    expect(detect('Error: connection refused')).toBe(true);
  });
  it('detects non-JSON "failed" string as error', () => {
    expect(detect('Operation failed')).toBe(true);
  });
  it('detects non-JSON "exception" string as error', () => {
    expect(detect('NullPointerException thrown')).toBe(true);
  });
  it('detects non-JSON "schema mismatch" as error', () => {
    expect(detect('schema mismatch in response')).toBe(true);
  });
  it('returns false for plain success text', () => {
    expect(detect('pods found: 3')).toBe(false);
  });
  it('detects string error field in JSON', () => {
    expect(detect('{"error":"something went wrong"}')).toBe(true);
  });

  it('{ error: 0 } — numeric 0 means no-error by convention, returns false', () => {
    // error:0 is conventionally "no error" in many APIs (HTTP-style error codes).
    // The fix explicitly excludes 0 as an error indicator. By design.
    expect(detect('{"error":0}')).toBe(false);
  });

  it('BUG FIX: non-zero numeric error codes are now detected as errors', () => {
    // { error: 404 } or { error: 500 } should be treated as errors.
    // Previously these were missed because `if (parsed.error)` is truthy for
    // non-zero numbers, but the old code structure had redundancy issues.
    // The new explicit check handles this.
    expect(detect('{"error":404}')).toBe(true);
    expect(detect('{"error":500}')).toBe(true);
  });
});

// ── extractErrorMessage ───────────────────────────────────────────────────────

describe('ToolManager — extractErrorMessage (private)', () => {
  const mgr = new LangChainToolManager();
  const extract = (result: string) => privateManager(mgr).extractErrorMessage(result);

  it('returns string error field from JSON', () => {
    expect(extract('{"error":"connection refused"}')).toBe('connection refused');
  });
  it('returns message field from JSON', () => {
    expect(extract('{"message":"Timeout exceeded"}')).toBe('Timeout exceeded');
  });
  it('returns details field from JSON', () => {
    expect(extract('{"details":"Stack overflow"}')).toBe('Stack overflow');
  });
  it('returns default message when no recognized field', () => {
    expect(extract('{"code":500}')).toBe('Tool execution failed with an unspecified error');
  });
  it('returns raw non-JSON text when short', () => {
    expect(extract('Connection refused')).toBe('Connection refused');
  });
  it('truncates long non-JSON text at 200 chars', () => {
    const long = 'x'.repeat(300);
    const result = extract(long);
    expect(result).toHaveLength(203); // 200 + "..."
    expect(result.endsWith('...')).toBe(true);
  });
  it('prefers error over message when both exist', () => {
    expect(extract('{"error":"auth failed","message":"see error field"}')).toBe('auth failed');
  });
  it('skips non-string error field and falls through to message', () => {
    expect(extract('{"error":{},"message":"fallback"}')).toBe('fallback');
  });
});

// ── mapMCPToolArguments ───────────────────────────────────────────────────────

describe('ToolManager — mapMCPToolArguments (private)', () => {
  const mgr = new LangChainToolManager();
  const map = (args: unknown, schema?: unknown) =>
    privateManager(mgr).mapMCPToolArguments(args, schema);

  it('returns args as-is when no inputSchema', () => {
    expect(map({ query: 'pods' }, undefined)).toEqual({ query: 'pods' });
  });

  it('returns {} for empty schema properties', () => {
    expect(map({ query: 'pods' }, { properties: {} })).toEqual({});
  });

  it('returns {} for null args when schema has no required props', () => {
    expect(map(null, { properties: { opt: { type: 'string' } }, required: [] })).toEqual({});
  });

  it('creates defaults for null args when schema has required props', () => {
    const schema = {
      properties: { query: { type: 'string' } },
      required: ['query'],
    };
    const result = map(null, schema);
    expect(result).toHaveProperty('query', '');
  });

  it('passes through args that match schema properties', () => {
    const schema = {
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query'],
    };
    expect(map({ query: 'pods', limit: 10 }, schema)).toMatchObject({ query: 'pods', limit: 10 });
  });

  it('strips non-schema fields from args', () => {
    const schema = {
      properties: { query: { type: 'string' } },
      required: ['query'],
    };
    const result = map({ query: 'pods', extra_field: 'ignored' }, schema);
    expect(result).toHaveProperty('query', 'pods');
    expect(result).not.toHaveProperty('extra_field');
  });

  it('handles "input" wrapper when schema has a single property', () => {
    const schema = {
      properties: { query: { type: 'string' } },
      required: ['query'],
    };
    expect(map({ input: 'search pods' }, schema)).toEqual({ query: 'search pods' });
  });

  it('maps primitive input to first schema property when no common mapping', () => {
    const schema = {
      properties: { custom_param: { type: 'string' } },
      required: ['custom_param'],
    };
    expect(map({ input: 'value' }, schema)).toEqual({ custom_param: 'value' });
  });

  it('maps a numeric input wrapper to the first required property', () => {
    const schema = {
      properties: { count: { type: 'number' }, label: { type: 'string' } },
      required: ['count'],
    };
    expect(map({ input: 0 }, schema)).toEqual({ count: 0 });
  });

  it('maps "input" string to "query" when schema has query property', () => {
    const schema = {
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    };
    expect(map({ input: 'pods' }, schema)).toMatchObject({ query: 'pods' });
  });

  it('returns {} for empty string args when no required props', () => {
    const schema = { properties: { opt: { type: 'string' } }, required: [] };
    expect(map('', schema)).toEqual({});
  });
});

// ── filterMCPArguments ────────────────────────────────────────────────────────

describe('ToolManager — filterMCPArguments (private)', () => {
  const mgr = new LangChainToolManager();
  const filter = (args: unknown, schema?: unknown) =>
    privateManager(mgr).filterMCPArguments(args, schema);

  it('returns args as-is when no schema', () => {
    expect(filter({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it('rejects primitive args because the MCP adapter requires an argument object', () => {
    expect(filter('raw string', { properties: {} })).toEqual({});
  });

  it('includes required properties even when value is empty string', () => {
    const schema = {
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    expect(filter({ name: '' }, schema)).toHaveProperty('name', '');
  });

  it('adds default value for missing required property', () => {
    const schema = {
      properties: { count: { type: 'number' } },
      required: ['count'],
    };
    expect(filter({}, schema)).toHaveProperty('count', 0);
  });

  it('excludes optional properties with empty string values', () => {
    const schema = {
      properties: { req: { type: 'string' }, opt: { type: 'string' } },
      required: ['req'],
    };
    const result = filter({ req: 'yes', opt: '' }, schema);
    expect(result).toHaveProperty('req', 'yes');
    expect(result).not.toHaveProperty('opt');
  });

  it('excludes properties not in schema', () => {
    const schema = { properties: { query: { type: 'string' } }, required: [] };
    const result = filter({ query: 'pods', unknown: 'value' }, schema);
    expect(result).not.toHaveProperty('unknown');
  });

  it('includes optional properties that have actual values', () => {
    const schema = {
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query'],
    };
    const result = filter({ query: 'pods', limit: 10 }, schema);
    expect(result).toHaveProperty('limit', 10);
  });
});

// ── initializeMCPTools via constructor ────────────────────────────────────────

describe('ToolManager — initializeMCPTools via constructor', () => {
  it('sets mcpToolsInitialized=true when client is not available', async () => {
    const mgr = new LangChainToolManager(); // NullMCPClientAdapter (not available)
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.areMCPToolsInitialized()).toBe(true);
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('loads MCP tools from a configured server', async () => {
    const adapter = makeMCPAdapter();
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const tools = mgr.getMCPTools();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0].name).toBe('test-server__my_tool');
  });

  it('skips tools from servers not in the config', async () => {
    const adapter = makeMCPAdapter({
      getConfig: async () => ({
        success: true,
        config: {
          enabled: true,
          servers: [{ name: 'active-server', command: 'test', args: [], enabled: true }],
        },
      }),
      getToolsConfig: async () => ({
        success: true,
        config: {
          'active-server': {
            tool_a: { description: 'A', inputSchema: {}, enabled: true },
          },
          'ghost-server': {
            tool_b: { description: 'B', inputSchema: {}, enabled: true },
          },
        },
      }),
      isToolEnabled: async () => true,
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const names = mgr.getMCPTools().map(t => t.name);
    expect(names).toContain('active-server__tool_a');
    expect(names).not.toContain('ghost-server__tool_b');
  });

  it('sets mcpToolsInitialized=true with empty servers config', async () => {
    const adapter = makeMCPAdapter({
      getConfig: async () => ({ success: true, config: { enabled: true, servers: [] } }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.areMCPToolsInitialized()).toBe(true);
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('filters out disabled tools (enabled:false)', async () => {
    const adapter = makeMCPAdapter({
      getToolsConfig: async () => ({
        success: true,
        config: {
          'test-server': {
            disabled_tool: {
              description: 'Disabled',
              inputSchema: {},
              enabled: false, // ← disabled
            },
          },
        },
      }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('filters out tools where isToolEnabled returns false', async () => {
    const adapter = makeMCPAdapter({
      isToolEnabled: async () => false, // all tools disabled via config system
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('handles getToolsConfig returning empty config gracefully', async () => {
    const adapter = makeMCPAdapter({
      getToolsConfig: async () => ({ success: true, config: {} }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.areMCPToolsInitialized()).toBe(true);
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('handles getToolsConfig failure gracefully', async () => {
    const adapter = makeMCPAdapter({
      getToolsConfig: async () => ({ success: false }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.areMCPToolsInitialized()).toBe(true);
    expect(mgr.getMCPTools()).toHaveLength(0);
  });

  it('handles initializeMCPTools throwing gracefully', async () => {
    const adapter = makeMCPAdapter({
      getConfig: async () => {
        throw new Error('network error');
      },
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.areMCPToolsInitialized()).toBe(true);
  });

  it('clears stale MCP tools when a refresh fails', async () => {
    let shouldFail = false;
    const adapter = makeMCPAdapter({
      getConfig: async () => {
        if (shouldFail) throw new Error('network error');
        return {
          success: true,
          config: {
            enabled: true,
            servers: [{ name: 'test-server', command: 'test', args: [], enabled: true }],
          },
        };
      },
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.getMCPTools()).toHaveLength(1);

    shouldFail = true;
    await mgr.refreshMCPTools();

    expect(mgr.getMCPTools()).toHaveLength(0);
    expect(mgr.areMCPToolsInitialized()).toBe(true);
  });

  it('serializes an undefined MCP execution result as an empty string', async () => {
    const adapter = makeMCPAdapter({ executeTool: async () => undefined });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const [tool] = mgr.getMCPTools();
    await expect(tool.invoke({ query: 'pods' })).resolves.toBe('');
  });
});

// ── getToolNames / getLangChainTools / getMCPTools / hasTool ─────────────────

describe('ToolManager — inventory methods', () => {
  it('getToolNames includes kubernetes_api_request by default', () => {
    const mgr = new LangChainToolManager();
    expect(mgr.getToolNames()).toContain('kubernetes_api_request');
  });

  it('getToolNames respects enabledToolIds filter', () => {
    const mgr = new LangChainToolManager({ enabledToolIds: [] });
    expect(mgr.getToolNames()).toHaveLength(0);
  });

  it('getLangChainTools returns LangChain tools', () => {
    const mgr = new LangChainToolManager();
    const tools = mgr.getLangChainTools();
    expect(tools.length).toBeGreaterThan(0);
  });

  it('hasTool returns true for an existing tool', () => {
    const mgr = new LangChainToolManager();
    expect(mgr.hasTool('kubernetes_api_request')).toBe(true);
  });

  it('hasTool returns false for an unknown tool', () => {
    const mgr = new LangChainToolManager();
    expect(mgr.hasTool('nonexistent_tool')).toBe(false);
  });

  it('hasTool returns true for MCP tools', async () => {
    const adapter = makeMCPAdapter();
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.hasTool('test-server__my_tool')).toBe(true);
  });

  it('getMCPTools includes tools after initialization', async () => {
    const adapter = makeMCPAdapter();
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();
    expect(mgr.getMCPTools().length).toBeGreaterThan(0);
  });

  it('addTool prevents duplicate tool names (via second instantiation)', () => {
    const mgr = new LangChainToolManager();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Attempt to add the same tool again via addTool
    const existingTool = privateManager(mgr).tools[0];
    if (existingTool) {
      privateManager(mgr).addTool(existingTool);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    }
    warn.mockRestore();
  });
});

// ── executeTool ───────────────────────────────────────────────────────────────

describe('ToolManager — executeTool', () => {
  it('returns error response for disabled/unknown tool', async () => {
    const mgr = new LangChainToolManager({ enabledToolIds: [] });
    const result = await mgr.executeTool('kubernetes_api_request', {});
    const content = JSON.parse(result.content);
    expect(content.error).toBe(true);
    expect(content.message).toContain('disabled or not available');
    expect(result.shouldAddToHistory).toBe(true);
    expect(result.shouldProcessFollowUp).toBe(false);
  });

  it('BUG FIX: regular tool errors are now wrapped as ToolResponse instead of throwing', async () => {
    // Previously executeTool let regular-tool errors propagate to the caller.
    // Fixed: handler errors are caught and returned as a ToolResponse with error:true,
    // consistent with how MCP tool errors are handled.
    const mgr = new LangChainToolManager();
    const result = await mgr.executeTool('kubernetes_api_request', {
      url: '/api/v1/pods',
      method: 'GET',
    });
    const content = JSON.parse(result.content);
    expect(content.error).toBe(true);
    expect(content.message).toContain('context not configured');
    expect(result.shouldAddToHistory).toBe(true);
    expect(result.metadata?.isError).toBe(true);
  });

  it('calls MCP tool invoke for MCP tool', async () => {
    let invoked = false;
    const adapter = makeMCPAdapter({
      executeTool: async () => {
        invoked = true;
        return { result: '{"pods": []}' };
      },
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    await mgr.executeTool('test-server__my_tool', { query: 'pods' });
    expect(invoked).toBe(true);
  });

  it('returns error ToolResponse when MCP tool invoke throws', async () => {
    const adapter = makeMCPAdapter({
      executeTool: async () => {
        throw new Error('MCP crash');
      },
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const result = await mgr.executeTool('test-server__my_tool', { query: 'pods' });
    const content = JSON.parse(result.content);
    expect(content.error).toBe(true);
    expect(result.shouldAddToHistory).toBe(true);
    expect(result.metadata?.isError).toBe(true);
  });

  it('returns formatted error when MCP tool result indicates error', async () => {
    const adapter = makeMCPAdapter({
      executeTool: async () => ({ result: '{"success":false,"message":"Not found"}' }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const result = await mgr.executeTool('test-server__my_tool', { query: 'missing' });
    // isError should be set in metadata
    expect(result.metadata?.isError).toBe(true);
  });
});

// ── refreshMCPTools ───────────────────────────────────────────────────────────

describe('ToolManager — refreshMCPTools', () => {
  it('resets and reinitializes MCP tools', async () => {
    const adapter = makeMCPAdapter();
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.waitForMCPToolsInitialization();

    const before = mgr.getMCPTools().length;
    await mgr.refreshMCPTools();
    const after = mgr.getMCPTools().length;

    expect(after).toBe(before);
    expect(mgr.areMCPToolsInitialized()).toBe(true);
  });
});

// ── MCP management methods ────────────────────────────────────────────────────

describe('ToolManager — MCP management methods', () => {
  it('setMCPToolEnabled returns false when client not available', async () => {
    const mgr = new LangChainToolManager(); // NullMCPClientAdapter
    expect(await mgr.setMCPToolEnabled('tool', true)).toBe(false);
  });

  it('isMCPToolEnabled returns true when client not available', async () => {
    const mgr = new LangChainToolManager(); // NullMCPClientAdapter — defaults to true
    expect(await mgr.isMCPToolEnabled('tool')).toBe(true);
  });

  it('isMCPToolEnabled delegates to client when available', async () => {
    const adapter = makeMCPAdapter({ isToolEnabled: async () => false });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    expect(await mgr.isMCPToolEnabled('any_tool')).toBe(false);
  });

  it('getMCPToolStats returns null when client not available', async () => {
    const mgr = new LangChainToolManager();
    expect(await mgr.getMCPToolStats('tool')).toBeNull();
  });

  it('getMCPToolsConfig returns error when client not available', async () => {
    const mgr = new LangChainToolManager();
    const result = await mgr.getMCPToolsConfig();
    expect(result.success).toBe(false);
    expect(result.error).toContain('not available');
  });

  it('getMCPToolsConfig delegates to client when available', async () => {
    const adapter = makeMCPAdapter({
      getToolsConfig: async () => ({ success: true, config: { server: {} } }),
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    const result = await mgr.getMCPToolsConfig();
    expect(result.success).toBe(true);
  });

  it('updateMCPToolsConfig returns false when client not available', async () => {
    const mgr = new LangChainToolManager();
    expect(await mgr.updateMCPToolsConfig({})).toBe(false);
  });

  it('setMCPToolEnabled calls setToolEnabled on the client', async () => {
    let calledWith: { serverName: string; toolName: string; enabled: boolean } | null = null;
    const adapter = makeMCPAdapter({
      setToolEnabled: async (serverName, toolName, enabled) => {
        calledWith = { serverName, toolName, enabled };
        return true;
      },
      parseToolName: name => {
        const [s, t] = name.split('__');
        return { serverName: s || 'default', toolName: t || name };
      },
    });
    const mgr = new LangChainToolManager({ mcpClient: adapter });
    await mgr.setMCPToolEnabled('my-server__my-tool', false);
    expect(calledWith).toEqual({ serverName: 'my-server', toolName: 'my-tool', enabled: false });
  });
});
