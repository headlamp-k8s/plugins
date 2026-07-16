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

import { describe, expect, it } from 'vitest';
import { createArgumentPreparationPrompt, getIntelligentDefault } from './buildToolArgumentPrompt';

const mockUserContext = {
  userMessage: 'show pods in default namespace',
  conversationHistory: [{ role: 'user', content: 'show pods in default namespace' }],
  lastToolResults: {},
  timeContext: new Date(),
};

// ---------------------------------------------------------------------------
// createArgumentPreparationPrompt
// ---------------------------------------------------------------------------
describe('createArgumentPreparationPrompt', () => {
  const schema = {
    inputSchema: {
      required: ['namespace'],
      properties: {
        namespace: { type: 'string', description: 'Target namespace' },
        limit: { type: 'number', description: 'Max results' },
      },
    },
  };

  it('returns an object with system and user string properties', () => {
    const { system, user } = createArgumentPreparationPrompt(
      'list_pods',
      schema,
      mockUserContext,
      {}
    );
    expect(typeof system).toBe('string');
    expect(typeof user).toBe('string');
  });

  it('embeds the tool name in the system prompt', () => {
    const { system } = createArgumentPreparationPrompt('list_pods', schema, mockUserContext, {});
    expect(system).toContain('list_pods');
  });

  it('marks required fields as REQUIRED in the schema description', () => {
    const { system } = createArgumentPreparationPrompt('list_pods', schema, mockUserContext, {});
    expect(system).toContain('namespace (REQUIRED)');
    expect(system).toContain('limit (optional)');
  });

  it('includes original args in the user prompt', () => {
    const { user } = createArgumentPreparationPrompt('list_pods', schema, mockUserContext, {
      namespace: 'kube-system',
    });
    expect(user).toContain('kube-system');
  });

  it('includes the user message in the user prompt', () => {
    const { user } = createArgumentPreparationPrompt('list_pods', schema, mockUserContext, {});
    expect(user).toContain(mockUserContext.userMessage);
  });

  it('schema types without a type field (e.g. $ref) show "object" not "any"', () => {
    // When fieldSchema has no `type` property (e.g. uses $ref or oneOf),
    // the description shows "any" which may mislead the LLM.
    const schemaWithRef = {
      inputSchema: {
        required: [],
        properties: {
          filter: { $ref: '#/$defs/FilterType', description: 'A filter object' },
        },
      },
    };
    const { system } = createArgumentPreparationPrompt(
      'my_tool',
      schemaWithRef,
      mockUserContext,
      {}
    );
    // Fixed: shows 'object' for $ref/oneOf fields instead of misleading 'any'
    expect(system).toContain('filter (optional) (object)');
    expect(system).not.toContain('(any)');
  });

  it('handles empty schema gracefully', () => {
    expect(() => createArgumentPreparationPrompt('t', {}, mockUserContext, {})).not.toThrow();
  });

  it('renders nested properties one level deep', () => {
    const nestedSchema = {
      inputSchema: {
        required: [],
        properties: {
          metadata: {
            type: 'object',
            description: 'Resource metadata',
            properties: {
              name: { type: 'string', description: 'Resource name' },
              labels: { type: 'object', description: 'Key-value labels' },
            },
          },
        },
      },
    };
    const { system } = createArgumentPreparationPrompt(
      'create_resource',
      nestedSchema,
      mockUserContext,
      {}
    );
    expect(system).toContain('Nested properties:');
    expect(system).toContain('name (string): Resource name');
    expect(system).toContain('labels (object): Key-value labels');
  });

  it('renders nested properties with unknown type as "any"', () => {
    const nestedSchema = {
      inputSchema: {
        required: [],
        properties: {
          config: {
            type: 'object',
            description: 'Config object',
            properties: {
              value: { description: 'Some value' }, // no type
            },
          },
        },
      },
    };
    const { system } = createArgumentPreparationPrompt(
      'set_config',
      nestedSchema,
      mockUserContext,
      {}
    );
    expect(system).toContain('value (any): Some value');
  });

  it('includes conversation history in the user prompt', () => {
    const ctx = {
      ...mockUserContext,
      conversationHistory: [
        { role: 'user', content: 'first message' },
        { role: 'assistant', content: 'first reply' },
      ],
    };
    const { user } = createArgumentPreparationPrompt('list_pods', schema, ctx, {});
    expect(user).toContain('first message');
    expect(user).toContain('first reply');
  });

  it('handles missing conversationHistory gracefully', () => {
    const ctx = { ...mockUserContext, conversationHistory: undefined };
    expect(() => createArgumentPreparationPrompt('list_pods', schema, ctx, {})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getIntelligentDefault
// ---------------------------------------------------------------------------
describe('getIntelligentDefault', () => {
  it('returns {} for object type', () => {
    expect(getIntelligentDefault('params', { type: 'object' }, mockUserContext)).toEqual({});
  });

  it('returns [] for array type', () => {
    expect(getIntelligentDefault('items', { type: 'array' }, mockUserContext)).toEqual([]);
  });

  it('returns false for boolean type with no default', () => {
    expect(getIntelligentDefault('flag', { type: 'boolean' }, mockUserContext)).toBe(false);
  });

  it('returns schema default when present', () => {
    expect(getIntelligentDefault('flag', { type: 'boolean', default: true }, mockUserContext)).toBe(
      true
    );
  });

  it('extracts namespace from user message', () => {
    const ctx = { ...mockUserContext, userMessage: 'show pods namespace: kube-system' };
    expect(getIntelligentDefault('namespace', { type: 'string' }, ctx)).toBe('kube-system');
  });

  it('returns "default" as namespace fallback when not in message', () => {
    const ctx = { ...mockUserContext, userMessage: 'show me all pods' };
    expect(getIntelligentDefault('namespace', { type: 'string' }, ctx)).toBe('default');
  });

  it('Bug: enum[0] is undefined when enum array is empty — returns undefined not ""', () => {
    // An empty enum array causes getIntelligentDefault to return undefined.
    // Callers that expect a string get a falsy value that may be sent as-is.
    const result = getIntelligentDefault('status', { type: 'string', enum: [] }, mockUserContext);
    // Fixed version uses enum?.length check — returns '' instead of undefined
    expect(result).toBe('');
  });

  it('Bug fix: negative minimum is preserved (was broken with || operator)', () => {
    // With the old `fieldSchema.default || fieldSchema.minimum || 0`:
    //   minimum=-100 → `undefined || -100 || 0` = -100 ✓ (accidentally correct)
    //   minimum=0    → `undefined || 0 || 0` = 0 ✓ (accidentally correct)
    // But:
    //   default=0, minimum=-100 → `0 || -100 || 0` = -100 ✗ (default lost!)
    // Fixed: uses ?? so 0 default is preserved.
    const result = getIntelligentDefault(
      'offset',
      { type: 'number', default: 0, minimum: -100 },
      mockUserContext
    );
    expect(result).toBe(0); // default=0 should win over minimum
  });

  it('returns null for unknown type', () => {
    expect(getIntelligentDefault('x', { type: 'unknown' }, mockUserContext)).toBeNull();
  });

  // ── container / pod extraction ────────────────────────────────────────────

  it('extracts container name from user message for container fields', () => {
    const ctx = { ...mockUserContext, userMessage: 'run in container: nginx' };
    const result = getIntelligentDefault('containerName', { type: 'string' }, ctx);
    expect(result).toBe('nginx');
  });

  it('extracts pod name from user message for pod fields', () => {
    const ctx = { ...mockUserContext, userMessage: 'inspect pod: my-pod-abc' };
    const result = getIntelligentDefault('podName', { type: 'string' }, ctx);
    expect(result).toBe('my-pod-abc');
  });

  it('returns undefined (no match) for container field when pattern not found', () => {
    const ctx = { ...mockUserContext, userMessage: 'show me some resources' };
    const result = getIntelligentDefault('containerName', { type: 'string' }, ctx);
    // Pattern not found → falls through to switch → string default
    expect(result).toBe('');
  });

  // ── command / cmd extraction ──────────────────────────────────────────────

  it('extracts command from user message for command fields', () => {
    const ctx = { ...mockUserContext, userMessage: 'execute "ls -la" in the pod' };
    const result = getIntelligentDefault('command', { type: 'string' }, ctx);
    expect(result).toBe('ls -la');
  });

  it('extracts cmd using single quotes', () => {
    const ctx = { ...mockUserContext, userMessage: "run 'ps aux' in container" };
    const result = getIntelligentDefault('cmd', { type: 'string' }, ctx);
    expect(result).toBe('ps aux');
  });

  it('returns empty string for cmd field when pattern not found', () => {
    const ctx = { ...mockUserContext, userMessage: 'just debug the pod' };
    const result = getIntelligentDefault('command', { type: 'string' }, ctx);
    expect(result).toBe('');
  });

  // ── string enum / default ─────────────────────────────────────────────────

  it('returns first enum value for string type with non-empty enum', () => {
    const result = getIntelligentDefault(
      'status',
      { type: 'string', enum: ['Running', 'Pending', 'Failed'] },
      mockUserContext
    );
    expect(result).toBe('Running');
  });

  it('returns schema default for string with no enum', () => {
    const result = getIntelligentDefault(
      'format',
      { type: 'string', default: 'json' },
      mockUserContext
    );
    expect(result).toBe('json');
  });

  it('returns empty string for string with no enum and no default', () => {
    const result = getIntelligentDefault('label', { type: 'string' }, mockUserContext);
    expect(result).toBe('');
  });

  // ── number / integer ──────────────────────────────────────────────────────

  it('returns minimum when no default is set for number type', () => {
    const result = getIntelligentDefault(
      'port',
      { type: 'number', minimum: 1024 },
      mockUserContext
    );
    expect(result).toBe(1024);
  });

  it('returns minimum when no default is set for integer type', () => {
    const result = getIntelligentDefault(
      'replicas',
      { type: 'integer', minimum: 1 },
      mockUserContext
    );
    expect(result).toBe(1);
  });

  it('returns 0 when neither default nor minimum is set for number type', () => {
    const result = getIntelligentDefault('count', { type: 'number' }, mockUserContext);
    expect(result).toBe(0);
  });

  it('preserves default=0 even when minimum is also set (fixed ?? bug)', () => {
    const result = getIntelligentDefault(
      'offset',
      { type: 'integer', default: 0, minimum: -100 },
      mockUserContext
    );
    expect(result).toBe(0);
  });

  // ── no userMessage ────────────────────────────────────────────────────────

  it('returns empty string for namespace field when userMessage is empty (no userMessage guard skips to switch)', () => {
    const ctx = { ...mockUserContext, userMessage: '' };
    const result = getIntelligentDefault('namespace', { type: 'string' }, ctx);
    // userMessage is falsy → if(userMessage) block skipped → switch returns default ?? ''
    expect(result).toBe('');
  });

  it('falls through to switch branches when userMessage is absent', () => {
    const ctx = { ...mockUserContext, userMessage: undefined };
    const result = getIntelligentDefault('count', { type: 'number' }, ctx);
    expect(result).toBe(0);
  });
});

// =============================================================================
// Bug regression: ?? vs || for description fields
// =============================================================================

describe('createArgumentPreparationPrompt — description fallback', () => {
  it('BUG (fixed): empty string field description falls back to "No description" (|| not ??)', () => {
    const schemaWithEmptyDesc = {
      inputSchema: {
        required: [],
        properties: {
          ns: { type: 'string', description: '' },
        },
      },
    };
    const { system } = createArgumentPreparationPrompt(
      'my_tool',
      schemaWithEmptyDesc,
      mockUserContext,
      {}
    );
    expect(system).toContain('No description');
    expect(system).not.toMatch(/ns \(optional\) \(string\): \n/);
  });

  it('BUG (fixed): empty nested property description falls back to "No description"', () => {
    const schemaWithNestedEmptyDesc = {
      inputSchema: {
        required: [],
        properties: {
          config: {
            type: 'object',
            description: 'Config',
            properties: {
              value: { type: 'string', description: '' },
            },
          },
        },
      },
    };
    const { system } = createArgumentPreparationPrompt(
      't',
      schemaWithNestedEmptyDesc,
      mockUserContext,
      {}
    );
    expect(system).toContain('value (string): No description');
  });

  it('non-empty description is shown as-is', () => {
    const s = {
      inputSchema: {
        required: [],
        properties: { ns: { type: 'string', description: 'Target namespace' } },
      },
    };
    const { system } = createArgumentPreparationPrompt('t', s, mockUserContext, {});
    expect(system).toContain('Target namespace');
  });
});
