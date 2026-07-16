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
import type { ConversationMessage as Prompt } from '../conversation/types';
import { buildUserContext } from './buildUserContext';

describe('buildUserContext', () => {
  it('returns empty userMessage when history has no user messages', () => {
    const ctx = buildUserContext([{ role: 'assistant', content: 'hi' }]);
    expect(ctx.userMessage).toBe('');
  });

  it('returns the most recent user message', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'latest' },
    ];
    expect(buildUserContext(history).userMessage).toBe('latest');
  });

  it('includes at most 10 messages in conversationHistory', () => {
    const history: Prompt[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: String(i),
    }));
    const ctx = buildUserContext(history);
    expect(ctx.conversationHistory?.length).toBeLessThanOrEqual(10);
  });

  it('extracts recent tool results keyed by toolCallId', () => {
    const history: Prompt[] = [
      {
        role: 'tool',
        content: JSON.stringify({ pods: [] }),
        name: 'kubernetes_api_request',
        toolCallId: 'c1',
      },
    ];
    const ctx = buildUserContext(history);
    expect(ctx.lastToolResults?.['c1']).toEqual({ pods: [] });
  });

  it('falls back to raw string when tool content is not valid JSON', () => {
    const history: Prompt[] = [
      { role: 'tool', content: 'plain text', name: 'my_tool', toolCallId: 'c1' },
    ];
    expect(buildUserContext(history).lastToolResults?.['c1']).toBe('plain text');
  });

  it('multiple tool calls with same name are keyed by toolCallId, not overwritten', () => {
    // When two kubernetes_api_request calls both return results, only the
    // LAST one survives in lastToolResults. Any context from the earlier call
    // is silently lost, potentially confusing the LLM about what data exists.
    const history: Prompt[] = [
      {
        role: 'tool' as const,
        content: JSON.stringify({ first: true }),
        name: 'k8s',
        toolCallId: 'c1',
      },
      {
        role: 'tool' as const,
        content: JSON.stringify({ second: true }),
        name: 'k8s',
        toolCallId: 'c2',
      },
    ];
    const ctx = buildUserContext(history);
    // Both results must be accessible, keyed by toolCallId
    expect(ctx.lastToolResults?.['c1']).toEqual({ first: true });
    expect(ctx.lastToolResults?.['c2']).toEqual({ second: true });
  });

  it('attaches a timeContext Date object', () => {
    const before = Date.now();
    const ctx = buildUserContext([]);
    expect(ctx.timeContext).toBeInstanceOf(Date);
    expect(ctx.timeContext!.getTime()).toBeGreaterThanOrEqual(before);
  });
});
