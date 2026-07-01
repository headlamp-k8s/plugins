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

import { AIMessage, AIMessageChunk, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import LangChainManager from './LangChainManager';

/**
 * Construct a LangChainManager using the built-in mock-testing-model
 * so no real API keys or network access are needed.
 */
function createTestManager(): LangChainManager {
  return new LangChainManager('mock-testing-model', {});
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
    (manager as any).model = fakeModel;

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
    (manager as any).model = fakeModel;

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

    const result = await (manager as any).handleUserSendError(err);

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

    const result = await (manager as any).handleUserSendError(err);
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    // With the bug: instanceof AIMessage is true, instanceof ToolMessage is false
    expect(messages[0]).toBeInstanceOf(ToolMessage);
  });

  it('ToolMessage preserves tool_call_id', () => {
    const manager = createTestManager();
    const prompts = [{ role: 'tool', content: 'result data', toolCallId: 'call_42' }];

    const messages = (manager as any).convertPromptsToMessages(prompts);

    // With the bug: tool_call_id is lost (wrapped in string prefix)
    expect(messages[0].tool_call_id).toBe('call_42');
  });

  it('tool message content is raw, not wrapped in a prefix string', () => {
    const manager = createTestManager();
    const prompts = [{ role: 'tool', content: '{"key":"value"}', toolCallId: 'call_1' }];

    const messages = (manager as any).convertPromptsToMessages(prompts);

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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect(messages[0].tool_calls).toHaveLength(1);
    expect(messages[0].tool_calls[0]).toEqual({
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect(messages[0].tool_calls).toEqual([]);
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(1);
    expect(messages[0].tool_calls).toEqual([]);
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages).toHaveLength(2);
    // Assistant message has the tool_use
    expect(messages[0]).toBeInstanceOf(AIMessage);
    expect(messages[0].tool_calls[0].id).toBe('toolu_xyz789');
    // Tool message references same id
    expect(messages[1]).toBeInstanceOf(ToolMessage);
    expect(messages[1].tool_call_id).toBe('toolu_xyz789');
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages[0].tool_calls).toHaveLength(2);
    expect(messages[0].tool_calls[0].id).toBe('call_1');
    expect(messages[0].tool_calls[1].id).toBe('call_2');
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

    const messages = (manager as any).convertPromptsToMessages(prompts);

    expect(messages[0].tool_calls[0].args).toEqual({ key: 'value' });
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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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

    const result = (manager as any).sanitizeToolAlignment(prompts);

    // Only tc1 should remain in tool_calls
    expect(result[0].toolCalls).toHaveLength(1);
    expect(result[0].toolCalls[0].id).toBe('tc1');
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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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

    const result = (manager as any).sanitizeToolAlignment(prompts);

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
    (manager as any).currentAbortController = null;

    // Create a fake model that would normally work
    const fakeModel = {
      invoke: async () => new AIMessage('response'),
    };

    // With the bug: TypeError: Cannot read properties of null (reading 'signal')
    // After fix: completes without throwing
    const result = await (manager as any).handleLocalModelRequest('hello', fakeModel);
    expect(result.content).toBe('response');
  });

  it('handleChainBasedRequest works when currentAbortController is null', async () => {
    const manager = createTestManager();
    (manager as any).currentAbortController = null;

    // With the bug: TypeError on this.currentAbortController.signal
    // After fix: completes without throwing
    const result = await (manager as any).handleChainBasedRequest('hello', {
      invoke: async () => new AIMessage('response'),
    });
    expect(result.content).toBeTruthy();
  });

  it('handleToolEnabledRequest works when currentAbortController is null', async () => {
    const manager = createTestManager();
    (manager as any).currentAbortController = null;

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
    const result = await (manager as any).handleToolEnabledRequest(chainInput, fakeModel);
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
    (manager as any).currentAbortController = new AbortController();

    // Simulate a model where invoke() returns proper tool_calls
    // (as happens when tools are bound via bindTools and the API
    // recognizes the tool definitions).
    const fakeModel = {
      invoke: async () => copilotMergedResponse(),
    };
    (manager as any).boundModel = fakeModel;
    (manager as any).useDirectToolCalling = true;

    // Stub the tool manager to report kubernetes_api_request as enabled
    (manager as any).toolManager = {
      getToolNames: () => ['kubernetes_api_request'],
      getMCPTools: () => [],
      executeTool: async () => ({
        content: JSON.stringify({ pods: [], shouldProcessFollowUp: false }),
        shouldAddToHistory: true,
        shouldProcessFollowUp: false,
      }),
    };

    const result = await (manager as any).handleDirectToolCallingRequest(
      'are there any failing pods?'
    );

    // invoke() on bound model returns proper tool_calls
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls.length).toBeGreaterThanOrEqual(1);
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
    (manager as any).currentAbortController = new AbortController();

    // Register an extra tool
    const fakeTool = {
      name: 'kubernetes_api_request',
      invoke: async () => JSON.stringify({ items: [], shouldProcessFollowUp: false }),
    };
    (manager as any).extraTools.set('kubernetes_api_request', fakeTool);
    (manager as any).useDirectToolCalling = true;

    // Stub boundModel to return a tool call
    (manager as any).boundModel = {
      invoke: async () => copilotMergedResponse(),
    };

    // Stub toolManager with NO tools (extra tools provide them instead)
    (manager as any).toolManager = {
      getToolNames: () => [],
      getMCPTools: () => [],
    };

    const result = await (manager as any).handleDirectToolCallingRequest('list pods');

    // Tool calls should NOT be filtered out — extraTools provides the name
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls.length).toBe(1);
    expect(result.toolCalls[0].function.name).toBe('kubernetes_api_request');
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
    (manager as any).extraTools.set('kubernetes_api_request', fakeTool);

    const toolCalls = [
      {
        id: 'call_1',
        function: {
          name: 'kubernetes_api_request',
          arguments: JSON.stringify({ url: '/api/v1/pods', method: 'GET' }),
        },
      },
    ];
    const assistantPrompt = { role: 'assistant', content: 'Checking...', toolCalls };

    await (manager as any).processToolCalls(toolCalls, assistantPrompt);

    expect(toolWasCalled).toBe(true);

    // Verify tool response was added to history
    const toolResponse = (manager as any).history.find(
      (p: any) => p.role === 'tool' && p.toolCallId === 'call_1'
    );
    expect(toolResponse).toBeDefined();
    expect(toolResponse.content).toContain('PodList');
  });
});
