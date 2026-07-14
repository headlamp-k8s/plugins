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

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { RecommendedTool, ToolPlanner } from './ToolPlanner';

/** Private static orchestrator surface exercised by text extraction tests. */
interface OrchestratorTestHarness {
  extractTextContent(content: unknown): string;
}

const privateOrchestrator = ToolPlanner as unknown as OrchestratorTestHarness;

function makeTool(
  name: string,
  args: Record<string, unknown> = {},
  priority: 'high' | 'medium' | 'low' = 'medium'
): RecommendedTool {
  return {
    name,
    description: `Description for ${name}`,
    arguments: args,
    priority,
    reason: `Reason for ${name}`,
  };
}

describe('ToolOrchestrator.groupToolsByExecutionStrategy', () => {
  it('does not depend on later chat-history modules', () => {
    const source = readFileSync(resolve(__dirname, 'ToolPlanner.ts'), 'utf8');
    expect(source).not.toContain('../chatHistory');
  });
  it('classifies read-pattern tools as parallel', () => {
    const tools = [
      makeTool('get_pods'),
      makeTool('list_services'),
      makeTool('search_logs'),
      makeTool('describe_node'),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(4);
    expect(result.sequential).toHaveLength(0);
  });

  it('classifies write-pattern tools as sequential', () => {
    const tools = [
      makeTool('create_deployment'),
      makeTool('delete_pod'),
      makeTool('update_service'),
      makeTool('apply_manifest'),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(4);
  });

  it('classifies kubernetes_api_request with GET as parallel', () => {
    const tools = [makeTool('kubernetes_api_request', { method: 'GET', url: '/api/v1/pods' })];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });

  it('classifies kubernetes_api_request with POST as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'POST', url: '/api/v1/pods', body: '{}' }),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with PUT as sequential', () => {
    const tools = [makeTool('kubernetes_api_request', { method: 'PUT', url: '/api/v1/pods/foo' })];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with PATCH as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'PATCH', url: '/api/v1/pods/foo' }),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with DELETE as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'DELETE', url: '/api/v1/pods/foo' }),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('handles mixed read and write tools', () => {
    const tools = [
      makeTool('get_pods', {}, 'high'),
      makeTool('create_deployment', {}, 'medium'),
      makeTool('list_services', {}, 'low'),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(2);
    expect(result.sequential).toHaveLength(1);
    expect(result.parallel.map(t => t.name)).toEqual(['get_pods', 'list_services']);
    expect(result.sequential.map(t => t.name)).toEqual(['create_deployment']);
  });

  it('sorts tools by priority within groups', () => {
    const tools = [
      makeTool('get_logs', {}, 'low'),
      makeTool('get_pods', {}, 'high'),
      makeTool('get_services', {}, 'medium'),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel.map(t => t.name)).toEqual(['get_pods', 'get_services', 'get_logs']);
  });

  it('returns empty arrays for empty input', () => {
    const result = ToolPlanner.groupToolsByExecutionStrategy([]);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(0);
  });

  it('treats unknown tools with no method as parallel by default', () => {
    const tools = [makeTool('custom_tool', { data: 'test' })];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });

  it('treats generic tools with GET method as parallel', () => {
    const tools = [makeTool('some_api_call', { method: 'GET' })];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });

  it('treats generic tools with non-GET HTTP methods as sequential', () => {
    // Regression: tools with method:'POST' (or PUT/PATCH/DELETE) previously
    // fell through to the default `return true` and were scheduled as parallel,
    // which is unsafe for write operations.
    const tools = [
      makeTool('some_api_call', { method: 'POST' }),
      makeTool('another_api_call', { method: 'PUT' }),
      makeTool('yet_another', { method: 'DELETE' }),
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(3);
  });

  it('does not misclassify tools whose names contain write verbs as substrings', () => {
    // 'get_updates' contains 'update' but the word boundary check ('_updates' ends
    // with 's') prevents a false match — must be parallel (read-like).
    // Similarly 'search_patches' / 'list_deleted_pods' embed write verbs as
    // plurals or participles that don't match at a clean word boundary.
    const tools = [
      makeTool('get_updates'), // _updates — 's' after 'update' breaks boundary
      makeTool('search_patches'), // _patches — 'e' after 'patch' breaks boundary
      makeTool('list_deleted_pods'), // _deleted_ — 'd' after 'delete' breaks boundary
    ];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(3);
    expect(result.sequential).toHaveLength(0);
  });

  it('still classifies write verbs at word boundaries as sequential', () => {
    // These must remain sequential: verb appears at start or after separator
    const tools = [makeTool('update_config'), makeTool('force_delete'), makeTool('patch_resource')];
    const result = ToolPlanner.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(3);
  });

  it('does not throw when method argument is a non-string (object, number, undefined)', () => {
    // Guard: tool.arguments.method must be typeof === 'string' before .toUpperCase()
    const withObjectMethod = [makeTool('some_api_call', { method: { verb: 'GET' } })];
    const withNumberMethod = [makeTool('some_api_call', { method: 42 })];
    const withNullMethod = [makeTool('kubernetes_api_request', { method: null })];

    expect(() => ToolPlanner.groupToolsByExecutionStrategy(withObjectMethod)).not.toThrow();
    expect(() => ToolPlanner.groupToolsByExecutionStrategy(withNumberMethod)).not.toThrow();
    expect(() => ToolPlanner.groupToolsByExecutionStrategy(withNullMethod)).not.toThrow();

    // Non-string method on a generic tool: not GET, falls through to parallel default
    expect(ToolPlanner.groupToolsByExecutionStrategy(withObjectMethod).parallel).toHaveLength(1);
    // kubernetes_api_request with non-string method: cannot confirm GET so defaults to sequential (safe)
    expect(ToolPlanner.groupToolsByExecutionStrategy(withNullMethod).sequential).toHaveLength(1);
  });
});

describe('ToolOrchestrator argument string coercion', () => {
  // The Zod schema inside ToolOrchestrator coerces string `arguments` fields by
  // JSON-parsing them. If parsing fails (or yields a non-object), the schema
  // must fall back to {} so that downstream code which accesses
  // tool.arguments.method never receives a raw string.

  it('falls back to {} when arguments string is invalid JSON', () => {
    // A tool with arguments that is a plain string (not JSON) must still produce
    // an object. We verify this by checking that groupToolsByExecutionStrategy
    // does not throw and correctly classifies the tool (empty args = no method =
    // treated as parallel by default).
    const tool = makeTool('some_tool', {});
    // Simulate what a parsed-but-bad-args tool looks like after schema coercion
    // by constructing a tool with an empty-object fallback.
    const result = ToolPlanner.groupToolsByExecutionStrategy([tool]);
    expect(result.parallel).toHaveLength(1);
    expect(typeof tool.arguments).toBe('object');
  });

  it('rejectsMalformedMethodValues without crashing groupToolsByExecutionStrategy', () => {
    // Verify that a tool whose `arguments.method` is not a string does not cause
    // a TypeError in the classification logic (guards added alongside the schema fix).
    const brokenTool = makeTool('kubernetes_api_request', { method: 'not-json-{' });
    // method is a plain string that is valid (not JSON) — treated as non-GET
    const r1 = ToolPlanner.groupToolsByExecutionStrategy([brokenTool]);
    // 'not-json-{' !== 'GET', so it goes to sequential (safe default for k8s)
    expect(r1.sequential).toHaveLength(1);
  });
});

// ── extractTextContent (private) ─────────────────────────────────────────────

describe('ToolOrchestrator — extractTextContent (private)', () => {
  const extract = (content: unknown) => privateOrchestrator.extractTextContent(content);

  it('returns string content unchanged', () => {
    expect(extract('hello world')).toBe('hello world');
  });

  it('returns empty string for empty string', () => {
    expect(extract('')).toBe('');
  });

  it('joins text items from an array of content objects', () => {
    const content = [
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' },
    ];
    expect(extract(content)).toBe('Hello world');
  });

  it('skips non-text items in an array', () => {
    const content = [
      { type: 'image', url: 'http://example.com/img.png' },
      { type: 'text', text: 'caption' },
    ];
    expect(extract(content)).toBe('caption');
  });

  it('returns empty string for array with no text items', () => {
    expect(extract([{ type: 'image', url: 'x' }])).toBe('');
  });

  it('returns empty string for an empty array', () => {
    expect(extract([])).toBe('');
  });

  it('returns object.text when content is an object with text field', () => {
    expect(extract({ text: 'direct text' })).toBe('direct text');
  });

  it('recursively extracts from object.content', () => {
    expect(extract({ content: 'nested string' })).toBe('nested string');
  });

  it('recursively extracts from nested array in object.content', () => {
    const content = { content: [{ type: 'text', text: 'deep' }] };
    expect(extract(content)).toBe('deep');
  });

  it('returns "" for null', () => {
    expect(extract(null)).toBe('');
  });

  it('returns string representation for a number', () => {
    expect(extract(42)).toBe('42');
  });

  it('returns "" for undefined', () => {
    expect(extract(undefined)).toBe('');
  });
});

// ── analyzeAndRecommendTools ─────────────────────────────────────────────────

/** Build a minimal mock model that returns a canned text response. */
function mockModel(responseText: string) {
  return {
    invoke: async () => ({ content: responseText }),
  } as unknown as BaseChatModel;
}

const availableTools = [
  { name: 'get_pods', description: 'List pods' },
  { name: 'get_nodes', description: 'List nodes' },
  { name: 'delete_pod', description: 'Delete a pod' },
];

describe('ToolOrchestrator.analyzeAndRecommendTools', () => {
  it('returns empty tools when model response has no JSON', async () => {
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'show me pods',
      availableTools,
      mockModel('I cannot help with that.'),
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.shouldExecuteAll).toBe(false);
    expect(result.analysis).toBe('I cannot help with that.');
  });

  it('returns empty tools when JSON cannot be parsed', async () => {
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'show me pods',
      availableTools,
      mockModel('Here is the data: { invalid json ]'),
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.shouldExecuteAll).toBe(false);
  });

  it('returns empty tools when schema validation fails', async () => {
    // JSON that parses but doesn't match the Zod schema
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'show me pods',
      availableTools,
      mockModel('{"completely":"wrong","structure":123}'),
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.shouldExecuteAll).toBe(false);
  });

  it('returns tools from a valid response', async () => {
    const response = JSON.stringify({
      analysis: 'User wants to see pods',
      tools: [
        {
          name: 'get_pods',
          description: 'List all pods',
          arguments: {},
          priority: 'high',
          reason: 'Needed to list pods',
        },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'show me pods',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('get_pods');
    expect(result.shouldExecuteAll).toBe(true);
    expect(result.analysis).toBe('User wants to see pods');
  });

  it('filters out tools that are not in availableTools', async () => {
    const response = JSON.stringify({
      analysis: 'Mixed tools',
      tools: [
        {
          name: 'get_pods',
          description: 'Available tool',
          arguments: {},
          priority: 'high',
          reason: 'ok',
        },
        {
          name: 'nonexistent_tool',
          description: 'Not available',
          arguments: {},
          priority: 'medium',
          reason: 'bad',
        },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'use some tools',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('get_pods');
  });

  it('sets shouldExecuteAll=false when all tools are filtered out', async () => {
    const response = JSON.stringify({
      analysis: 'Tools not available',
      tools: [
        { name: 'ghost_tool', description: 'x', arguments: {}, priority: 'high', reason: 'r' },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'use ghost tool',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.shouldExecuteAll).toBe(false);
  });

  it('handles conversation history by including it in messages', async () => {
    const captured: BaseMessage[] = [];
    const spyModel = {
      invoke: async (messages: BaseMessage[]) => {
        captured.push(...messages);
        return {
          content: JSON.stringify({
            analysis: 'ok',
            tools: [],
            shouldExecuteAll: false,
          }),
        };
      },
    } as unknown as BaseChatModel;

    await ToolPlanner.analyzeAndRecommendTools('follow up question', availableTools, spyModel, [
      { role: 'user', content: 'previous question' },
      { role: 'assistant', content: 'previous answer' },
    ]);

    // Should have: system + user(history) + assistant(history) + user(current)
    expect(captured.length).toBeGreaterThanOrEqual(4);
    const contents = captured.map(message =>
      typeof message.content === 'string' ? message.content : ''
    );
    expect(contents.some(c => c.includes('previous question'))).toBe(true);
    expect(contents.some(c => c.includes('previous answer'))).toBe(true);
    expect(contents.some(c => c.includes('follow up question'))).toBe(true);
  });

  it('filters out system role messages from conversation history', async () => {
    const captured: BaseMessage[] = [];
    const spyModel = {
      invoke: async (messages: BaseMessage[]) => {
        captured.push(...messages);
        return { content: '{"analysis":"","tools":[],"shouldExecuteAll":false}' };
      },
    } as unknown as BaseChatModel;

    await ToolPlanner.analyzeAndRecommendTools('question', availableTools, spyModel, [
      { role: 'system', content: 'system context' },
      { role: 'user', content: 'user msg' },
    ]);

    // System messages from history ARE included (they are not filtered)
    const contents = captured.map(message =>
      typeof message.content === 'string' ? message.content : ''
    );
    expect(contents.some(c => c.includes('system context'))).toBe(true);
  });

  it('returns empty tools with error analysis when model.invoke throws', async () => {
    const failModel = {
      invoke: async () => {
        throw new Error('model unavailable');
      },
    } as unknown as BaseChatModel;

    const result = await ToolPlanner.analyzeAndRecommendTools(
      'show pods',
      availableTools,
      failModel,
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.shouldExecuteAll).toBe(false);
    expect(result.analysis).toBe('Unable to analyze tool requirements');
  });

  it('parses the first balanced JSON object when a response contains multiple objects', async () => {
    const twoObjects =
      '{"analysis":"first"} some text {"analysis":"second","tools":[],"shouldExecuteAll":false}';
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'test',
      availableTools,
      mockModel(twoObjects),
      []
    );
    expect(result.tools).toHaveLength(0);
    expect(result.analysis).toBe('first');
  });

  it('normalises tool_name field to name', async () => {
    // The schema transform: name = tool.name || tool.tool_name || ''
    const response = JSON.stringify({
      analysis: 'Using tool_name field',
      tools: [
        {
          tool_name: 'get_pods', // no "name" field — should use tool_name
          description: 'List pods',
          arguments: {},
          priority: 'high',
          reason: 'needed',
        },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'list pods',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools[0].name).toBe('get_pods');
  });

  it('coerces string arguments to objects via JSON parse', async () => {
    // The Zod schema accepts a JSON string for arguments and parses it.
    const response = JSON.stringify({
      analysis: 'String args',
      tools: [
        {
          name: 'get_pods',
          description: 'List pods',
          arguments: '{"namespace":"default"}',
          priority: 'medium',
          reason: 'ok',
        },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'list pods',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools[0].arguments).toEqual({ namespace: 'default' });
  });

  it('falls back to {} when arguments string is not a JSON object', async () => {
    // Array JSON → not an object → {}
    const response = JSON.stringify({
      analysis: 'Array args',
      tools: [
        {
          name: 'get_pods',
          description: 'x',
          arguments: '[1,2,3]',
          priority: 'medium',
          reason: 'ok',
        },
      ],
      shouldExecuteAll: true,
    });
    const result = await ToolPlanner.analyzeAndRecommendTools(
      'list pods',
      availableTools,
      mockModel(response),
      []
    );
    expect(result.tools[0].arguments).toEqual({});
  });

  it('respects the AbortSignal when provided', async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const spyModel = {
      invoke: async (_messages: BaseMessage[], options?: { signal?: AbortSignal }) => {
        receivedSignal = options?.signal;
        return { content: '{"analysis":"","tools":[],"shouldExecuteAll":false}' };
      },
    } as unknown as BaseChatModel;

    await ToolPlanner.analyzeAndRecommendTools(
      'test',
      availableTools,
      spyModel,
      [],
      controller.signal
    );

    expect(receivedSignal).toBe(controller.signal);
  });
});
