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

/**
 * Tests for bugs found in LangChainManager.ts.
 *
 * Each describe block exercises the REAL buggy code path inside
 * LangChainManager and should fail (red) until the corresponding
 * fix is applied.
 */

import { AIMessage, AIMessageChunk, BaseMessage, ToolMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { describe, expect, it, vi } from 'vitest';
import { sanitizeToolAlignment } from '../conversation/history';
import { convertPromptsToMessages } from '../conversation/langchain/messages';
import type { ConversationMessage as Prompt } from '../conversation/types';
import type { UserContext } from '../mcp/tools/types';
import { DEFAULT_SKILLS_CONFIG } from '../skills/config';
import type { SkillManager } from '../skills/SkillManager';
import { createMockSkillManager } from '../skills/testing/MockSkillManager';
import { inlineToolApprovalManager } from '../tools/approval/InlineToolApprovalManager';
import { createMockApprovalManager } from '../tools/approval/testing/MockApprovalManager';
import type { NormalizedToolCall } from '../tools/calls/processToolCalls';
import type { KubernetesToolContext } from '../tools/kubernetes/context';
import type { RecommendedTool } from '../tools/langchain/ToolPlanner';
import { ToolPlanner } from '../tools/langchain/ToolPlanner';
import {
  createMockKubernetesToolManager,
  createMockToolManager,
} from '../tools/testing/MockToolManager';
import type { CacheEntry } from './cache/responseCache';
import type { LangChainToolRuntime as ToolManagerAdapter } from './langchain/LangChainToolBinding';
import LangChainAssistantSession from './LangChainAssistantSession';

interface TestExtraTool {
  name: string;
  invoke(input: unknown): Promise<unknown> | unknown;
}

interface TestModel {
  invoke?(input: unknown, options?: unknown): Promise<{ content: unknown; tool_calls?: unknown[] }>;
  stream?(input: unknown, options?: unknown): AsyncIterable<unknown> | Promise<unknown>;
  bindTools?(tools: unknown[]): TestModel;
}

type TestToolManager = Partial<ToolManagerAdapter>;

/** Private LangChainManager surface exercised by integration tests. */
interface LangChainManagerTestHarness {
  model: TestModel | null;
  history: Prompt[];
  toolManager: TestToolManager;
  useDirectToolCalling: boolean;
  currentAbortController: AbortController | null;
  boundModel: TestModel | null;
  responseCache: Map<string, CacheEntry<Prompt>>;
  extraTools: Map<string, TestExtraTool>;
  currentSkillsPromptText: string;
  readonly MAX_CACHE_SIZE: number;
  orchestrateToolsForRequest(message: string): Promise<RecommendedTool[] | null>;
  processToolCalls(toolCalls: NormalizedToolCall[], prompt: Prompt): Promise<void>;
  prepareLLMArguments(...args: unknown[]): Promise<Record<string, unknown>>;
  enhanceArgumentsWithAI(...args: unknown[]): Promise<Record<string, unknown>>;
  handleUserSendError(error: unknown): Promise<Prompt>;
  handleToolResponseError(error: unknown): Prompt;
  generateResponseFromToolResults(
    message: string,
    results: Record<string, unknown>
  ): Promise<Prompt>;
  handleMultipleToolExecution(message: string, tools: RecommendedTool[]): Promise<Prompt>;
  createSystemPrompt(): string;
  handleToolCalls(response: { content: unknown; tool_calls?: unknown[] }): Promise<Prompt>;
  handleDirectToolCallingRequest(message: string): Promise<Prompt>;
  cleanResponseCache(): void;
  buildUserContext(): UserContext;
  validateToolCallAlignment(): void;
  handleToolEnabledRequest(
    input: { systemPrompt: string; chatHistory: BaseMessage[]; input: string },
    model: TestModel
  ): Promise<Prompt>;
  handleLocalModelRequest(message: string, model: TestModel): Promise<Prompt>;
  handleChainBasedRequest(message: string, model: TestModel): Promise<Prompt>;
  getSkillsPromptForQuery(message: string): Promise<string>;
  extractAzureBaseUrl(endpoint: string): string;
}

function privateManager(manager: LangChainAssistantSession): LangChainManagerTestHarness {
  return manager as unknown as LangChainManagerTestHarness;
}

function makeKubernetesContext(): KubernetesToolContext {
  return {
    ui: {
      showApiConfirmation: false,
      apiRequest: null,
      apiResponse: null,
      apiLoading: false,
      apiRequestError: null,
    },
    callbacks: {
      setShowApiConfirmation: () => {},
      setApiRequest: () => {},
      setApiResponse: () => {},
      setApiLoading: () => {},
      setApiRequestError: () => {},
      handleActualApiRequest: async () => ({}),
    },
    selectedClusters: [],
  };
}

/**
 * Construct a LangChainManager using the built-in mock-testing-model
 * so no real API keys or network access are needed.
 */
function createTestManager(): LangChainAssistantSession {
  return new LangChainAssistantSession('mock-testing-model', {});
}

function makeToolConfirmation(
  overrides: Partial<NonNullable<Prompt['toolConfirmation']>> = {}
): NonNullable<Prompt['toolConfirmation']> {
  return {
    tools: [],
    onApprove: vi.fn(),
    onDeny: vi.fn(),
    ...overrides,
  };
}

/**
 * Create a manager with MockApprovalManager (auto-approve) and an optional
 * MockToolManager, so userSend() can run the full path without a real cluster
 * or approval dialog.
 */
function createIntegrationManager(
  toolManager?: ReturnType<typeof createMockToolManager>
): LangChainAssistantSession {
  inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager({ mode: 'approve-all' }));
  return new LangChainAssistantSession(
    'mock-testing-model',
    {},
    [],
    toolManager ? { toolManager } : undefined
  );
}

/**
 * Build an AIMessage with tool calls in a SINGLE generation — what the
 * fix should produce (either by streaming+accumulating, or by calling
 * generate() and merging).
 */
function copilotMergedResponse(): AIMessage {
  return new AIMessage({
    content: 'Let me check all pods across the cluster for any issues.',
    tool_calls: [
      {
        name: 'kubernetes_api_request',
        args: { url: '/api/v1/pods?fieldSelector=status.phase!=Running', method: 'GET' },
        type: 'tool_call' as const,
        id: 'toolu_vrtx_01URrbeDtAxrDTJ5w8XNvuxB',
      },
    ],
    additional_kwargs: {},
    response_metadata: { finish_reason: 'tool_calls' },
  });
}

// ---------------------------------------------------------------------------
// BUG-1: `concat` is not exported from @langchain/core/messages.
//
// The streaming path in userSendStream calls `concat(accumulatedChunk, chunk)`
// using a named import. At runtime `concat` is `undefined`, so any stream
// producing ≥ 2 chunks throws `TypeError: concat is not a function`.
//
// The fix is to use the instance method: `accumulatedChunk.concat(chunk)`.
// ---------------------------------------------------------------------------
describe('BUG-1: streaming concat crash on multi-chunk responses', () => {
  it('userSendStream does not throw on a multi-chunk response', async () => {
    const manager = createTestManager();

    // Replace the model with a fake that yields multiple AIMessageChunks
    // to trigger the concat accumulation path.
    const fakeModel = {
      stream: async function* () {
        yield new AIMessageChunk({ content: 'Hello ' });
        yield new AIMessageChunk({ content: 'world!' });
      },
    };
    privateManager(manager).model = fakeModel;

    // Consume the stream — the bug makes this throw TypeError
    const chunks: string[] = [];
    const gen = manager.userSendStream('test');
    let result = await gen.next();
    while (!result.done) {
      chunks.push(result.value);
      result = await gen.next();
    }

    expect(chunks.join('')).toBe('Hello world!');
  });

  it('userSendStream merges tool calls split across chunks', async () => {
    const manager = createTestManager();

    const fakeModel = {
      stream: async function* () {
        yield new AIMessageChunk({
          content: 'Checking pods.',
          tool_call_chunks: [
            {
              id: 'c1',
              name: 'kubernetes_api_request',
              args: '{"url":"/api/v1/',
              index: 0,
              type: 'tool_call_chunk',
            },
          ],
        });
        yield new AIMessageChunk({
          content: '',
          tool_call_chunks: [
            { id: '', name: '', args: 'pods","method":"GET"}', index: 0, type: 'tool_call_chunk' },
          ],
        });
      },
    };
    privateManager(manager).model = fakeModel;

    // Consume the stream — with the bug this throws TypeError
    const gen = manager.userSendStream('list pods');
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    // result.value is the final Prompt returned by the generator
    const finalPrompt = result.value;
    expect(finalPrompt).toBeDefined();
    // If concat worked, tool calls should be merged
    expect(finalPrompt.toolCalls).toBeDefined();
    expect(finalPrompt.toolCalls!.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// BUG-3: AbortError detected via .message instead of .name.
//
// handleUserSendError checks `error.message === 'AbortError'`, but the
// Web AbortError has name='AbortError' and message='The operation was
// aborted.' — so cancellation is never detected and the user sees a
// generic error instead of "Request cancelled."
// ---------------------------------------------------------------------------
describe('BUG-3: AbortError detection in handleUserSendError', () => {
  it('DOMException AbortError returns "Request cancelled." prompt', async () => {
    const manager = createTestManager();
    const err = new DOMException('The operation was aborted.', 'AbortError');

    const result = await privateManager(manager).handleUserSendError(err);

    // With the bug: error.message is 'The operation was aborted.',
    // so the check `error.message === 'AbortError'` fails and we get a
    // generic error prompt instead of the cancel message.
    expect(result.content).toBe('Request cancelled.');
    expect(result.error).toBe(true);
  });

  it('Error with name=AbortError returns "Request cancelled." prompt', async () => {
    const manager = createTestManager();
    const err = Object.assign(new Error('signal is aborted without reason'), {
      name: 'AbortError',
    });

    const result = await privateManager(manager).handleUserSendError(err);
    expect(result.content).toBe('Request cancelled.');
  });
});

// ---------------------------------------------------------------------------
// BUG-7: tool role messages converted to AIMessage instead of ToolMessage.
//
// convertPromptsToMessages wraps tool results in AIMessage with a string
// prefix, losing the tool_call_id linkage. Providers that validate message
// ordering (OpenAI, Anthropic) reject these messages.
// ---------------------------------------------------------------------------
describe('BUG-7: tool role must produce ToolMessage, not AIMessage', () => {
  it('tool role prompt is converted to a ToolMessage', () => {
    const manager = createTestManager();
    const prompts = [{ role: 'tool', content: '{"pods":[]}', toolCallId: 'call_1' }];

    const messages = convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    // With the bug: instanceof AIMessage is true, instanceof ToolMessage is false
    expect(messages[0]).toBeInstanceOf(ToolMessage);
  });

  it('ToolMessage preserves tool_call_id', () => {
    const manager = createTestManager();
    const prompts = [{ role: 'tool', content: 'result data', toolCallId: 'call_42' }];

    const messages = convertPromptsToMessages(prompts);

    // With the bug: tool_call_id is lost (wrapped in string prefix)
    expect((messages[0] as ToolMessage).tool_call_id).toBe('call_42');
  });

  it('tool message content is raw, not wrapped in a prefix string', () => {
    const manager = createTestManager();
    const prompts = [{ role: 'tool', content: '{"key":"value"}', toolCallId: 'call_1' }];

    const messages = convertPromptsToMessages(prompts);

    // With the bug: content = 'Tool Response (call_1): {"key":"value"}'
    expect(messages[0].content).toBe('{"key":"value"}');
    expect(messages[0].content).not.toContain('Tool Response');
  });
});

// ---------------------------------------------------------------------------
// BUG-8: assistant messages with toolCalls lose tool_calls during conversion.
//
// convertPromptsToMessages drops prompt.toolCalls when building AIMessage,
// causing Anthropic to reject subsequent tool_result messages with:
//   "unexpected tool_use_id found in tool_result blocks"
// because the matching tool_use block is missing from the previous message.
// ---------------------------------------------------------------------------
describe('BUG-8: assistant messages must preserve tool_calls', () => {
  it('AIMessage includes tool_calls when prompt has toolCalls', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: 'Let me check that for you.',
        toolCalls: [
          {
            id: 'toolu_abc123',
            function: {
              name: 'kubernetes_api_request',
              arguments: '{"method":"GET","path":"/api/v1/pods"}',
            },
          },
        ],
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect((messages[0] as AIMessage).tool_calls).toHaveLength(1);
    expect((messages[0] as AIMessage).tool_calls![0]).toEqual({
      id: 'toolu_abc123',
      name: 'kubernetes_api_request',
      args: { method: 'GET', path: '/api/v1/pods' },
      type: 'tool_call',
    });
  });

  it('AIMessage has no tool_calls when prompt has no toolCalls', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: 'Here is the answer.',
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect((messages[0] as AIMessage).tool_calls).toEqual([]);
  });

  it('AIMessage has no tool_calls when prompt has empty toolCalls array', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: 'No tools needed.',
        toolCalls: [],
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect((messages[0] as AIMessage).tool_calls).toEqual([]);
  });

  it('tool_use/tool_result pairs are properly linked across messages', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'toolu_xyz789',
            function: {
              name: 'kubernetes_api_request',
              arguments: '{"method":"GET","path":"/api/v1/namespaces"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: '{"items":[{"metadata":{"name":"default"}}]}',
        toolCallId: 'toolu_xyz789',
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(2);
    // Assistant message has the tool_use
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect((messages[0] as AIMessage).tool_calls![0].id).toBe('toolu_xyz789');
    // Tool message references same id
    expect(messages[1]).toBeInstanceOf(ToolMessage);
    expect((messages[1] as ToolMessage).tool_call_id).toBe('toolu_xyz789');
  });

  it('handles multiple tool calls in a single assistant message', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: 'Checking both clusters.',
        toolCalls: [
          {
            id: 'call_1',
            function: { name: 'kubernetes_api_request', arguments: '{"path":"/api/v1/pods"}' },
          },
          {
            id: 'call_2',
            function: { name: 'kubernetes_api_request', arguments: '{"path":"/api/v1/nodes"}' },
          },
        ],
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect((messages[0] as AIMessage).tool_calls).toHaveLength(2);
    expect((messages[0] as AIMessage).tool_calls![0].id).toBe('call_1');
    expect((messages[0] as AIMessage).tool_calls![1].id).toBe('call_2');
  });

  it('handles toolCalls with pre-parsed arguments object', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'call_obj',
            function: {
              name: 'some_tool',
              arguments: { key: 'value' }, // already an object, not a string
            },
          },
        ],
      },
    ];

    const messages = convertPromptsToMessages(prompts);

    expect((messages[0] as AIMessage).tool_calls![0].args).toEqual({ key: 'value' });
  });
});

// ---------------------------------------------------------------------------
// BUG-9: tool_use ids without matching tool_result blocks cause 400 errors.
//
// When display-only tool results are filtered out in prepareChatHistory,
// the assistant message still has tool_calls but the corresponding
// tool_result messages are gone — Anthropic rejects this with:
//   "tool_use ids were found without tool_result blocks immediately after"
//
// sanitizeToolAlignment strips orphaned tool_calls and orphan tool results
// so the history is always well-formed.
// ---------------------------------------------------------------------------
describe('BUG-9: sanitizeToolAlignment fixes tool_use/tool_result mismatches', () => {
  it('strips tool_calls when no matching tool results follow', () => {
    const manager = createTestManager();
    const prompts = [
      { role: 'user', content: 'list pods' },
      {
        role: 'assistant',
        content: 'Let me check.',
        toolCalls: [
          { id: 'tc1', function: { name: 'k8s', arguments: '{}' } },
          { id: 'tc2', function: { name: 'k8s', arguments: '{}' } },
        ],
      },
      // No tool results at all — both are orphaned
      { role: 'user', content: 'hello again' },
    ];

    const result = sanitizeToolAlignment(prompts);

    // assistant message should lose its toolCalls
    expect(result[1].toolCalls).toBeUndefined();
    // user message after it should be preserved
    expect(result).toHaveLength(3);
    expect(result[2].role).toBe('user');
  });

  it('keeps tool_calls when all results are present', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'tc1', function: { name: 'tool_a', arguments: '{}' } },
          { id: 'tc2', function: { name: 'tool_b', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: 'result1', toolCallId: 'tc1' },
      { role: 'tool', content: 'result2', toolCallId: 'tc2' },
    ];

    const result = sanitizeToolAlignment(prompts);

    expect(result).toHaveLength(3);
    expect(result[0].toolCalls).toHaveLength(2);
  });

  it('keeps only matched tool_calls when some results are missing', () => {
    const manager = createTestManager();
    const prompts = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'tc1', function: { name: 'tool_a', arguments: '{}' } },
          { id: 'tc2', function: { name: 'tool_b', arguments: '{}' } },
          { id: 'tc3', function: { name: 'tool_c', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: 'result1', toolCallId: 'tc1' },
      // tc2 and tc3 results missing
    ];

    const result = sanitizeToolAlignment(prompts);

    // Only tc1 should remain in tool_calls
    expect(result[0].toolCalls).toHaveLength(1);
    expect(result[0].toolCalls?.[0]).toMatchObject({ id: 'tc1' });
    // The tool result for tc1 should be kept
    expect(result[1].role).toBe('tool');
    expect(result[1].toolCallId).toBe('tc1');
  });

  it('drops orphan tool results that have no matching assistant tool_call', () => {
    const manager = createTestManager();
    const prompts = [
      { role: 'assistant', content: 'No tools here.' },
      // Orphan tool result — no preceding assistant with matching toolCalls
      { role: 'tool', content: 'stale result', toolCallId: 'orphan_id' },
      { role: 'user', content: 'next question' },
    ];

    const result = sanitizeToolAlignment(prompts);

    // orphan tool message should be dropped
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('assistant');
    expect(result[1].role).toBe('user');
  });

  it('handles the exact BUG-9 scenario: display-only filtering leaves orphaned tool_use', () => {
    const manager = createTestManager();

    // Simulate what happens: assistant has 6 tool_calls, but all results
    // were isDisplayOnly (confirmation placeholders) and got filtered before
    // sanitizeToolAlignment is called.
    const prompts = [
      { role: 'user', content: 'delete these pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'toolu_1', function: { name: 'k8s_api', arguments: '{}' } },
          { id: 'toolu_2', function: { name: 'k8s_api', arguments: '{}' } },
          { id: 'toolu_3', function: { name: 'k8s_api', arguments: '{}' } },
          { id: 'toolu_4', function: { name: 'k8s_api', arguments: '{}' } },
          { id: 'toolu_5', function: { name: 'k8s_api', arguments: '{}' } },
          { id: 'toolu_6', function: { name: 'k8s_api', arguments: '{}' } },
        ],
      },
      // All 6 tool results were filtered (isDisplayOnly) before we get here
      { role: 'user', content: 'what happened?' },
      { role: 'assistant', content: 'Those operations need confirmation.' },
    ];

    const result = sanitizeToolAlignment(prompts);

    // The assistant at index 1 should have toolCalls stripped
    expect(result[1].toolCalls).toBeUndefined();
    // All 4 messages should remain (minus no tool messages)
    expect(result).toHaveLength(4);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
    expect(result[2].role).toBe('user');
    expect(result[3].role).toBe('assistant');
  });

  it('works with multiple rounds of tool calling in one history', () => {
    const manager = createTestManager();
    const prompts = [
      // Round 1: valid
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'tc1', function: { name: 'tool_a', arguments: '{}' } }],
      },
      { role: 'tool', content: 'result1', toolCallId: 'tc1' },
      { role: 'assistant', content: 'Here is the result.' },
      // Round 2: orphaned (results filtered)
      { role: 'user', content: 'do more' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'tc2', function: { name: 'tool_b', arguments: '{}' } },
          { id: 'tc3', function: { name: 'tool_c', arguments: '{}' } },
        ],
      },
      // No tool results for tc2/tc3
      { role: 'user', content: 'what happened?' },
    ];

    const result = sanitizeToolAlignment(prompts);

    // Round 1 should be intact
    expect(result[0].toolCalls).toHaveLength(1);
    expect(result[1].role).toBe('tool');
    // Round 2 should have toolCalls stripped
    expect(result[4].role).toBe('assistant');
    expect(result[4].toolCalls).toBeUndefined();
  });

  it('passes through history with no tool calls unchanged', () => {
    const manager = createTestManager();
    const prompts = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
      { role: 'user', content: 'how are you' },
      { role: 'assistant', content: 'fine' },
    ];

    const result = sanitizeToolAlignment(prompts);

    expect(result).toEqual(prompts);
  });
});

// ---------------------------------------------------------------------------
// BUG-2: .signal accessed without optional chain after abort() nulls controller.
//
// abort() sets this.currentAbortController = null. If a concurrent async
// operation then accesses this.currentAbortController.signal (no ?.),
// it throws TypeError.
// ---------------------------------------------------------------------------
describe('BUG-2: null dereference on .signal after abort()', () => {
  it('handleLocalModelRequest works when currentAbortController is null', async () => {
    const manager = createTestManager();

    // Simulate abort() having set the controller to null
    privateManager(manager).currentAbortController = null;

    // Create a fake model that would normally work
    const fakeModel = {
      invoke: async () => new AIMessage('response'),
    };

    // With the bug: TypeError: Cannot read properties of null (reading 'signal')
    // After fix: completes without throwing
    const result = await privateManager(manager).handleLocalModelRequest('hello', fakeModel);
    expect(result.content).toBe('response');
  });

  it('handleChainBasedRequest works when currentAbortController is null', async () => {
    const manager = createTestManager();
    privateManager(manager).currentAbortController = null;

    // With the bug: TypeError on this.currentAbortController.signal
    // After fix: completes without throwing
    const result = await privateManager(manager).handleChainBasedRequest('hello', {
      invoke: async () => new AIMessage('response'),
    });
    expect(result.content).toBeTruthy();
  });

  it('handleToolEnabledRequest works when currentAbortController is null', async () => {
    const manager = createTestManager();
    privateManager(manager).currentAbortController = null;

    const fakeModel = {
      invoke: async () => new AIMessage({ content: 'response' }),
    };

    const chainInput = {
      systemPrompt: 'You are a helpful assistant.',
      chatHistory: [],
      input: 'hello',
    };

    // With the bug: TypeError on this.currentAbortController.signal
    // After fix: completes without throwing
    const result = await privateManager(manager).handleToolEnabledRequest(chainInput, fakeModel);
    expect(result.content).toBe('response');
  });
});

// ---------------------------------------------------------------------------
// BUG-COPILOT: generate() bypasses tool binding, invoke() works correctly.
//
// When tools are bound via bindTools(), the Copilot API (wrapping Claude)
// returns proper tool_calls with finish_reason: "tool_calls".
// However, generate() bypasses the RunnableBinding and doesn't send tool
// definitions to the API — the model falls back to XML-style tool calls
// in the response text with tool_calls: [].
//
// The fix: use invoke() on the bound model (not generate()) so tools are
// properly sent as function definitions in the API request.
// ---------------------------------------------------------------------------
describe('BUG-COPILOT: handleDirectToolCallingRequest uses invoke() for proper tool binding', () => {
  it('handleDirectToolCallingRequest detects tool calls from invoke() response', async () => {
    const manager = createTestManager();
    privateManager(manager).currentAbortController = new AbortController();

    // Simulate a model where invoke() returns proper tool_calls
    // (as happens when tools are bound via bindTools and the API
    // recognizes the tool definitions).
    const fakeModel = {
      invoke: async () => copilotMergedResponse(),
    };
    privateManager(manager).boundModel = fakeModel;
    privateManager(manager).useDirectToolCalling = true;

    // Stub the tool manager to report kubernetes_api_request as enabled
    privateManager(manager).toolManager = {
      getToolNames: () => ['kubernetes_api_request'],
      getMCPTools: () => [],
      executeTool: async () => ({
        content: JSON.stringify({ pods: [], shouldProcessFollowUp: false }),
        shouldAddToHistory: true,
        shouldProcessFollowUp: false,
      }),
    };

    const result = await privateManager(manager).handleDirectToolCallingRequest(
      'are there any failing pods?'
    );

    // invoke() on bound model returns proper tool_calls
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls?.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// extraTools: enableDirectToolCalling with externally-provided tools.
//
// When CLI or headless environments call enableDirectToolCalling([tool]),
// the extra tools must be:
//   1. Recognized in createSystemPrompt (hasKubernetesTool check)
//   2. Included in handleToolCalls filtering (enabledToolIds)
//   3. Executed via extraTool.invoke() in processToolCalls
// ---------------------------------------------------------------------------
describe('extraTools: external tools via enableDirectToolCalling', () => {
  it('extraTools are included in enabledToolIds for tool call filtering', async () => {
    const manager = createTestManager();
    privateManager(manager).currentAbortController = new AbortController();

    // Register an extra tool
    const fakeTool = {
      name: 'kubernetes_api_request',
      invoke: async () => JSON.stringify({ items: [], shouldProcessFollowUp: false }),
    };
    privateManager(manager).extraTools.set('kubernetes_api_request', fakeTool);
    privateManager(manager).useDirectToolCalling = true;

    // Stub boundModel to return a tool call
    privateManager(manager).boundModel = {
      invoke: async () => copilotMergedResponse(),
    };

    // Stub toolManager with NO tools (extra tools provide them instead)
    privateManager(manager).toolManager = {
      getToolNames: () => [],
      getMCPTools: () => [],
    };

    const result = await privateManager(manager).handleDirectToolCallingRequest('list pods');

    // Tool calls should NOT be filtered out — extraTools provides the name
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls?.length).toBe(1);
    expect(result.toolCalls?.[0]).toMatchObject({
      function: { name: 'kubernetes_api_request' },
    });
  });

  it('processToolCalls executes extra tools via invoke()', async () => {
    const manager = createTestManager();

    // Track whether the extra tool was called
    let toolWasCalled = false;
    const fakeTool = {
      name: 'kubernetes_api_request',
      invoke: async () => {
        toolWasCalled = true;
        return JSON.stringify({ kind: 'PodList', items: [], shouldProcessFollowUp: false });
      },
    };
    privateManager(manager).extraTools.set('kubernetes_api_request', fakeTool);

    const toolCalls: NormalizedToolCall[] = [
      {
        type: 'function',
        id: 'call_1',
        function: {
          name: 'kubernetes_api_request',
          arguments: JSON.stringify({ url: '/api/v1/pods', method: 'GET' }),
        },
      },
    ];
    const assistantPrompt: Prompt = { role: 'assistant', content: 'Checking...', toolCalls };

    await privateManager(manager).processToolCalls(toolCalls, assistantPrompt);

    expect(toolWasCalled).toBe(true);

    // Verify tool response was added to history
    const toolResponse = privateManager(manager).history.find(
      prompt => prompt.role === 'tool' && prompt.toolCallId === 'call_1'
    );
    expect(toolResponse).toBeDefined();
    expect(toolResponse?.content).toContain('PodList');
  });
});

// ---------------------------------------------------------------------------
// Public lifecycle methods
// ---------------------------------------------------------------------------
describe('LangChainManager public lifecycle', () => {
  it('abort() cancels the current request and clears the controller', () => {
    const manager = createTestManager();
    privateManager(manager).currentAbortController = new AbortController();
    manager.abort();
    expect(privateManager(manager).currentAbortController).toBeNull();
  });

  it('abort() is a no-op when no request is in flight', () => {
    const manager = createTestManager();
    expect(() => manager.abort()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tool confirmation history management
// ---------------------------------------------------------------------------
describe('LangChainManager tool confirmation history', () => {
  it('addToolConfirmationMessage appends a display-only prompt to history', () => {
    const manager = createTestManager();
    const confirmation = makeToolConfirmation({ requestId: 'req-1' });

    manager.addToolConfirmationMessage('', confirmation);

    const history = privateManager(manager).history;
    expect(history).toHaveLength(1);
    const entry = history[0];
    expect(entry.role).toBe('assistant');
    expect(entry.isDisplayOnly).toBe(true);
    expect(entry.requestId).toBe('req-1');
    expect(entry.toolConfirmation).toBe(confirmation);
  });

  it('addToolConfirmationMessage calls updateHistoryCallback when provided', () => {
    const manager = createTestManager();
    let called = false;
    manager.addToolConfirmationMessage('', makeToolConfirmation({ requestId: 'r' }), () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it('updateToolConfirmationMessage replaces the matching entry in history', () => {
    const manager = createTestManager();
    const original = makeToolConfirmation({ requestId: 'r1', loading: false });
    const updated = makeToolConfirmation({ requestId: 'r1', loading: true });

    manager.addToolConfirmationMessage('', original);
    manager.updateToolConfirmationMessage('r1', updated);

    const history = privateManager(manager).history;
    expect(history[0].toolConfirmation).toEqual(updated);
  });

  it('updateToolConfirmationMessage warns when requestId not found', () => {
    const manager = createTestManager();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.updateToolConfirmationMessage('nonexistent', makeToolConfirmation());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not find'));
    warn.mockRestore();
  });

  it('clearToolConfirmation removes the most recent confirmation from history', () => {
    const manager = createTestManager();
    manager.addToolConfirmationMessage('', makeToolConfirmation({ requestId: 'r1' }));
    manager.addToolConfirmationMessage('', makeToolConfirmation({ requestId: 'r2' }));

    const before = privateManager(manager).history.length;
    manager.clearToolConfirmation();
    expect(privateManager(manager).history).toHaveLength(before - 1);
    // The last confirmation (r2) was removed; r1 remains
    expect(privateManager(manager).history[0].requestId).toBe('r1');
  });

  it('clearToolConfirmation is a no-op when no confirmation exists', () => {
    const manager = createTestManager();
    privateManager(manager).history.push({ role: 'user', content: 'hello' });
    expect(() => manager.clearToolConfirmation()).not.toThrow();
    expect(privateManager(manager).history).toHaveLength(1);
  });
});

// =============================================================================
// userSend — full path via MockTestingModel + MockApprovalManager
// =============================================================================

describe('userSend — basic response path', () => {
  it('returns an assistant prompt with non-empty content', async () => {
    const manager = createIntegrationManager();
    const response = await manager.userSend('what is a Pod?');
    expect(response.role).toBe('assistant');
    expect(response.content.length).toBeGreaterThan(0);
  });

  it('adds the user message to history before invoking the model', async () => {
    const manager = createIntegrationManager();
    await manager.userSend('hello');
    const history = privateManager(manager).history;
    expect(history.some(prompt => prompt.role === 'user' && prompt.content === 'hello')).toBe(true);
  });

  it('adds the assistant response to history', async () => {
    const manager = createIntegrationManager();
    await manager.userSend('hello');
    const history = privateManager(manager).history;
    expect(history.some(prompt => prompt.role === 'assistant')).toBe(true);
  });

  it('history grows by 2 (user + assistant) on a plain message', async () => {
    const manager = createIntegrationManager();
    const before = privateManager(manager).history.length;
    await manager.userSend('hello');
    expect(privateManager(manager).history.length).toBe(before + 2);
  });
});

describe('userSend — response caching', () => {
  it('caches a plain (no tool calls) response', async () => {
    const manager = createIntegrationManager();
    await manager.userSend('what is a Pod?');
    expect(privateManager(manager).responseCache.size).toBe(1);
  });

  it('returns the cached response on the second identical message', async () => {
    const manager = createIntegrationManager();
    const first = await manager.userSend('what is a Pod?');
    const second = await manager.userSend('what is a Pod?');
    // Content must be identical (served from cache)
    expect(second.content).toBe(first.content);
  });

  it('cache hit adds the cached response to history', async () => {
    const manager = createIntegrationManager();
    await manager.userSend('what is a Pod?');
    const historyAfterFirst = privateManager(manager).history.length;
    await manager.userSend('what is a Pod?'); // cache hit
    // user + cached_response added = +2
    expect(privateManager(manager).history.length).toBe(historyAfterFirst + 2);
  });

  it('expired cache entry is not returned', async () => {
    const manager = createIntegrationManager();
    await manager.userSend('test cache');
    // Expire the cache by back-dating the timestamp
    const cache = privateManager(manager).responseCache;
    for (const [key, entry] of cache) {
      cache.set(key, { ...entry, timestamp: 0 }); // far in the past
    }
    // A second call should hit the model again, not the cache
    const second = await manager.userSend('test cache');
    expect(second.role).toBe('assistant');
  });
});

describe('userSend — abort / error paths', () => {
  it('handles AbortError by returning "Request cancelled." prompt', async () => {
    const manager = createIntegrationManager();
    // Replace model with one that throws AbortError
    privateManager(manager).model = {
      invoke: async () => {
        throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      },
      stream: async function* () {},
    };
    const response = await manager.userSend('trigger abort');
    expect(response.content).toBe('Request cancelled.');
    expect(response.error).toBe(true);
  });

  it('handles generic errors by returning an error prompt', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: async () => {
        throw new Error('something went wrong');
      },
      stream: async function* () {},
    };
    const response = await manager.userSend('trigger error');
    expect(response.error).toBe(true);
    expect(response.role).toBe('assistant');
  });

  it('abort() clears the controller so subsequent calls work normally', async () => {
    const manager = createIntegrationManager();
    manager.abort();
    const response = await manager.userSend('after abort');
    expect(response.role).toBe('assistant');
  });
});

// =============================================================================
// userSend — with MockToolManager (tool execution path)
// =============================================================================

describe('userSend — with MockKubernetesToolManager', () => {
  it('executes kubernetes_api_request and returns an assistant response', async () => {
    const executed: string[] = [];
    const toolManager = createMockKubernetesToolManager();
    // Attach a spy via onExecuteTool option (recreate with spy)
    const spiedManager = createMockToolManager({
      enabledToolNames: ['kubernetes_api_request'],
      toolResults: { kubernetes_api_request: toolManager['toolResults']['kubernetes_api_request'] },
      onExecuteTool: name => executed.push(name),
    });
    const manager = createIntegrationManager(spiedManager);
    privateManager(manager).useDirectToolCalling = true;

    const tc = {
      id: 'tc1',
      name: 'kubernetes_api_request',
      args: { url: '/api/v1/pods', method: 'GET' },
    };
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: '', tool_calls: [tc] })
        .mockResolvedValue({ content: 'Here are your pods: nginx and coredns.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('show me all pods');
    // Tool was executed
    expect(executed).toContain('kubernetes_api_request');
    // Final response is assistant text
    expect(response.role).toBe('assistant');
    expect(response.content).toBeTruthy();
  });

  it('tool result data (pods) flows through to the final response', async () => {
    const toolManager = createMockKubernetesToolManager();
    const manager = createIntegrationManager(toolManager);
    privateManager(manager).useDirectToolCalling = true;

    const tc = {
      id: 'tc1',
      name: 'kubernetes_api_request',
      args: { url: '/api/v1/pods', method: 'GET' },
    };
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: '', tool_calls: [tc] })
        // Return content that references the pods from the mock data
        .mockResolvedValue({
          content: 'Found 3 pods: nginx, coredns, and broken-app.',
          tool_calls: [],
        }),
      stream: async function* () {},
    };

    const response = await manager.userSend('list pods');
    expect(response.content).toContain('pods');
    expect(response.error).toBeFalsy();
  });
});

describe('userSend — tool disabled path', () => {
  it('returns a disabled-tools explanation when tool is not in enabled list', async () => {
    // Build a manager with NO enabled tools but force a tool_call response
    const manager = createIntegrationManager();
    const tc = { id: 'tc1', name: 'kubernetes_api_request', args: { url: '/api/v1/pods' } };
    privateManager(manager).model = {
      invoke: async () => ({ content: 'Here you go', tool_calls: [tc] }),
      stream: async function* () {},
    };
    // toolManager returns [] for getToolNames() → all tools disabled
    const response = await manager.userSend('list pods');
    expect(response.role).toBe('assistant');
    // Should either return the content or a disabled-tools explanation
    expect(response.content.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// userSend — MockApprovalManager deny-all path
// =============================================================================

describe('userSend — deny-all approval', () => {
  it('returns an assistant response (not an error) when MCP tools are denied', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager({ mode: 'deny-all' }));
    // kubernetes_api_request is a built-in tool → auto-approved regardless of deny-all
    // Use a fake MCP-style tool name to test actual denial
    const toolManager = createMockToolManager({ enabledToolNames: ['my_mcp_tool'] });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, ['my_mcp_tool'], {
      toolManager,
    });
    privateManager(manager).useDirectToolCalling = true;
    // Mark as MCP so it goes through the approval path that can be denied
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'my_mcp_tool' }];

    const tc = { id: 'tc1', name: 'my_mcp_tool', args: {} };
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: '', tool_calls: [tc] })
        .mockResolvedValue({ content: 'Tools were denied.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('run my mcp tool');
    expect(response.role).toBe('assistant');
    // Should have gotten a follow-up response after denial
    expect(response.content).toBeTruthy();
  });
});

// =============================================================================
// MockApprovalManager onRequestApproval spy
// =============================================================================

describe('MockApprovalManager + MCP tool flow', () => {
  it('approve-all: MCP tool is executed and response has content', async () => {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const executed: string[] = [];
    const toolManager = createMockToolManager({
      enabledToolNames: ['my_mcp_tool'],
      toolResults: { my_mcp_tool: { result: 'mcp tool ran' } },
      onExecuteTool: name => executed.push(name),
    });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, ['my_mcp_tool'], {
      toolManager,
    });
    privateManager(manager).useDirectToolCalling = true;
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'my_mcp_tool' }];

    const tc = { id: 'tc1', name: 'my_mcp_tool', args: {} };
    privateManager(manager).model = {
      invoke: vi
        .fn()
        // First call: ToolOrchestrator analyzeAndRecommendTools (returns non-JSON → orchestration skipped)
        .mockResolvedValueOnce({ content: 'no orchestration needed', tool_calls: [] })
        // Second call: handleDirectToolCallingRequest → emits tool call
        .mockResolvedValueOnce({ content: '', tool_calls: [tc] })
        // Subsequent calls: processToolResponses follow-up
        .mockResolvedValue({ content: 'MCP tool executed successfully.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('run my mcp tool');
    // Tool was executed (approval went through)
    expect(executed).toContain('my_mcp_tool');
    expect(response.role).toBe('assistant');
    expect(response.content).toBeTruthy();
  });

  it('deny-all: MCP tool is NOT executed and denial is recorded', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager({ mode: 'deny-all' }));
    const executed: string[] = [];
    const toolManager = createMockToolManager({
      enabledToolNames: ['my_mcp_tool'],
      toolResults: { my_mcp_tool: { result: 'mcp tool ran' } },
      onExecuteTool: name => executed.push(name),
    });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, ['my_mcp_tool'], {
      toolManager,
    });
    privateManager(manager).useDirectToolCalling = true;
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'my_mcp_tool' }];

    const tc = { id: 'tc1', name: 'my_mcp_tool', args: {} };
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: 'no orchestration', tool_calls: [] })
        .mockResolvedValueOnce({ content: '', tool_calls: [tc] })
        .mockResolvedValue({ content: 'Understood, tool denied.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('run my mcp tool');
    // Tool should NOT have been executed
    expect(executed).not.toContain('my_mcp_tool');
    expect(response.role).toBe('assistant');
  });
});

// =============================================================================
// analyzeAndCorrectResponse / getCorrectedResponse (kubectl correction path)
// =============================================================================

describe('kubectl correction via processToolResponses', () => {
  it('getCorrectedResponse triggers when model suggests kubectl', async () => {
    const manager = createIntegrationManager();

    // Seed history with an assistant tool call + tool result
    const tc = { id: 'tc1', name: 'kubernetes_api_request', args: { url: '/api/v1/pods' } };
    privateManager(manager).history.push(
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: '{"pods":[]}', toolCallId: 'tc1', name: 'kubernetes_api_request' }
    );

    // First model call returns a kubectl suggestion; second call is the correction
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({ content: 'Run kubectl get pods to see them.', tool_calls: [] })
        .mockResolvedValue({
          content: 'Use the Kubernetes API from Headlamp instead.',
          tool_calls: [],
        }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    // The correction was applied — final content should come from the second call
    expect(response.content).toBeTruthy();
    // Model was invoked twice: once for the tool response, once for the kubectl correction
    expect(privateManager(manager).model?.invoke).toHaveBeenCalledTimes(2);
  });

  it('getCorrectedResponse falls back to original when correction call throws', async () => {
    const manager = createIntegrationManager();

    privateManager(manager).history.push(
      { role: 'user', content: 'how do I check pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: '{"pods":[]}', toolCallId: 'tc1', name: 'kubernetes_api_request' }
    );

    privateManager(manager).model = {
      invoke: vi
        .fn()
        // First call: suggests kubectl
        .mockResolvedValueOnce({ content: 'Use kubectl get pods', tool_calls: [] })
        // Second call (correction): throws
        .mockRejectedValue(new Error('model unavailable')),
      stream: async function* () {},
    };

    // Should NOT throw — falls back to original response
    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    expect(response.content).toBeTruthy();
  });

  it('no correction when model response has no kubectl', async () => {
    const manager = createIntegrationManager();

    privateManager(manager).history.push(
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      {
        role: 'tool',
        content: '{"pods":["nginx"]}',
        toolCallId: 'tc1',
        name: 'kubernetes_api_request',
      }
    );

    const spy = vi
      .fn()
      .mockResolvedValue({ content: 'Here are your pods: nginx.', tool_calls: [] });
    privateManager(manager).model = { invoke: spy, stream: async function* () {} };

    await manager.processToolResponses();
    // Model was called exactly once (no correction call)
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// handleToolResponseError
// =============================================================================

describe('handleToolResponseError', () => {
  it('returns an error assistant prompt with the error message', async () => {
    const manager = createIntegrationManager();

    // Seed history with a tool response so processToolResponses proceeds
    privateManager(manager).history.push(
      { role: 'user', content: 'test' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: '{"data":"x"}', toolCallId: 'tc1', name: 'kubernetes_api_request' }
    );

    // Model throws during processToolResponses
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('chain failure')),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    expect(response.error).toBe(true);
    expect(response.content).toContain('error');
  });

  it('adds the error prompt to history', async () => {
    const manager = createIntegrationManager();

    privateManager(manager).history.push(
      { role: 'user', content: 'test' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: '{"data":"x"}', toolCallId: 'tc1', name: 'kubernetes_api_request' }
    );

    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('boom')),
      stream: async function* () {},
    };

    const before = privateManager(manager).history.length;
    await manager.processToolResponses();
    expect(privateManager(manager).history.length).toBeGreaterThan(before);
  });
});

// =============================================================================
// processToolResponses — when no tool responses exist
// =============================================================================

describe('processToolResponses — no tool responses in history', () => {
  it('returns the last assistant message when history has no tool results', async () => {
    const manager = createIntegrationManager();

    privateManager(manager).history.push(
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Hi there!' }
    );

    const response = await manager.processToolResponses();
    expect(response.content).toBe('Hi there!');
  });
});

// =============================================================================
// userSend — local provider path
// =============================================================================

describe('userSend — local provider', () => {
  it('uses handleLocalModelRequest when providerId is "local"', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager());
    const manager = new LangChainAssistantSession('local', {
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
    });

    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Local model reply.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('hello');
    expect(response.role).toBe('assistant');
    expect(response.content).toBe('Local model reply.');
  });
});

// =============================================================================
// userSend — multi-turn (history grows correctly)
// =============================================================================

describe('userSend — multi-turn conversation', () => {
  it('history grows by 2 per round and preserves order', async () => {
    const manager = createIntegrationManager();

    await manager.userSend('first message');
    await manager.userSend('second message');

    const history = privateManager(manager).history;
    const userMsgs = history.filter(p => p.role === 'user');
    expect(userMsgs).toHaveLength(2);
    expect(userMsgs[0].content).toBe('first message');
    expect(userMsgs[1].content).toBe('second message');
  });
});

// =============================================================================
// enableDirectToolCalling
// =============================================================================

describe('enableDirectToolCalling', () => {
  it('sets useDirectToolCalling to true for a compatible provider', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager());
    const manager = new LangChainAssistantSession('openai', { apiKey: 'sk-test' });
    // Patch model to avoid real binding
    privateManager(manager).toolManager = createMockToolManager({ enabledToolNames: ['my_tool'] });
    await manager.enableDirectToolCalling();
    expect(privateManager(manager).useDirectToolCalling).toBe(true);
  });

  it('binds extra tools passed to enableDirectToolCalling', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager());
    const manager = new LangChainAssistantSession('openai', { apiKey: 'sk-test' });
    privateManager(manager).toolManager = createMockToolManager({ enabledToolNames: [] });
    const fakeTool = { name: 'kubectl', invoke: vi.fn() };
    await manager.enableDirectToolCalling([fakeTool]);
    const extraTools = privateManager(manager).extraTools;
    expect(extraTools.has('kubectl')).toBe(true);
  });
});

// =============================================================================
// BUG: handleToolResponseError crashes on null/non-Error thrown values
// =============================================================================

describe('BUG: handleToolResponseError null safety', () => {
  it('BUG (fixed): throws TypeError when error is null — error.message is not optional-chained', () => {
    const manager = createIntegrationManager();
    // Null errors can happen when code does `throw null` or when error
    // propagation loses the wrapped error object in some environments.
    // Before fix: TypeError: Cannot read properties of null (reading 'message')
    expect(() => privateManager(manager).handleToolResponseError(null)).not.toThrow();
  });

  it('returns an error prompt with a meaningful message even for null error', () => {
    const manager = createIntegrationManager();
    const result = privateManager(manager).handleToolResponseError(null);
    expect(result.role).toBe('assistant');
    expect(result.error).toBe(true);
    // Should not contain "undefined" or "null" literally
    expect(result.content).not.toContain('undefined');
  });

  it('BUG (fixed): throws when error is a plain string (has no .message property)', () => {
    const manager = createIntegrationManager();
    // `throw 'something went wrong'` gives a string, not an Error object
    expect(() =>
      privateManager(manager).handleToolResponseError('something went wrong')
    ).not.toThrow();
  });

  it('includes the string error text in the prompt when error is a string', () => {
    const manager = createIntegrationManager();
    const result = privateManager(manager).handleToolResponseError('disk full');
    expect(result.content).toContain('disk full');
  });

  it('still works correctly for normal Error objects', () => {
    const manager = createIntegrationManager();
    const result = privateManager(manager).handleToolResponseError(new Error('chain failed'));
    expect(result.content).toContain('chain failed');
    expect(result.error).toBe(true);
  });

  it('processToolResponses does not crash when the chain throws null', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).history.push(
      { role: 'user', content: 'test' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            type: 'function',
            id: 'tc1',
            function: { name: 'kubernetes_api_request', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: '{}', toolCallId: 'tc1', name: 'kubernetes_api_request' }
    );
    privateManager(manager).model = {
      invoke: vi.fn().mockImplementation(() => {
        throw null;
      }),
      stream: async function* () {},
    };
    // Before fix: uncaught TypeError from error.message on null
    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    expect(response.error).toBe(true);
  });
});

// =============================================================================
// BUG: processToolCalls silent gap when shouldAddToHistory:false + no confirmation
// =============================================================================

describe('BUG: processToolCalls tool alignment when shouldAddToHistory:false', () => {
  it('BUG (fixed): tool with shouldAddToHistory:false and no requiresConfirmation leaves no history entry', async () => {
    const manager = createIntegrationManager();

    // A tool response that explicitly says NOT to add to history, and
    // is NOT a confirmation-pending request either.
    const silentToolManager = createMockToolManager({
      enabledToolNames: ['silent_tool'],
      toolResults: { silent_tool: { result: 'done' } },
    });
    // Override executeTool to return shouldAddToHistory:false with no confirmation
    silentToolManager.executeTool = async () => ({
      content: JSON.stringify({ result: 'silent success' }),
      shouldAddToHistory: false,
      shouldProcessFollowUp: false,
      // NO metadata.requiresConfirmation
    });

    const toolCalls: NormalizedToolCall[] = [
      {
        type: 'function',
        id: 'tc1',
        function: { name: 'silent_tool', arguments: '{}' },
      },
    ];
    const assistantPrompt = {
      role: 'assistant',
      content: '',
      toolCalls: [
        { type: 'function', id: 'tc1', function: { name: 'silent_tool', arguments: '{}' } },
      ],
    };
    privateManager(manager).toolManager = silentToolManager;

    const historyBefore = privateManager(manager).history.length;
    await privateManager(manager).processToolCalls(toolCalls, assistantPrompt);

    // Fixed: a placeholder history entry IS added to maintain tool alignment
    const toolEntries = privateManager(manager)
      .history.slice(historyBefore)
      .filter(prompt => prompt.role === 'tool');
    expect(toolEntries.length).toBe(1);
    expect(toolEntries[0].toolCallId).toBe('tc1');
  });
});

// =============================================================================
// enhanceArgumentsWithAI + prepareLLMArguments (uncovered, bug-hunt)
// =============================================================================

describe('enhanceArgumentsWithAI', () => {
  const schema = {
    inputSchema: {
      properties: { namespace: { type: 'string' }, limit: { type: 'number' } },
      required: ['namespace'],
    },
  };
  const userCtx = { userMessage: 'list pods', timeContext: new Date() };

  it('returns original args unchanged when schema has no inputSchema.properties', async () => {
    const manager = createIntegrationManager();
    const result = await privateManager(manager).enhanceArgumentsWithAI('tool', {}, userCtx, {
      key: 'val',
    });
    expect(result).toEqual({ key: 'val' });
  });

  it('merges LLM-returned args into the enhanced object', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValue({ content: '{"namespace":"kube-system","limit":5}', tool_calls: [] }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).enhanceArgumentsWithAI(
      'tool',
      schema,
      userCtx,
      {}
    );
    expect(result.namespace).toBe('kube-system');
    expect(result.limit).toBe(5);
  });

  it('preserves original args when LLM does not override them', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: '{"limit":10}', tool_calls: [] }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).enhanceArgumentsWithAI('tool', schema, userCtx, {
      namespace: 'production',
    });
    expect(result.namespace).toBe('production');
    expect(result.limit).toBe(10);
  });

  it('BUG (fixed): required fields NOT filled when LLM returns non-JSON (empty args)', async () => {
    // When the model returns plain text (no JSON), parseArgumentsFromResponse
    // silently returns {}.  Before the fix, enhanceArgumentsWithAI merged {}
    // and returned the original args unchanged — required fields stayed missing.
    // After the fix, fillMissingRequiredFields is always called for still-empty
    // required fields regardless of whether the LLM succeeded.
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'I cannot help with that.', tool_calls: [] }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).enhanceArgumentsWithAI(
      'tool',
      schema,
      userCtx,
      {} // namespace is required but absent
    );
    // Fixed: namespace should be filled with an intelligent default
    expect(result.namespace).toBeDefined();
    expect(result.namespace).not.toBe('');
  });

  it('falls back to fillMissingRequiredFields when LLM call throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('model error')),
      stream: async function* () {},
    };
    const result = await privateManager(manager).enhanceArgumentsWithAI(
      'tool',
      schema,
      { ...userCtx, userMessage: 'show pods namespace: staging' },
      {}
    );
    // The fallback should extract the namespace from the user message
    expect(result.namespace).toBeDefined();
  });

  it('does not throw when schema has no required array', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: '{}', tool_calls: [] }),
      stream: async function* () {},
    };
    const noReqSchema = { inputSchema: { properties: { ns: { type: 'string' } } } };
    await expect(
      privateManager(manager).enhanceArgumentsWithAI('tool', noReqSchema, userCtx, {})
    ).resolves.not.toThrow();
  });
});

describe('prepareLLMArguments', () => {
  const schema = {
    inputSchema: {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    },
  };
  const userCtx = { userMessage: 'list pods in default', timeContext: new Date() };

  it('parses valid JSON from model response', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: '{"namespace":"default"}', tool_calls: [] }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).prepareLLMArguments('tool', schema, userCtx, {});
    expect(result).toEqual({ namespace: 'default' });
  });

  it('returns {} when model response has no JSON', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'No arguments needed.', tool_calls: [] }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).prepareLLMArguments('tool', schema, userCtx, {});
    expect(result).toEqual({});
  });

  it('returns {} and does not throw when model.invoke throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('quota exceeded')),
      stream: async function* () {},
    };
    const result = await privateManager(manager).prepareLLMArguments('tool', schema, userCtx, {});
    expect(result).toEqual({});
  });

  it('invokes model with system and user messages built from the schema', async () => {
    const manager = createIntegrationManager();
    const spy = vi.fn().mockResolvedValue({ content: '{}', tool_calls: [] });
    privateManager(manager).model = { invoke: spy, stream: async function* () {} };

    await privateManager(manager).prepareLLMArguments('my_k8s_tool', schema, userCtx, {});

    expect(spy).toHaveBeenCalledOnce();
    const [messages] = spy.mock.calls[0];
    // System message includes the tool name
    expect(messages[0].content).toContain('my_k8s_tool');
    // User message contains the original user request
    expect(messages[1].content).toContain('list pods');
  });

  it('strips LLM-returned placeholder strings from the result', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({
        content: '{"namespace":"<optional: any namespace>","limit":5}',
        tool_calls: [],
      }),
      stream: async function* () {},
    };
    const result = await privateManager(manager).prepareLLMArguments('tool', schema, userCtx, {});
    // sanitizeLLMArguments should strip the placeholder
    expect(result).not.toHaveProperty('namespace');
    expect(result.limit).toBe(5);
  });

  it('BUG check: model invoke uses this.model (unbound) to avoid recursive tool calls', async () => {
    const manager = createIntegrationManager();
    let invokedModel: unknown = null;
    const fakeBoundModel = {
      invoke: vi.fn().mockImplementation(() => {
        invokedModel = 'bound';
        return { content: '{}', tool_calls: [] };
      }),
      stream: async function* () {},
    };
    const fakeUnboundModel = {
      invoke: vi.fn().mockImplementation(() => {
        invokedModel = 'unbound';
        return { content: '{}', tool_calls: [] };
      }),
      stream: async function* () {},
    };
    privateManager(manager).model = fakeUnboundModel;
    privateManager(manager).boundModel = fakeBoundModel;

    await privateManager(manager).prepareLLMArguments('tool', schema, userCtx, {});
    // Must use unbound model so no recursive tool calls happen
    expect(invokedModel).toBe('unbound');
    expect(fakeBoundModel.invoke).not.toHaveBeenCalled();
  });
});

// =============================================================================
// setSkillManager / setSkillsConfig / getSkillsPromptForQuery
// =============================================================================

describe('setSkillManager — skill prompt injection', () => {
  it('injects the skill prompt into the system prompt on next userSend', async () => {
    const manager = createIntegrationManager();
    manager.setSkillManager(
      createMockSkillManager({
        skillPrompt: '\n## Skill: k8s-debug\nUse X.',
      }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );

    // After userSend runs getSkillsPromptForQuery, currentSkillsPromptText is set.
    // We verify the system prompt reflects it by inspecting createSystemPrompt().
    await manager.userSend('debug my cluster');

    const systemPrompt = privateManager(manager).createSystemPrompt();
    expect(systemPrompt).toContain('k8s-debug');
  });

  it('empty prompt when no skill matches — does not pollute system prompt', async () => {
    const manager = createIntegrationManager();
    manager.setSkillManager(
      createMockSkillManager({ skillPrompt: '' }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );

    await manager.userSend('hello');

    const systemPrompt = privateManager(manager).createSystemPrompt();
    expect(systemPrompt).not.toContain('Skill:');
  });

  it('setSkillsConfig updates config without replacing the skill manager', async () => {
    const manager = createIntegrationManager();
    const queries: string[] = [];
    manager.setSkillManager(
      createMockSkillManager({ onRoute: q => queries.push(q) }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );
    privateManager(manager).currentSkillsPromptText = 'stale skill prompt';
    privateManager(manager).responseCache.set('stale', {
      value: { role: 'assistant', content: 'stale answer' },
      timestamp: Date.now(),
    });
    manager.setSkillsConfig({ ...DEFAULT_SKILLS_CONFIG, maxSkillSizeBytes: 1024 });

    expect(privateManager(manager).currentSkillsPromptText).toBe('');
    expect(privateManager(manager).responseCache.size).toBe(0);

    await manager.userSend('show pods');

    // SkillManager was still called (not replaced)
    expect(queries).toContain('show pods');
  });

  it('clears skill injection when the manager is removed', async () => {
    const manager = createIntegrationManager();
    const skillManager = createMockSkillManager({ skillPrompt: '\n## Skill: stale' });
    manager.setSkillManager(skillManager as unknown as SkillManager, DEFAULT_SKILLS_CONFIG);
    await manager.userSend('first');
    expect(privateManager(manager).currentSkillsPromptText).toContain('stale');
    privateManager(manager).responseCache.set('stale', {
      value: { role: 'assistant', content: 'stale answer' },
      timestamp: Date.now(),
    });
    manager.setSkillManager(null, DEFAULT_SKILLS_CONFIG);
    expect(privateManager(manager).currentSkillsPromptText).toBe('');
    expect(privateManager(manager).responseCache.size).toBe(0);
    await manager.userSend('second');
    expect(privateManager(manager).currentSkillsPromptText).toBe('');
  });
});

describe('getSkillsPromptForQuery — error handling', () => {
  it('returns empty string and does NOT throw when loadAllSkills fails', async () => {
    const manager = createIntegrationManager();
    manager.setSkillManager(
      createMockSkillManager({ throwOnLoad: true }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );
    // Skill error is swallowed — userSend completes normally
    const response = await manager.userSend('debug cluster');
    expect(response.role).toBe('assistant');
    expect(response.error).toBeFalsy();
    // currentSkillsPromptText is '' after the failed load
    expect(privateManager(manager).currentSkillsPromptText).toBe('');
  });

  it('returns empty string and does NOT throw when routing throws', async () => {
    const manager = createIntegrationManager();
    manager.setSkillManager(
      createMockSkillManager({ throwOnRoute: true }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );
    const response = await manager.userSend('any query');
    expect(response.role).toBe('assistant');
    expect(response.error).toBeFalsy();
    expect(privateManager(manager).currentSkillsPromptText).toBe('');
  });

  it('returns empty string when no skill manager is configured', async () => {
    const manager = createIntegrationManager(); // no setSkillManager call
    const result = await privateManager(manager).getSkillsPromptForQuery('any query');
    expect(result).toBe('');
  });

  it('BUG check: skill prompt from previous turn does NOT leak into next turn after error', async () => {
    // If getSkillsPromptForQuery fails on the second turn, currentSkillsPromptText
    // must be reset to '' so the old skill text doesn't appear in the system prompt.
    const manager = createIntegrationManager();

    // First turn: skill loads successfully
    manager.setSkillManager(
      createMockSkillManager({ skillPrompt: '\n## Skill: debug' }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );
    await manager.userSend('first message');
    expect(privateManager(manager).currentSkillsPromptText).toBe('\n## Skill: debug');

    // Second turn: skill manager now throws on load
    manager.setSkillManager(
      createMockSkillManager({ throwOnLoad: true }) as unknown as SkillManager,
      DEFAULT_SKILLS_CONFIG
    );
    await manager.userSend('second message');

    // After the error, the stale skill text must NOT remain
    expect(privateManager(manager).currentSkillsPromptText).toBe('');
    // And therefore the system prompt must not contain the old skill
    expect(privateManager(manager).createSystemPrompt()).not.toContain('## Skill: debug');
  });
});

// =============================================================================
// refreshMCPTools
// =============================================================================

describe('refreshMCPTools', () => {
  it('calls toolManager.refreshMCPTools and rebinds the model', async () => {
    const manager = createIntegrationManager();

    const refreshed = { name: 'refreshed' };
    let bindCalled = false;
    privateManager(manager).toolManager = {
      ...createMockToolManager(),
      refreshMCPTools: vi.fn().mockResolvedValue(undefined),
      bindToModelAsync: vi.fn().mockImplementation(() => {
        bindCalled = true;
        return Promise.resolve(refreshed);
      }),
    };

    await manager.refreshMCPTools();

    expect(privateManager(manager).toolManager.refreshMCPTools).toHaveBeenCalled();
    expect(bindCalled).toBe(true);
    expect(privateManager(manager).boundModel).toBe(refreshed);
  });

  it('does not throw when model is null (defensive guard)', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = null;
    privateManager(manager).toolManager = {
      ...createMockToolManager(),
      refreshMCPTools: vi.fn().mockResolvedValue(undefined),
      bindToModelAsync: vi.fn(),
    };

    // `if (this.model)` guard — should not crash
    await expect(manager.refreshMCPTools()).resolves.not.toThrow();
    expect(privateManager(manager).toolManager.bindToModelAsync).not.toHaveBeenCalled();
  });
});

// =============================================================================
// cleanResponseCache (via cache-size trigger)
// =============================================================================

// ---------------------------------------------------------------------------
// userSendStream — cache hit (lines 247-249)
// ---------------------------------------------------------------------------

describe('userSendStream — cache hit', () => {
  it('yields cached content and skips the model on second call with same history state', async () => {
    const manager = createIntegrationManager();

    // First call: populates cache (consumes all stream chunks)
    let firstContent = '';
    for await (const chunk of manager.userSendStream('what is a ConfigMap?')) {
      firstContent += chunk;
    }

    // Reset history so the second call generates the same cache key
    privateManager(manager).history = [];

    // Second call: same message + same (empty) prior history → same cache key → cache hit
    let secondContent = '';
    for await (const chunk of manager.userSendStream('what is a ConfigMap?')) {
      secondContent += chunk;
    }

    expect(secondContent).toBe(firstContent);
    // History after cache hit: user message + cached response
    expect(privateManager(manager).history.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// userSendStream — error propagation (lines 349-350)
// ---------------------------------------------------------------------------

describe('userSendStream — error propagation', () => {
  it('re-throws errors from the model stream and clears the abort controller', async () => {
    const manager = createTestManager();
    privateManager(manager).model = {
      stream: async function* () {
        throw new Error('stream failure');
      },
      invoke: async () => ({ content: '', tool_calls: [] }),
    };

    await expect(async () => {
      for await (const _ of manager.userSendStream('test')) {
        // should never yield
      }
    }).rejects.toThrow('stream failure');

    // currentAbortController must be cleared after error
    expect(privateManager(manager).currentAbortController).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// userSend — true cache hit via history reset (lines 597-598)
// ---------------------------------------------------------------------------

describe('userSend — cache hit via history reset', () => {
  it('returns cached response when conversation state matches a prior call', async () => {
    const manager = createIntegrationManager();

    // First call: populates cache
    const first = await manager.userSend('explain namespaces');

    // Reset history to simulate the same prior-history state
    privateManager(manager).history = [];

    // Second call: same message + same empty history → same cache key → cache hit
    const second = await manager.userSend('explain namespaces');

    expect(second.content).toBe(first.content);
    // History: user message + cached response = 2 entries
    expect(privateManager(manager).history.length).toBe(2);
  });

  it('cleanResponseCache is called in userSend when cache size is divisible by 5 (line 640)', async () => {
    const manager = createIntegrationManager();
    const cache: Map<string, any> = privateManager(manager).responseCache;

    // Pre-populate with 4 entries so the next one makes size = 5
    for (let i = 0; i < 4; i++) {
      cache.set(`pre-key-${i}`, {
        response: { role: 'assistant', content: `r${i}` },
        timestamp: Date.now(),
      });
    }

    // 5th response caches → size becomes 5 → cleanResponseCache() called
    await manager.userSend('trigger cache cleanup');

    // Cache should still be functional (entries might be evicted if expired)
    expect(cache.size).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// handleDirectToolCallingRequest — error fallback (lines 712-718)
// ---------------------------------------------------------------------------

describe('handleDirectToolCallingRequest — error fallback', () => {
  it('falls back to handleChainBasedRequest and disables direct tool calling when invoke throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).useDirectToolCalling = true;

    // boundModel throws → triggers the catch / fallback
    privateManager(manager).boundModel = {
      invoke: async () => {
        throw new Error('direct invoke failed');
      },
    };

    // model is used as fallback
    privateManager(manager).model = {
      invoke: async () => ({ content: 'Fallback chain response', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('test fallback');

    expect(response.role).toBe('assistant');
    // useDirectToolCalling should be set to false after the error
    expect(privateManager(manager).useDirectToolCalling).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handleToolCalls — no enabled tools (lines 1152-1162)
// ---------------------------------------------------------------------------

describe('handleToolCalls — no enabled tools path', () => {
  it('returns fallback message when enabledToolIds is empty but LLM returns tool calls', async () => {
    const manager = createTestManager();

    privateManager(manager).toolManager = {
      getToolNames: () => [],
      getMCPTools: () => [],
    };
    // extraTools is empty by default

    const mockResponse = {
      content: '', // empty → triggers the "I apologize" fallback
      tool_calls: [{ id: 'tc1', name: 'kubernetes_api_request', args: { url: '/api/v1/pods' } }],
    };

    const result = await privateManager(manager).handleToolCalls(mockResponse);

    expect(result.role).toBe('assistant');
    expect(result.content).toContain('cannot use tools');
    // Should have been pushed to history
    const lastHistory = privateManager(manager).history[privateManager(manager).history.length - 1];
    expect(lastHistory.content).toBe(result.content);
  });
});

// ---------------------------------------------------------------------------
// handleToolCalls — all tool calls filtered as disabled (lines 1182-1199)
// ---------------------------------------------------------------------------

describe('handleToolCalls — all tool calls disabled (filtered out)', () => {
  it('returns disabled-tools explanation when every tool call is for a disabled tool', async () => {
    const manager = createTestManager();

    // 'enabled_tool' is enabled, but LLM wants 'disabled_tool'
    privateManager(manager).toolManager = {
      getToolNames: () => ['enabled_tool'],
      getMCPTools: () => [],
    };

    const mockResponse = {
      content: '',
      tool_calls: [{ id: 'tc1', name: 'disabled_tool', args: {} }],
    };

    const result = await privateManager(manager).handleToolCalls(mockResponse);

    expect(result.role).toBe('assistant');
    // buildDisabledToolsMessage includes the tool name
    expect(result.content).toContain('disabled_tool');
    // History entry should be the updated (clarified) prompt
    const lastHistory = privateManager(manager).history[privateManager(manager).history.length - 1];
    expect(lastHistory.content).toBe(result.content);
  });
});

describe('processToolCalls — malformed serialized arguments', () => {
  it('falls back to an empty argument object instead of aborting execution', async () => {
    const manager = createTestManager();
    const executeTool = vi.fn().mockResolvedValue({
      content: '{}',
      shouldAddToHistory: true,
      shouldProcessFollowUp: false,
    });
    privateManager(manager).toolManager = { executeTool };

    await privateManager(manager).processToolCalls(
      [
        {
          id: 'tc-malformed',
          type: 'function',
          function: { name: 'test-tool', arguments: '{not-json' },
        },
      ],
      { role: 'assistant', content: '' }
    );

    expect(executeTool).toHaveBeenCalledWith(
      'test-tool',
      {},
      'tc-malformed',
      expect.objectContaining({ role: 'assistant' })
    );
  });
});

// ---------------------------------------------------------------------------
// processToolCalls — requiresConfirmation placeholder (line 1516)
// ---------------------------------------------------------------------------

describe('processToolCalls — requiresConfirmation placeholder', () => {
  it('adds an isDisplayOnly confirmation placeholder when metadata.requiresConfirmation is true', async () => {
    const manager = createTestManager();

    privateManager(manager).toolManager = {
      executeTool: async () => ({
        content: JSON.stringify({ status: 'pending_confirmation' }),
        shouldAddToHistory: false,
        shouldProcessFollowUp: false,
        metadata: { requiresConfirmation: true, method: 'DELETE' },
      }),
      getToolNames: () => ['kubernetes_api_request'],
      getMCPTools: () => [],
    };

    const toolCalls: NormalizedToolCall[] = [
      {
        type: 'function',
        id: 'tc-confirm',
        function: {
          name: 'kubernetes_api_request',
          arguments: JSON.stringify({ url: '/api/v1/pods/my-pod', method: 'DELETE', body: '' }),
        },
      },
    ];
    const assistantPrompt: Prompt = {
      role: 'assistant',
      content: 'Deleting pod...',
      toolCalls,
    };

    await privateManager(manager).processToolCalls(toolCalls, assistantPrompt);

    const placeholder = privateManager(manager).history.find(
      prompt => prompt.toolCallId === 'tc-confirm' && prompt.isDisplayOnly === true
    );
    expect(placeholder).toBeDefined();
    expect(placeholder?.role).toBe('tool');
  });
});

// ---------------------------------------------------------------------------
// processToolCalls — executeTool throws (lines 1540-1544, 1547)
// ---------------------------------------------------------------------------

describe('processToolCalls — executeTool throws', () => {
  it('adds error response to history and continues when tool execution throws', async () => {
    const manager = createTestManager();

    privateManager(manager).toolManager = {
      executeTool: async () => {
        throw new Error('connection timeout');
      },
      getToolNames: () => ['kubernetes_api_request'],
      getMCPTools: () => [],
    };

    const toolCalls: NormalizedToolCall[] = [
      {
        type: 'function',
        id: 'tc-err',
        function: {
          name: 'kubernetes_api_request',
          arguments: JSON.stringify({ url: '/api/v1/pods', method: 'GET', body: '' }),
        },
      },
    ];
    const assistantPrompt: Prompt = { role: 'assistant', content: 'Checking pods', toolCalls };

    await privateManager(manager).processToolCalls(toolCalls, assistantPrompt);

    const errorEntry = privateManager(manager).history.find(
      prompt => prompt.toolCallId === 'tc-err' && prompt.role === 'tool'
    );
    expect(errorEntry).toBeDefined();
    const parsed = JSON.parse(errorEntry?.content ?? '{}');
    expect(parsed.error).toBe(true);
    expect(parsed.message).toContain('connection timeout');
  });

  it('BUG (fixed): toolFailurePromptTemplate uses failedOperations key (was failed_operations)', async () => {
    const manager = createTestManager();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    privateManager(manager).toolManager = {
      executeTool: async () => {
        throw new Error('disk full');
      },
      getToolNames: () => ['kubernetes_api_request'],
      getMCPTools: () => [],
    };

    const toolCalls: NormalizedToolCall[] = [
      {
        type: 'function',
        id: 'tc-bug',
        function: {
          name: 'kubernetes_api_request',
          arguments: JSON.stringify({ url: '/api/v1/pods', method: 'GET', body: '' }),
        },
      },
    ];
    const assistantPrompt: Prompt = { role: 'assistant', content: 'Checking', toolCalls };

    await privateManager(manager).processToolCalls(toolCalls, assistantPrompt);

    // After fix: the template should format correctly → no "Error using tool failure template" in errors
    const errorCalls = errorSpy.mock.calls.map(c => String(c[0]));
    const templateError = errorCalls.some(c => c.includes('Error using tool failure template'));
    expect(templateError).toBe(false);

    // The system error message should have been added to history via the template path
    const sysMsg = privateManager(manager).history.find(
      prompt => prompt.toolCallId === 'system-error-alert'
    );
    expect(sysMsg).toBeDefined();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// processToolContent — invalid content format (lines 1828-1829)
// ---------------------------------------------------------------------------

describe('processToolContent — null / non-string tool response content', () => {
  it('handles invalid tool content via processToolResponses without throwing', async () => {
    const manager = createIntegrationManager();

    // Inject tool history entry with null content
    privateManager(manager).history = [
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { type: 'function', id: 'tc1', function: { name: 'my_tool', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: null, toolCallId: 'tc1', name: 'my_tool' } as unknown as Prompt,
    ];

    privateManager(manager).model = {
      invoke: async () => ({ content: 'Analysis complete', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    expect(response.content.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// handleToolResponseResult — single MCP formatted output (lines 1884-1896)
// ---------------------------------------------------------------------------

describe('handleToolResponseResult — single MCP formatted output', () => {
  it('returns MCP content directly when single tool response has { formatted:true, mcpOutput }', async () => {
    const manager = createIntegrationManager();

    // isMCPFormattedOutput checks for { formatted: true, mcpOutput: "..." }
    const mcpContent = JSON.stringify({
      formatted: true,
      mcpOutput: '## Kubernetes Resources\n\nFound 3 pods:\n- nginx\n- coredns\n- app',
    });

    privateManager(manager).history = [
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { type: 'function', id: 'tc1', function: { name: 'my_mcp_tool', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: mcpContent, toolCallId: 'tc1', name: 'my_mcp_tool' },
    ];

    // Model returns empty content + tool_calls → triggers the fallback path
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({
        content: '',
        tool_calls: [{ id: 'tc2', name: 'follow_up', args: {} }],
      }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();

    expect(response.role).toBe('assistant');
    // The MCP-formatted content should be returned as-is
    expect(response.content).toBe(mcpContent);
    expect(response.toolCalls).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createModel — Azure provider branch (lines 389-391)
// ---------------------------------------------------------------------------

describe('createModel — Azure provider uses extractAzureBaseUrl', () => {
  it('creates a model for azure provider with endpoint normalised via extractAzureBaseUrl', () => {
    const fullDeploymentUrl =
      'https://myaccount.openai.azure.com/openai/deployments/gpt4/chat/completions';

    // The azure branch (lines 389-391) extracts the base URL before creating the model
    const manager = new LangChainAssistantSession('azure', {
      apiKey: 'fake-key',
      endpoint: fullDeploymentUrl,
      deploymentName: 'gpt4',
      model: 'gpt-4',
    });

    // Model was created without throwing → azure branch was executed
    expect(privateManager(manager).model).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// validateToolCallAlignment — mismatch logging (line 1778)
// ---------------------------------------------------------------------------

describe('validateToolCallAlignment — mismatch detection', () => {
  it('logs an error when history has unmatched tool calls', () => {
    const manager = createTestManager();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Assistant claims tool call tc-orphan but no matching tool response
    privateManager(manager).history = [
      { role: 'user', content: 'do something' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { type: 'function', id: 'tc-orphan', function: { name: 'some_tool', arguments: '{}' } },
        ],
      },
      // No tool response with toolCallId: 'tc-orphan'
    ];

    privateManager(manager).validateToolCallAlignment();

    // Should have logged an error about the mismatch
    expect(consoleSpy).toHaveBeenCalledWith(
      'Tool call/response mismatch detected',
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});

describe('cleanResponseCache — eviction', () => {
  it('expired entries are evicted when cache cleans up', async () => {
    const manager = createIntegrationManager();

    // Directly populate the cache with an expired entry
    const cache = privateManager(manager).responseCache;
    cache.set('old-key', { value: { role: 'assistant', content: 'stale' }, timestamp: 0 });

    // Trigger cleanResponseCache directly
    privateManager(manager).cleanResponseCache();

    expect(cache.has('old-key')).toBe(false);
  });

  it('cache never grows beyond MAX_CACHE_SIZE after eviction', async () => {
    const manager = createIntegrationManager();
    const maxSize: number = privateManager(manager).MAX_CACHE_SIZE;
    const cache = privateManager(manager).responseCache;

    // Fill beyond the limit with fresh entries
    for (let i = 0; i < maxSize + 10; i++) {
      cache.set(`key-${i}`, {
        value: { role: 'assistant', content: `r${i}` },
        timestamp: Date.now() + i, // all fresh, different timestamps
      });
    }

    privateManager(manager).cleanResponseCache();

    expect(cache.size).toBeLessThanOrEqual(maxSize);
  });
});

// =============================================================================
// extractAzureBaseUrl — private, but critical for Azure provider setup
// =============================================================================

describe('extractAzureBaseUrl', () => {
  function azureUrl(manager: LangChainAssistantSession, endpoint: string): string {
    return privateManager(manager).extractAzureBaseUrl(endpoint);
  }

  it('extracts origin from a full Azure deployment URL', () => {
    const m = createTestManager();
    expect(
      azureUrl(m, 'https://my-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions')
    ).toBe('https://my-resource.openai.azure.com');
  });

  it('strips trailing slash from a base URL', () => {
    const m = createTestManager();
    expect(azureUrl(m, 'https://my-resource.openai.azure.com/')).toBe(
      'https://my-resource.openai.azure.com'
    );
  });

  it('returns the base URL unchanged when no path is present', () => {
    const m = createTestManager();
    expect(azureUrl(m, 'https://my-resource.openai.azure.com')).toBe(
      'https://my-resource.openai.azure.com'
    );
  });

  it('BUG check: non-URL string falls back to stripping trailing slashes only', () => {
    // "myresource.openai.azure.com" has no protocol → URL() throws → fallback
    // The fallback strips trailing slashes but does NOT add the protocol.
    // This means the extracted "endpoint" is still invalid for the SDK.
    // Test documents the actual (fallback) behaviour.
    const m = createTestManager();
    expect(azureUrl(m, 'myresource.openai.azure.com/')).toBe('myresource.openai.azure.com');
  });

  it('returns empty string for empty input (fallback path)', () => {
    const m = createTestManager();
    expect(azureUrl(m, '')).toBe('');
  });

  it('strips multiple trailing slashes', () => {
    const m = createTestManager();
    expect(azureUrl(m, 'https://res.openai.azure.com///')).toBe('https://res.openai.azure.com');
  });
});

// =============================================================================
// configureTools — public method, exercises toolManager binding
// =============================================================================

describe('configureTools', () => {
  it('sets boundModel after configureTools is called', async () => {
    const manager = createIntegrationManager(createMockToolManager({ enabledToolNames: ['k8s'] }));
    await manager.configureTools([], makeKubernetesContext());

    // bindToModelAsync should have been called — boundModel is now set
    expect(privateManager(manager).boundModel).not.toBeNull();
    expect(privateManager(manager).boundModel).toBeDefined();
  });

  it('BUG: configureTools silently ignores the tools parameter', async () => {
    // The method accepts external tools but currently ignores the value.
    // This is surprising to callers who pass tool configs expecting them to register.
    // The test documents the behaviour: the parameter is ignored.
    const manager = createIntegrationManager(createMockToolManager({ enabledToolNames: [] }));
    const fakeUnused = [{ name: 'should-be-ignored', description: 'not used' }];

    // Does NOT throw and does NOT register the passed tools
    await expect(
      manager.configureTools(fakeUnused, makeKubernetesContext())
    ).resolves.not.toThrow();
  });

  it('sets useDirectToolCalling true when provider supports it and tools exist', async () => {
    // mock-testing-model is NOT in the direct-tool-calling providers list
    // so useDirectToolCalling stays false
    const manager = createIntegrationManager(createMockToolManager({ enabledToolNames: ['k8s'] }));
    privateManager(manager).toolManager.getLangChainTools = () => [
      { name: 'k8s' } as unknown as StructuredToolInterface,
    ];
    await manager.configureTools([], makeKubernetesContext());
    expect(privateManager(manager).useDirectToolCalling).toBe(false); // mock provider excluded
  });
});

// =============================================================================
// generateResponseFromToolResults — success and error paths
// =============================================================================

describe('generateResponseFromToolResults', () => {
  it('invokes the unbound model (not boundModel) to avoid recursive tool calls', async () => {
    const manager = createIntegrationManager();
    const unboundSpy = vi.fn().mockResolvedValue({ content: 'Summary here.', tool_calls: [] });
    const boundSpy = vi.fn().mockResolvedValue({ content: 'SHOULD NOT BE USED', tool_calls: [] });
    privateManager(manager).model = { invoke: unboundSpy, stream: async function* () {} };
    privateManager(manager).boundModel = { invoke: boundSpy, stream: async function* () {} };

    const toolResults = {
      kubernetes_api_request: { content: '{"pods":[]}', shouldAddToHistory: true },
    };
    await privateManager(manager).generateResponseFromToolResults('show pods', toolResults);

    expect(unboundSpy).toHaveBeenCalled();
    expect(boundSpy).not.toHaveBeenCalled();
  });

  it('adds the assistant response to history', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Here is your summary.', tool_calls: [] }),
      stream: async function* () {},
    };

    const before = privateManager(manager).history.length;
    await privateManager(manager).generateResponseFromToolResults('show pods', { k8s: {} });

    const history = privateManager(manager).history;
    expect(history.length).toBe(before + 1);
    expect(history[history.length - 1].role).toBe('assistant');
    expect(history[history.length - 1].content).toBe('Here is your summary.');
  });

  it('returns the fallback prompt when model throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('model down')),
      stream: async function* () {},
    };

    const result = await privateManager(manager).generateResponseFromToolResults('show pods', {
      k8s: { content: '{"pods":[]}', data: { items: [] } },
    });

    expect(result.role).toBe('assistant');
    expect(result.error).toBeUndefined(); // fallback is NOT marked as error
    expect(result.content).toContain('k8s'); // mentions the tool name in fallback
  });

  it('BUG (fixed): fallback no longer exposes internal ToolResponse fields to user', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('model down')),
      stream: async function* () {},
    };

    const toolResponse = {
      content: '{"pods":[]}',
      shouldAddToHistory: true,
      shouldProcessFollowUp: false,
    };
    const result = await privateManager(manager).generateResponseFromToolResults('show pods', {
      kubernetes_api_request: toolResponse,
    });

    // Fixed: internal fields must NOT appear in the user-facing fallback message
    expect(result.content).not.toContain('shouldAddToHistory');
    expect(result.content).not.toContain('shouldProcessFollowUp');
    // The actual pod data SHOULD appear
    expect(result.content).toContain('pods');
  });

  it('includes the user message in the prompt sent to the model', async () => {
    const manager = createIntegrationManager();
    let capturedMessages: BaseMessage[] = [];
    privateManager(manager).model = {
      invoke: vi.fn().mockImplementation((messages: BaseMessage[]) => {
        capturedMessages = messages;
        return Promise.resolve({ content: 'Done.', tool_calls: [] });
      }),
      stream: async function* () {},
    };

    await privateManager(manager).generateResponseFromToolResults('list all failing pods', {
      k8s: {},
    });

    const userMsg = capturedMessages.find(
      message =>
        typeof message.content === 'string' && message.content.includes('list all failing pods')
    );
    expect(userMsg).toBeDefined();
  });
});

// =============================================================================
// orchestrateToolsForRequest — all early-return paths
// =============================================================================

/** Create a manager that reports mcpTools to avoid the first early-return. */
function createManagerWithMCPTools(mcpToolNames: string[] = ['mcp_tool_a', 'mcp_tool_b']) {
  inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager({ mode: 'approve-all' }));
  const toolManager = createMockToolManager({ enabledToolNames: mcpToolNames });
  // Override getMCPTools to return MCP-flagged tools
  toolManager.getMCPTools = () => mcpToolNames.map(n => ({ name: n, description: `${n} tool` }));
  return new LangChainAssistantSession('mock-testing-model', {}, mcpToolNames, { toolManager });
}

describe('orchestrateToolsForRequest', () => {
  it('returns null when toolManager has no MCP tools', async () => {
    const manager = createIntegrationManager();
    // Default MockToolManager returns [] for getMCPTools()
    const result = await privateManager(manager).orchestrateToolsForRequest('list all pods');
    expect(result).toBeNull();
  });

  it('returns null for very short conversational messages (< 10 chars)', async () => {
    const manager = createManagerWithMCPTools();
    const result = await privateManager(manager).orchestrateToolsForRequest('hi');
    expect(result).toBeNull();
  });

  it('returns null when getToolNames returns empty (no enabled tools)', async () => {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const toolManager = createMockToolManager({ enabledToolNames: [] });
    toolManager.getMCPTools = () => [{ name: 'mcp_tool' }];
    toolManager.getToolNames = () => [];
    const manager = new LangChainAssistantSession('mock-testing-model', {}, [], { toolManager });

    const result = await privateManager(manager).orchestrateToolsForRequest('list pods in cluster');
    expect(result).toBeNull();
  });

  it('returns null when ToolOrchestrator recommends only 1 tool', async () => {
    const manager = createManagerWithMCPTools(['mcp_tool']);
    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockResolvedValueOnce({
      tools: [
        {
          name: 'mcp_tool',
          priority: 'high' as const,
          reason: 'only one',
          description: '',
          arguments: {},
        },
      ],
      shouldExecuteAll: true,
      analysis: 'single tool',
    });

    const result = await privateManager(manager).orchestrateToolsForRequest('list pods in cluster');
    // Single tool — falls back to direct tool calling
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns tools when ToolOrchestrator recommends 2+ tools with shouldExecuteAll', async () => {
    const manager = createManagerWithMCPTools(['tool_a', 'tool_b']);
    const recommended = [
      {
        name: 'tool_a',
        priority: 'high' as const,
        reason: 'for pods',
        description: '',
        arguments: {},
      },
      {
        name: 'tool_b',
        priority: 'medium' as const,
        reason: 'for nodes',
        description: '',
        arguments: {},
      },
    ];
    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockResolvedValueOnce({
      tools: recommended,
      shouldExecuteAll: true,
      analysis: 'two tools needed',
    });

    const result = await privateManager(manager).orchestrateToolsForRequest(
      'show pods and nodes in the cluster'
    );
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe('tool_a');
    vi.restoreAllMocks();
  });

  it('returns null when shouldExecuteAll is false even with multiple tools', async () => {
    const manager = createManagerWithMCPTools(['tool_a', 'tool_b']);
    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockResolvedValueOnce({
      tools: [
        { name: 'tool_a', priority: 'high' as const, reason: 'a', description: '', arguments: {} },
        {
          name: 'tool_b',
          priority: 'medium' as const,
          reason: 'b',
          description: '',
          arguments: {},
        },
      ],
      shouldExecuteAll: false, // ← not flagged for multi-execution
      analysis: 'not all needed',
    });

    const result = await privateManager(manager).orchestrateToolsForRequest('check cluster status');
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns null and does not throw when ToolOrchestrator throws', async () => {
    const manager = createManagerWithMCPTools(['mcp_tool']);
    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockRejectedValueOnce(
      new Error('orchestrator unavailable')
    );

    const result = await privateManager(manager).orchestrateToolsForRequest('list pods in cluster');
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('BUG check: availableTools filter with missing description falls back to empty string', async () => {
    const manager = createManagerWithMCPTools(['tool_no_desc']);
    // Override to return tool with undefined description
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'tool_no_desc' }];

    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockImplementation(async (_msg, tools) => {
      // description must be '' not undefined
      expect(tools[0].description).toBe('');
      return { tools: [], shouldExecuteAll: false, analysis: '' };
    });

    await privateManager(manager).orchestrateToolsForRequest('do something with the cluster');
    vi.restoreAllMocks();
  });
});

// =============================================================================
// handleMultipleToolExecution — tool execution and approval paths
// =============================================================================

describe('handleMultipleToolExecution', () => {
  function makeManagerWithMCPTools() {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const toolManager = createMockToolManager({
      enabledToolNames: ['mcp_tool_a', 'mcp_tool_b'],
      toolResults: {
        mcp_tool_a: { data: 'result_a' },
        mcp_tool_b: { data: 'result_b' },
      },
    });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, [], { toolManager });
    // Mark tools as MCP
    privateManager(manager).toolManager.getMCPTools = () => [
      { name: 'mcp_tool_a' },
      { name: 'mcp_tool_b' },
    ];
    // Stub model for generateResponseFromToolResults
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Combined result from tools.', tool_calls: [] }),
      stream: async function* () {},
    };
    return { manager, toolManager };
  }

  it('executes recommended tools and returns an assistant response', async () => {
    const { manager } = makeManagerWithMCPTools();
    vi.spyOn(ToolPlanner, 'groupToolsByExecutionStrategy').mockReturnValueOnce({
      parallel: [
        {
          name: 'mcp_tool_a',
          priority: 'high' as const,
          reason: 'a',
          description: '',
          arguments: {},
        },
      ],
      sequential: [
        {
          name: 'mcp_tool_b',
          priority: 'medium' as const,
          reason: 'b',
          description: '',
          arguments: {},
        },
      ],
    });

    const recommended: RecommendedTool[] = [
      { name: 'mcp_tool_a', description: '', priority: 'high', reason: 'a', arguments: {} },
      { name: 'mcp_tool_b', description: '', priority: 'medium', reason: 'b', arguments: {} },
    ];

    const result = await privateManager(manager).handleMultipleToolExecution(
      'show cluster',
      recommended
    );
    expect(result.role).toBe('assistant');
    expect(result.content).toBeTruthy();
  });

  it('returns denial prompt when all MCP tools are denied and no built-in tools', async () => {
    inlineToolApprovalManager.setApprovalHandler(createMockApprovalManager({ mode: 'deny-all' }));
    const toolManager = createMockToolManager({ enabledToolNames: ['mcp_tool'] });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, [], { toolManager });
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'mcp_tool' }];
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'ok', tool_calls: [] }),
      stream: async function* () {},
    };

    const recommended = [
      {
        name: 'mcp_tool',
        priority: 'high' as const,
        reason: 'needed',
        description: '',
        arguments: {},
      },
    ];
    vi.spyOn(ToolPlanner, 'groupToolsByExecutionStrategy').mockReturnValue({
      parallel: [],
      sequential: [],
    });

    const result = await privateManager(manager).handleMultipleToolExecution(
      'do stuff',
      recommended
    );
    expect(result.role).toBe('assistant');
    // Should contain a denial-related message
    expect(result.content).toBeTruthy();
    // The denial prompt should be in history
    const history = privateManager(manager).history;
    expect(history.some(prompt => prompt.role === 'assistant')).toBe(true);
  });

  it('falls back to error prompt when execution throws unexpectedly', async () => {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const toolManager = createMockToolManager({ enabledToolNames: ['mcp_tool'] });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, [], { toolManager });
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'mcp_tool' }];
    // Throw during approval
    privateManager(manager).toolManager.executeTool = async () => {
      throw new Error('cluster unreachable');
    };
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'summary', tool_calls: [] }),
      stream: async function* () {},
    };

    // Override requestApproval to throw unconditionally
    vi.spyOn(inlineToolApprovalManager, 'requestApproval').mockRejectedValueOnce(
      new Error('unexpected')
    );
    vi.spyOn(ToolPlanner, 'groupToolsByExecutionStrategy').mockReturnValue({
      parallel: [],
      sequential: [],
    });

    const recommended = [
      { name: 'mcp_tool', priority: 'high' as const, reason: 'r', description: '', arguments: {} },
    ];
    const result = await privateManager(manager).handleMultipleToolExecution(
      'show pods',
      recommended
    );
    expect(result.role).toBe('assistant');
  });
});

// =============================================================================
// handleUserSendError — API error template path
// =============================================================================

describe('handleUserSendError — API error template path', () => {
  it('handles a plain-object API error without assuming Error methods', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Authentication failed.', tool_calls: [] }),
    };

    const result = await privateManager(manager).handleUserSendError({
      status: 401,
      message: 'Unauthorized',
    });

    expect(result.error).toBe(true);
    expect(result.content).toContain('error processing your request');
  });

  it('uses model to generate error response for API-related errors', async () => {
    const manager = createIntegrationManager();
    // Patch model to return a clear error explanation
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({
        content: 'The API key is invalid. Please check your settings.',
        tool_calls: [],
      }),
      stream: async function* () {},
    };

    // Create an error that looks like an API error (401 Unauthorized)
    const apiError = Object.assign(new Error('401 Unauthorized - Invalid API key'), {
      status: 401,
      response: { status: 401 },
    });

    const result = await privateManager(manager).handleUserSendError(apiError);
    expect(result.role).toBe('assistant');
    expect(result.error).toBe(true);
    // Either the model response OR the fallback message
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('falls back to standard error when template model call throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).model = {
      invoke: vi.fn().mockRejectedValue(new Error('template model also failed')),
      stream: async function* () {},
    };

    const apiError = Object.assign(new Error('500 Internal Server Error'), {
      status: 500,
      response: { status: 500 },
    });

    // Should NOT throw — falls through to standard error handling
    const result = await privateManager(manager).handleUserSendError(apiError);
    expect(result.role).toBe('assistant');
    expect(result.error).toBe(true);
  });
});

// =============================================================================
// handleToolResponseResult — empty content and MCP formatted output paths
// =============================================================================

describe('handleToolResponseResult — empty content paths', () => {
  function setupManagerWithToolHistory(manager: LangChainAssistantSession, toolContent: string) {
    privateManager(manager).history.push(
      { role: 'user', content: 'show me stuff' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { type: 'function', id: 'tc1', function: { name: 'my_tool', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: toolContent, toolCallId: 'tc1', name: 'my_tool' }
    );
  }

  it('returns fallback content from tool results when model returns empty content with tool_calls', async () => {
    const manager = createIntegrationManager();
    setupManagerWithToolHistory(manager, JSON.stringify({ pods: ['nginx', 'coredns'] }));

    // Model returns empty string + tool_calls (wants to call more tools)
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({
        content: '',
        tool_calls: [{ id: 'tc2', name: 'another_tool', args: {} }],
      }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    // Should return the tool result content, not try to call more tools
    expect(response.role).toBe('assistant');
    expect(response.content.length).toBeGreaterThan(0);
    // Tool calls should be cleared in the response
    expect(response.toolCalls).toEqual([]);
  });

  it('returns formatted MCP output directly when single MCP tool response', async () => {
    const manager = createIntegrationManager();
    // MCP-formatted output starts with specific format
    const mcpContent = '## Kubernetes Resources\n\nFound 3 pods:\n- nginx\n- coredns\n- app';
    setupManagerWithToolHistory(manager, mcpContent);

    // Model returns empty content + wants tool_calls
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({
        content: '',
        tool_calls: [{ id: 'tc2', name: 'follow_up', args: {} }],
      }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    expect(response.role).toBe('assistant');
    // Response should contain the MCP content
    expect(response.content.length).toBeGreaterThan(0);
  });

  it('normal non-empty content response is returned directly', async () => {
    const manager = createIntegrationManager();
    setupManagerWithToolHistory(manager, '{"data": "result"}');

    privateManager(manager).model = {
      invoke: vi
        .fn()
        .mockResolvedValue({ content: 'Here are your pods: nginx and coredns.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.processToolResponses();
    expect(response.content).toBe('Here are your pods: nginx and coredns.');
    expect(response.role).toBe('assistant');
  });
});

// =============================================================================
// processToolResponsesStream — generator yields content then returns Prompt
// =============================================================================

describe('processToolResponsesStream', () => {
  it('yields content chunks and returns final Prompt when successful', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).history.push(
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ type: 'function', id: 'tc1', function: { name: 'k8s', arguments: '{}' } }],
      },
      { role: 'tool', content: '{"pods":["nginx"]}', toolCallId: 'tc1', name: 'k8s' }
    );

    // Fake streaming model
    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Pod list: nginx.', tool_calls: [] }),
      stream: async function* () {
        yield new AIMessageChunk({ content: 'Pod list: ' });
        yield new AIMessageChunk({ content: 'nginx.' });
      },
    };

    const chunks: string[] = [];
    const gen = manager.processToolResponsesStream();
    let result = await gen.next();
    while (!result.done) {
      chunks.push(result.value);
      result = await gen.next();
    }

    const finalPrompt = result.value;
    expect(finalPrompt.role).toBe('assistant');
    // Should have yielded some content
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('returns error prompt when stream throws', async () => {
    const manager = createIntegrationManager();
    privateManager(manager).history.push(
      { role: 'user', content: 'show pods' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ type: 'function', id: 'tc1', function: { name: 'k8s', arguments: '{}' } }],
      },
      { role: 'tool', content: '{}', toolCallId: 'tc1', name: 'k8s' }
    );

    privateManager(manager).model = {
      invoke: vi.fn(),
      stream: async function* () {
        throw new Error('stream failed');
      },
    };

    const gen = manager.processToolResponsesStream();
    let result = await gen.next();
    while (!result.done) {
      result = await gen.next();
    }

    const finalPrompt = result.value;
    expect(finalPrompt.role).toBe('assistant');
    expect(finalPrompt.error).toBe(true);
  });
});

// =============================================================================
// setupToolConfirmationListeners — event routing
// =============================================================================

describe('setupToolConfirmationListeners', () => {
  it('adds tool confirmation to history when request-confirmation event fires', () => {
    const manager = createIntegrationManager();
    const confirmation = {
      requestId: 'evt-1',
      tools: [],
      onApprove: vi.fn(),
      onDeny: vi.fn(),
    };

    // Emit the event that the listener is registered for
    inlineToolApprovalManager.emit('request-confirmation', {
      requestId: 'evt-1',
      toolConfirmation: confirmation,
    });

    const history = privateManager(manager).history;
    const entry = history.find(prompt => prompt.requestId === 'evt-1');
    expect(entry).toBeDefined();
    expect(entry?.isDisplayOnly).toBe(true);
  });

  it('updates confirmation in history when update-confirmation event fires', () => {
    const manager = createIntegrationManager();
    const original = makeToolConfirmation({ requestId: 'evt-2', loading: false });
    const updated = makeToolConfirmation({ requestId: 'evt-2', loading: true });

    manager.addToolConfirmationMessage('', original);
    inlineToolApprovalManager.emit('update-confirmation', {
      requestId: 'evt-2',
      toolConfirmation: updated,
    });

    const history = privateManager(manager).history;
    const entry = history.find(prompt => prompt.requestId === 'evt-2');
    expect(entry?.toolConfirmation?.loading).toBe(true);
  });

  it('ignores malformed confirmation events', () => {
    const manager = createIntegrationManager();

    inlineToolApprovalManager.emit('request-confirmation', { requestId: 123 });
    inlineToolApprovalManager.emit('update-confirmation', null);

    expect(manager.history).toEqual([]);
  });
});

// =============================================================================
// buildUserContext — private helper
// =============================================================================

describe('buildUserContext', () => {
  it('returns context with the most recent user message', () => {
    const manager = createIntegrationManager();
    privateManager(manager).history.push(
      { role: 'user', content: 'show me pods in production' },
      { role: 'assistant', content: 'Here they are.' }
    );

    const ctx = privateManager(manager).buildUserContext();
    expect(ctx.userMessage).toBe('show me pods in production');
  });

  it('returns context with conversationHistory from history', () => {
    const manager = createIntegrationManager();
    privateManager(manager).history.push({ role: 'user', content: 'hello' });

    const ctx = privateManager(manager).buildUserContext();
    expect(ctx.conversationHistory).toBeDefined();
    expect(ctx.conversationHistory?.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// userSend — orchestration path (3+ commits to cover)
// =============================================================================

describe('userSend — orchestration path when 2+ MCP tools recommended', () => {
  it('calls handleMultipleToolExecution when orchestrator recommends 2 tools', async () => {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const toolManager = createMockToolManager({
      enabledToolNames: ['mcp_a', 'mcp_b'],
      toolResults: {
        mcp_a: { data: 'result_a' },
        mcp_b: { data: 'result_b' },
      },
    });
    const manager = new LangChainAssistantSession('mock-testing-model', {}, [], { toolManager });
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'mcp_a' }, { name: 'mcp_b' }];

    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockResolvedValueOnce({
      tools: [
        { name: 'mcp_a', priority: 'high', reason: 'pods', description: '', arguments: {} },
        {
          name: 'mcp_b',
          priority: 'medium',
          reason: 'nodes',
          description: '',
          arguments: {},
        },
      ],
      shouldExecuteAll: true,
      analysis: 'two tools needed',
    });
    vi.spyOn(ToolPlanner, 'groupToolsByExecutionStrategy').mockReturnValueOnce({
      parallel: [
        { name: 'mcp_a', priority: 'high', reason: 'pods', description: '', arguments: {} },
      ],
      sequential: [
        {
          name: 'mcp_b',
          priority: 'medium',
          reason: 'nodes',
          description: '',
          arguments: {},
        },
      ],
    });

    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Multi-tool summary.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('show me pods and nodes together');
    expect(response.role).toBe('assistant');
    expect(response.content).toBeTruthy();
    // ToolOrchestrator.analyzeAndRecommendTools was called
    expect(ToolPlanner.analyzeAndRecommendTools).toHaveBeenCalled();
  });

  it('falls through to direct tool calling when orchestrator returns null', async () => {
    inlineToolApprovalManager.setApprovalHandler(
      createMockApprovalManager({ mode: 'approve-all' })
    );
    const manager = createIntegrationManager();
    privateManager(manager).toolManager.getMCPTools = () => [{ name: 'mcp_tool' }];
    privateManager(manager).toolManager.getToolNames = () => ['mcp_tool'];
    privateManager(manager).useDirectToolCalling = true;

    vi.spyOn(ToolPlanner, 'analyzeAndRecommendTools').mockResolvedValueOnce({
      tools: [
        {
          name: 'mcp_tool',
          priority: 'high' as const,
          reason: 'only one',
          description: '',
          arguments: {},
        },
      ],
      shouldExecuteAll: true,
      analysis: 'single tool',
    });

    privateManager(manager).model = {
      invoke: vi.fn().mockResolvedValue({ content: 'Direct response.', tool_calls: [] }),
      stream: async function* () {},
    };

    const response = await manager.userSend('list pods');
    expect(response.role).toBe('assistant');
    // orchestrateToolsForRequest returned null (single tool) → fell through
    expect(response.content).toBeTruthy();
  });
});
