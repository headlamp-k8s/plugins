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

import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';
import { sanitizeToolAlignment } from '../history';
import type { ConversationMessage as Prompt } from '../types';
import { convertPromptsToMessages } from './messages';

// ---------------------------------------------------------------------------
// convertPromptsToMessages
// ---------------------------------------------------------------------------
describe('convertPromptsToMessages', () => {
  it('converts system prompts to SystemMessage', () => {
    const msgs = convertPromptsToMessages([{ role: 'system', content: 'sys' }]);
    expect(msgs[0]).toBeInstanceOf(SystemMessage);
    expect((msgs[0] as SystemMessage).content).toBe('sys');
  });

  it('converts user prompts to HumanMessage', () => {
    const msgs = convertPromptsToMessages([{ role: 'user', content: 'hi' }]);
    expect(msgs[0]).toBeInstanceOf(HumanMessage);
  });

  it('converts assistant prompts to AIMessage', () => {
    const msgs = convertPromptsToMessages([{ role: 'assistant', content: 'hello' }]);
    expect(msgs[0]).toBeInstanceOf(AIMessage);
    expect((msgs[0] as AIMessage).content).toBe('hello');
  });

  it('includes tool_calls on assistant messages when present', () => {
    const prompts: Prompt[] = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'c1',
            function: {
              name: 'kubernetes_api_request',
              arguments: JSON.stringify({ url: '/api/v1/pods', method: 'GET' }),
            },
          },
        ],
      },
    ];
    const msgs = convertPromptsToMessages(prompts);
    const msg = msgs[0] as AIMessage;
    expect(msg.tool_calls).toHaveLength(1);
    expect(msg.tool_calls![0].name).toBe('kubernetes_api_request');
    expect(msg.tool_calls![0].args).toEqual({ url: '/api/v1/pods', method: 'GET' });
  });

  it('Bug fix: malformed arguments JSON does not throw — falls back to {}', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Previously JSON.parse(malformed) would crash the entire message preparation.
    const prompts: Prompt[] = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: 'c1',
            function: { name: 'my_tool', arguments: '{invalid json}' },
          },
        ],
      },
    ];
    expect(() => convertPromptsToMessages(prompts)).not.toThrow();
    const msg = convertPromptsToMessages(prompts)[0] as AIMessage;
    expect(msg.tool_calls![0].args).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse tool call arguments for "my_tool"')
    );
  });

  it('converts tool prompts to ToolMessage', () => {
    const prompts: Prompt[] = [{ role: 'tool', content: 'result', toolCallId: 'c1' }];
    const msgs = convertPromptsToMessages(prompts);
    expect(msgs[0]).toBeInstanceOf(ToolMessage);
    expect((msgs[0] as ToolMessage).tool_call_id).toBe('c1');
  });

  it('uses empty toolCallId string when toolCallId is absent', () => {
    const prompts: Prompt[] = [{ role: 'tool', content: 'result' }];
    const msgs = convertPromptsToMessages(prompts);
    expect((msgs[0] as ToolMessage).tool_call_id).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeToolAlignment
// ---------------------------------------------------------------------------
describe('sanitizeToolAlignment', () => {
  it('passes through non-tool messages unchanged', () => {
    const prompts: Prompt[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ];
    expect(sanitizeToolAlignment(prompts)).toEqual(prompts);
  });

  it('strips tool_calls from assistant when no results follow', () => {
    const prompts: Prompt[] = [
      {
        role: 'assistant' as const,
        content: 'ok',
        toolCalls: [{ id: 'c1' }],
      },
    ];
    const result = sanitizeToolAlignment(prompts);
    expect(result[0].toolCalls).toBeUndefined();
  });

  it('keeps matched tool_calls and drops unmatched ones', () => {
    const prompts: Prompt[] = [
      {
        role: 'assistant' as const,
        content: '',
        toolCalls: [{ id: 'c1' }, { id: 'c2' }],
      },
      { role: 'tool' as const, content: 'r1', toolCallId: 'c1' },
      // c2 has no result
    ];
    const result = sanitizeToolAlignment(prompts);
    const assistant = result.find(p => p.role === 'assistant');
    expect(assistant).toMatchObject({ toolCalls: [{ id: 'c1' }] });
  });

  it('drops orphan tool-result messages (no matching assistant tool_call)', () => {
    const prompts: Prompt[] = [
      { role: 'assistant' as const, content: 'hi' }, // no toolCalls
      { role: 'tool' as const, content: 'orphan', toolCallId: 'ghost' },
    ];
    const result = sanitizeToolAlignment(prompts);
    expect(result.some(p => p.role === 'tool')).toBe(false);
  });

  it('handles multiple rounds of tool-calling correctly', () => {
    const prompts: Prompt[] = [
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'a' }] },
      { role: 'tool' as const, content: 'ra', toolCallId: 'a' },
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'b' }] },
      { role: 'tool' as const, content: 'rb', toolCallId: 'b' },
    ];
    const result = sanitizeToolAlignment(prompts);
    expect(result).toHaveLength(4);
    expect(result[0].toolCalls).toHaveLength(1);
    expect(result[2].toolCalls).toHaveLength(1);
  });
});
