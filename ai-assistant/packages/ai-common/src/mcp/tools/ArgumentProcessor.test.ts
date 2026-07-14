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
import type { MCPToolsConfig } from '../types';
import { MCPArgumentProcessor } from './ArgumentProcessor';
import { mcpToolSchemaRegistry } from './schemaRegistry';
import type { MCPToolSchema, UserContext } from './types';

type SchemaProperties = NonNullable<NonNullable<MCPToolSchema['inputSchema']>['properties']>;
type SchemaProperty = SchemaProperties[string];

/** Private static processor surface exercised by focused unit tests. */
interface ProcessorTestHarness {
  getEmptyValueForRequiredField(schema: SchemaProperty): unknown;
  suggestStringValue(name: string, description: string, schema: SchemaProperty): string | undefined;
  suggestNumberValue(name: string, description: string, schema: SchemaProperty): number | undefined;
  suggestBooleanValue(name: string): boolean | undefined;
  suggestArrayValue(): unknown[];
  suggestObjectValue(): Record<string, unknown>;
  generateIntelligentSuggestions(
    schema: MCPToolSchema,
    context?: UserContext
  ): Record<string, unknown>;
  validateArgumentsWithEmptyObjectSupport(
    args: Record<string, unknown>,
    schema: MCPToolSchema
  ): string[];
}

const privateProcessor = MCPArgumentProcessor as unknown as ProcessorTestHarness;

describe('MCPArgumentProcessor', () => {
  beforeEach(() => {
    mcpToolSchemaRegistry.reset();
  });

  it('loadSchemas does nothing when getToolsConfig is not injected', async () => {
    await MCPArgumentProcessor.loadSchemas();
    expect(mcpToolSchemaRegistry.isLoaded()).toBe(false);
  });

  it('loadSchemas populates toolSchemas from injected getToolsConfig', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({
      success: true,
      config: {
        myServer: {
          myTool: {
            description: 'A test tool',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string' } },
              required: ['query'],
            },
          },
        },
      },
    });

    await MCPArgumentProcessor.loadSchemas();

    expect(mcpToolSchemaRegistry.isLoaded()).toBe(true);
    const schema = await MCPArgumentProcessor.getToolSchema('myServer__myTool');
    expect(schema?.name).toBe('myServer__myTool');
    expect(schema?.description).toBe('A test tool');
  });

  it('processArguments returns errors when no schema is found', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config: {} });
    const result = await MCPArgumentProcessor.processArguments('unknown__tool', { foo: 'bar' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.schema).toBeNull();
  });

  it('processArguments fills required fields with defaults when missing', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({
      success: true,
      config: {
        srv: {
          tool: {
            inputSchema: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
        },
      },
    });

    const result = await MCPArgumentProcessor.processArguments('srv__tool', {});
    expect(result.processed).toHaveProperty('name');
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSchema(properties: SchemaProperties, required: string[] = []): MCPToolSchema {
  return {
    name: 'test__tool',
    description: 'A tool',
    inputSchema: { type: 'object', properties, required },
  };
}

function resetAndInject(config: MCPToolsConfig) {
  mcpToolSchemaRegistry.reset();
  MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config });
}

// ── loadSchemas — bug fix ─────────────────────────────────────────────────────

describe('MCPArgumentProcessor.loadSchemas — bug fixes', () => {
  beforeEach(() => {
    mcpToolSchemaRegistry.reset();
  });

  it('BUG FIX: sets schemasLoaded=true even when config returns no data', async () => {
    // Before fix: only set inside the `if (config)` block → repeated calls on
    // empty config kept hitting the network every invocation.
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: false });
    let calls = 0;
    const orig = MCPArgumentProcessor.getToolsConfig;
    MCPArgumentProcessor.getToolsConfig = async () => {
      calls++;
      return orig();
    };

    await MCPArgumentProcessor.loadSchemas();
    await MCPArgumentProcessor.loadSchemas(); // second call should be a no-op
    expect(calls).toBe(1); // only called once
    expect(mcpToolSchemaRegistry.isLoaded()).toBe(true);
  });

  it('sets schemasLoaded=true when config object is present but empty', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config: {} });
    await MCPArgumentProcessor.loadSchemas();
    expect(mcpToolSchemaRegistry.isLoaded()).toBe(true);
  });

  it('sets schemasLoaded=true when getToolsConfig returns null config', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true });
    await MCPArgumentProcessor.loadSchemas();
    expect(mcpToolSchemaRegistry.isLoaded()).toBe(true);
  });

  it('caches a failed load attempt to prevent repeated calls and error logs', async () => {
    const getToolsConfig = vi.fn(async () => {
      throw new Error('network');
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    MCPArgumentProcessor.getToolsConfig = getToolsConfig;

    await MCPArgumentProcessor.loadSchemas();
    await MCPArgumentProcessor.loadSchemas();

    expect(mcpToolSchemaRegistry.isLoaded()).toBe(true);
    expect(getToolsConfig).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

// ── getEmptyValueForRequiredField ─────────────────────────────────────────────

describe('MCPArgumentProcessor — getEmptyValueForRequiredField (private)', () => {
  const empty = (schema: SchemaProperty) => privateProcessor.getEmptyValueForRequiredField(schema);

  it('returns {} for object type', () => expect(empty({ type: 'object' })).toEqual({}));
  it('returns [] for array type', () => expect(empty({ type: 'array' })).toEqual([]));
  it('returns "" for string type with no default', () =>
    expect(empty({ type: 'string' })).toBe(''));
  it('uses schema.default for string when provided', () =>
    expect(empty({ type: 'string', default: 'hello' })).toBe('hello'));
  it('returns 0 for number type with no default/minimum', () =>
    expect(empty({ type: 'number' })).toBe(0));
  it('uses schema.default for number', () => expect(empty({ type: 'number', default: 5 })).toBe(5));
  it('uses schema.minimum for number when no default', () =>
    expect(empty({ type: 'number', minimum: 1 })).toBe(1));
  it('returns 0 for integer type', () => expect(empty({ type: 'integer' })).toBe(0));
  it('returns false for boolean type with no default', () =>
    expect(empty({ type: 'boolean' })).toBe(false));
  it('uses schema.default for boolean', () =>
    expect(empty({ type: 'boolean', default: true })).toBe(true));
  it('returns null for unknown type', () => expect(empty({ type: 'custom' })).toBeNull());
});

// ── suggestStringValue ────────────────────────────────────────────────────────

describe('MCPArgumentProcessor — suggestStringValue (private)', () => {
  const suggest = (name: string, desc = '', schema: SchemaProperty = {}) =>
    privateProcessor.suggestStringValue(name, desc, schema);

  it('returns first enum value when enum is present', () =>
    expect(suggest('status', '', { enum: ['active', 'inactive'] })).toBe('active'));
  it('does not use a non-string enum value for a string suggestion', () =>
    expect(suggest('status', '', { enum: [42, 'active'] })).toBeUndefined());
  it('returns "." for path/working-dir', () =>
    expect(suggest('directory', 'current working directory')).toBe('.'));
  it('returns "~" for home directory', () => expect(suggest('dir', 'home directory')).toBe('~'));
  it('returns undefined for path with no matching description', () =>
    expect(suggest('path', 'some path')).toBeUndefined());
  it('returns "" for file-related fields', () => expect(suggest('filename')).toBe(''));
  it('returns "" for name fields', () => expect(suggest('name')).toBe(''));
  it('returns "" for command fields', () => expect(suggest('command')).toBe(''));
  it('returns "" for query fields', () => expect(suggest('query')).toBe(''));
  it('returns "" for search fields', () => expect(suggest('search_term')).toBe(''));
  it('returns undefined for unrecognised field', () => expect(suggest('xyz')).toBeUndefined());
});

// ── suggestNumberValue ────────────────────────────────────────────────────────

describe('MCPArgumentProcessor — suggestNumberValue (private)', () => {
  const suggest = (name: string, schema: SchemaProperty = {}) =>
    privateProcessor.suggestNumberValue(name, '', schema);

  it('uses schema.default when present', () => expect(suggest('count', { default: 42 })).toBe(42));
  it('uses schema.minimum when no default', () => expect(suggest('count', { minimum: 1 })).toBe(1));
  it('returns 8080 for port fields', () => expect(suggest('port')).toBe(8080));
  it('returns 30 for timeout fields', () => expect(suggest('timeout')).toBe(30));
  it('returns 100 for limit fields', () => expect(suggest('max_limit')).toBe(100));
  it('returns 10 for count fields', () => expect(suggest('item_count')).toBe(10));
  it('returns undefined for unrecognised field', () => expect(suggest('xyz')).toBeUndefined());
});

// ── suggestBooleanValue ───────────────────────────────────────────────────────

describe('MCPArgumentProcessor — suggestBooleanValue (private)', () => {
  const suggest = (name: string) => privateProcessor.suggestBooleanValue(name);

  it('returns false for "enabled" fields', () => expect(suggest('enabled')).toBe(false));
  it('returns false for "enable" fields', () => expect(suggest('enable_feature')).toBe(false));
  it('returns false for "disabled" fields', () => expect(suggest('disabled')).toBe(false));
  it('returns false for "recursive" fields', () => expect(suggest('recursive')).toBe(false));
  it('returns false for "force" fields', () => expect(suggest('force')).toBe(false));
  it('returns false for "verbose" fields', () => expect(suggest('verbose')).toBe(false));
  it('returns undefined for unrecognised boolean field', () =>
    expect(suggest('active')).toBeUndefined());
});

// ── suggestArrayValue / suggestObjectValue ────────────────────────────────────

describe('MCPArgumentProcessor — suggestArrayValue / suggestObjectValue', () => {
  it('suggestArrayValue returns []', () =>
    expect(privateProcessor.suggestArrayValue()).toEqual([]));
  it('suggestObjectValue returns {}', () =>
    expect(privateProcessor.suggestObjectValue()).toEqual({}));
});

// ── cleanupArguments ──────────────────────────────────────────────────────────

describe('MCPArgumentProcessor.cleanupArguments', () => {
  it('keeps required fields even with empty values', () => {
    const schema = makeSchema({ req: { type: 'string' } }, ['req']);
    expect(MCPArgumentProcessor.cleanupArguments({ req: '' }, schema)).toHaveProperty('req', '');
  });

  it('removes optional empty-string values', () => {
    const schema = makeSchema({ opt: { type: 'string' } });
    const result = MCPArgumentProcessor.cleanupArguments({ opt: '' }, schema);
    expect(result).not.toHaveProperty('opt');
  });

  it('keeps optional values that are non-empty', () => {
    const schema = makeSchema({ opt: { type: 'string' } });
    expect(MCPArgumentProcessor.cleanupArguments({ opt: 'hello' }, schema)).toHaveProperty(
      'opt',
      'hello'
    );
  });

  it('keeps fields with schema defaults', () => {
    const schema = makeSchema({ opt: { type: 'string', default: 'default_val' } });
    expect(MCPArgumentProcessor.cleanupArguments({ opt: '' }, schema)).toHaveProperty('opt', '');
  });

  it('strips _llmEnhanced metadata', () => {
    const schema = makeSchema({ query: { type: 'string' } }, ['query']);
    const args = { query: 'pods', _llmEnhanced: { enhancedFields: ['query'] } };
    const result = MCPArgumentProcessor.cleanupArguments(args, schema);
    expect(result).not.toHaveProperty('_llmEnhanced');
    expect(result).toHaveProperty('query', 'pods');
  });

  it('returns args unchanged when schema has no inputSchema', () => {
    const schema: MCPToolSchema = { name: 't', description: '' };
    const args = { a: 1 };
    expect(MCPArgumentProcessor.cleanupArguments(args, schema)).toEqual(args);
  });

  it('removes empty arrays from optional fields', () => {
    const schema = makeSchema({ items: { type: 'array' } });
    expect(MCPArgumentProcessor.cleanupArguments({ items: [] }, schema)).not.toHaveProperty(
      'items'
    );
  });

  it('removes empty objects from optional fields', () => {
    const schema = makeSchema({ config: { type: 'object' } });
    expect(MCPArgumentProcessor.cleanupArguments({ config: {} }, schema)).not.toHaveProperty(
      'config'
    );
  });
});

// ── generateIntelligentSuggestions / generatePropertySuggestion ──────────────

describe('MCPArgumentProcessor — generateIntelligentSuggestions', () => {
  beforeEach(() => {
    mcpToolSchemaRegistry.reset();
  });

  it('returns empty suggestions when schema has no properties', () => {
    const schema: MCPToolSchema = { name: 't', description: '' };
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result).toEqual({});
  });

  it('uses k8s namespace from context when property name contains "namespace"', () => {
    const schema = makeSchema({ namespace: { type: 'string' } });
    const ctx = { kubernetesContext: { namespace: 'production', selectedClusters: [] } };
    const result = privateProcessor.generateIntelligentSuggestions(schema, ctx);
    expect(result.namespace).toBe('production');
  });

  it('uses k8s cluster from context when property name contains "cluster"', () => {
    const schema = makeSchema({ cluster: { type: 'string' } });
    const ctx = { kubernetesContext: { selectedClusters: ['cluster-1'], namespace: 'default' } };
    const result = privateProcessor.generateIntelligentSuggestions(schema, ctx);
    expect(result.cluster).toBe('cluster-1');
  });

  it('does not use cluster when selectedClusters is empty', () => {
    const schema = makeSchema({ cluster: { type: 'string' } });
    const ctx = { kubernetesContext: { selectedClusters: [], namespace: 'default' } };
    const result = privateProcessor.generateIntelligentSuggestions(schema, ctx);
    expect(result.cluster).toBeUndefined();
  });

  it('uses lastToolResults when key matches property name', () => {
    const schema = makeSchema({ pod_name: { type: 'string' } });
    const ctx = { lastToolResults: { pod_name: 'nginx-pod' } };
    const result = privateProcessor.generateIntelligentSuggestions(schema, ctx);
    expect(result.pod_name).toBe('nginx-pod');
  });

  it('generates "" suggestion for "query" string property (no context)', () => {
    const schema = makeSchema({ query: { type: 'string' } });
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result.query).toBe('');
  });

  it('generates 8080 suggestion for "port" number property', () => {
    const schema = makeSchema({ port: { type: 'number' } });
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result.port).toBe(8080);
  });

  it('generates false suggestion for "enabled" boolean property', () => {
    const schema = makeSchema({ enabled: { type: 'boolean' } });
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result.enabled).toBe(false);
  });

  it('generates [] for array properties', () => {
    const schema = makeSchema({ items: { type: 'array' } });
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result.items).toEqual([]);
  });

  it('generates {} for object properties', () => {
    const schema = makeSchema({ config: { type: 'object' } });
    const result = privateProcessor.generateIntelligentSuggestions(schema);
    expect(result.config).toEqual({});
  });
});

// ── validateArgumentsWithEmptyObjectSupport ───────────────────────────────────

describe('MCPArgumentProcessor — validateArgumentsWithEmptyObjectSupport (private)', () => {
  const validate = (args: Record<string, unknown>, schema: MCPToolSchema) =>
    privateProcessor.validateArgumentsWithEmptyObjectSupport(args, schema);

  it('returns no errors for valid args', () => {
    const schema = makeSchema({ query: { type: 'string' } }, ['query']);
    expect(validate({ query: 'pods' }, schema)).toHaveLength(0);
  });

  it('reports missing required field', () => {
    const schema = makeSchema({ query: { type: 'string' } }, ['query']);
    const errors = validate({}, schema);
    expect(errors.some((e: string) => e.includes('query'))).toBe(true);
  });

  it('reports type mismatch', () => {
    const schema = makeSchema({ count: { type: 'number' } });
    const errors = validate({ count: 'not-a-number' }, schema);
    expect(errors.some((e: string) => e.includes('count'))).toBe(true);
  });

  it('accepts integral numbers for integer fields', () => {
    const schema = makeSchema({ count: { type: 'integer' } });
    expect(validate({ count: 1 }, schema)).toHaveLength(0);
  });

  it('rejects fractional numbers for integer fields', () => {
    const schema = makeSchema({ count: { type: 'integer' } });
    expect(validate({ count: 1.5 }, schema)).toContain(
      "Field 'count' should be integer, got number"
    );
  });

  it('allows empty object for required object fields (no error)', () => {
    const schema = makeSchema({ opts: { type: 'object' } }, ['opts']);
    expect(validate({ opts: {} }, schema)).toHaveLength(0);
  });

  it('returns no errors when schema has no inputSchema', () => {
    const schema: MCPToolSchema = { name: 't', description: '' };
    expect(validate({}, schema)).toHaveLength(0);
  });

  it('correctly identifies array type vs typeof "object"', () => {
    const schema = makeSchema({ items: { type: 'array' } }, ['items']);
    expect(validate({ items: [1, 2, 3] }, schema)).toHaveLength(0);
  });
});

// ── processArguments — full path ──────────────────────────────────────────────

describe('MCPArgumentProcessor.processArguments — full paths', () => {
  beforeEach(() => {
    mcpToolSchemaRegistry.reset();
  });

  it('processes _llmEnhanced metadata into intelligentFills', async () => {
    resetAndInject({
      srv: {
        tool: {
          inputSchema: {
            properties: { query: { type: 'string' } },
            required: ['query'],
          },
        },
      },
    });
    const args = {
      query: 'show pods',
      _llmEnhanced: { enhancedFields: ['query'] },
    };
    const result = await MCPArgumentProcessor.processArguments('srv__tool', args);
    expect(result.intelligentFills).toHaveProperty('query');
    expect(result.intelligentFills.query.confidence).toBe(0.9);
    expect(result.processed).not.toHaveProperty('_llmEnhanced');
  });

  it('fills missing required string field with empty string', async () => {
    resetAndInject({
      srv: {
        tool: {
          inputSchema: {
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
        },
      },
    });
    const result = await MCPArgumentProcessor.processArguments('srv__tool', {});
    expect(result.processed.name).toBe('');
    expect(result.intelligentFills).toHaveProperty('name');
  });

  it('fills missing required number field with 0', async () => {
    resetAndInject({
      srv: {
        tool: {
          inputSchema: {
            properties: { count: { type: 'number' } },
            required: ['count'],
          },
        },
      },
    });
    const result = await MCPArgumentProcessor.processArguments('srv__tool', {});
    expect(result.processed.count).toBe(0);
  });

  it('does not overwrite existing value for required field', async () => {
    resetAndInject({
      srv: {
        tool: {
          inputSchema: {
            properties: { query: { type: 'string' } },
            required: ['query'],
          },
        },
      },
    });
    const result = await MCPArgumentProcessor.processArguments('srv__tool', { query: 'pods' });
    expect(result.processed.query).toBe('pods');
    expect(result.intelligentFills).not.toHaveProperty('query');
  });

  it('returns schema in the result', async () => {
    resetAndInject({
      srv: { tool: { inputSchema: { properties: {}, required: [] } } },
    });
    const result = await MCPArgumentProcessor.processArguments('srv__tool', {});
    expect(result.schema).not.toBeNull();
    expect(result.schema?.name).toBe('srv__tool');
  });

  it('returns validation error for type mismatch', async () => {
    resetAndInject({
      srv: {
        tool: {
          inputSchema: {
            properties: { count: { type: 'number' } },
            required: ['count'],
          },
        },
      },
    });
    const result = await MCPArgumentProcessor.processArguments('srv__tool', {
      count: 'not-a-number',
    });
    expect(result.errors.some((e: string) => e.includes('count'))).toBe(true);
  });
});

// ── getToolSchema / getAvailableTools ─────────────────────────────────────────

describe('MCPArgumentProcessor.getToolSchema / getAvailableTools', () => {
  beforeEach(() => {
    mcpToolSchemaRegistry.reset();
  });

  it('getToolSchema returns null for unknown tool', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config: {} });
    const schema = await MCPArgumentProcessor.getToolSchema('unknown__tool');
    expect(schema).toBeNull();
  });

  it('getToolSchema loads and returns a known schema', async () => {
    resetAndInject({ srv: { tool: { description: 'My tool', inputSchema: {} } } });
    const schema = await MCPArgumentProcessor.getToolSchema('srv__tool');
    expect(schema?.name).toBe('srv__tool');
    expect(schema?.description).toBe('My tool');
  });

  it('getAvailableTools returns all loaded tool names', async () => {
    resetAndInject({
      srv: {
        tool_a: { inputSchema: {} },
        tool_b: { inputSchema: {} },
      },
    });
    const tools = await MCPArgumentProcessor.getAvailableTools();
    expect(tools).toContain('srv__tool_a');
    expect(tools).toContain('srv__tool_b');
    expect(tools).toHaveLength(2);
  });

  it('getAvailableTools returns [] when no schemas loaded', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config: {} });
    expect(await MCPArgumentProcessor.getAvailableTools()).toHaveLength(0);
  });
});
