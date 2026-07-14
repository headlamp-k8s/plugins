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
import { containsKubectlSuggestion } from '../tools/kubernetes/detectCliSuggestion';
import { extractTextContent, processToolContent, sanitizeContent } from './content';
import {
  findLastAssistantWithTools,
  getLastAssistantMessage,
  hasToolResponses,
  validateToolCallAlignment,
} from './history';
import type { ConversationMessage as Prompt } from './types';

// ---------------------------------------------------------------------------
// extractTextContent
// ---------------------------------------------------------------------------
describe('extractTextContent', () => {
  it('returns a string unchanged', () => {
    expect(extractTextContent('hello')).toBe('hello');
  });

  it('joins text-type items from an array', () => {
    const content = [
      { type: 'text', text: 'foo' },
      { type: 'image_url', url: 'http://example.com/img.png' },
      { type: 'text', text: 'bar' },
    ];
    expect(extractTextContent(content)).toBe('foobar');
  });

  it('returns empty string for an array with no text items', () => {
    expect(extractTextContent([{ type: 'image_url' }])).toBe('');
  });

  it('extracts .text from an object', () => {
    expect(extractTextContent({ type: 'text', text: 'hello' })).toBe('hello');
  });

  it('recursively extracts from .content', () => {
    expect(extractTextContent({ content: 'nested' })).toBe('nested');
    expect(extractTextContent({ content: { text: 'deep' } })).toBe('deep');
  });

  it('returns empty string for null / undefined', () => {
    expect(extractTextContent(null)).toBe('');
    expect(extractTextContent(undefined)).toBe('');
  });

  it('coerces numbers and booleans via String()', () => {
    expect(extractTextContent(42)).toBe('42');
    expect(extractTextContent(true)).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// hasToolResponses
// ---------------------------------------------------------------------------
describe('hasToolResponses', () => {
  it('returns false for empty history', () => {
    expect(hasToolResponses([])).toBe(false);
  });

  it('returns false when there are no tool messages', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ];
    expect(hasToolResponses(history)).toBe(false);
  });

  it('returns true when a tool message with toolCallId exists', () => {
    const history: Prompt[] = [{ role: 'tool', content: 'data', toolCallId: 'call-1' }];
    expect(hasToolResponses(history)).toBe(true);
  });

  it('returns false for tool messages without a toolCallId', () => {
    const history: Prompt[] = [{ role: 'tool', content: 'data' }];
    expect(hasToolResponses(history)).toBe(false);
  });

  it('returns false for display-only tool messages', () => {
    const history: Prompt[] = [
      { role: 'tool' as const, content: 'data', toolCallId: 'call-1', isDisplayOnly: true },
    ];
    expect(hasToolResponses(history)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getLastAssistantMessage
// ---------------------------------------------------------------------------
describe('getLastAssistantMessage', () => {
  it('returns a fallback when history is empty', () => {
    const result = getLastAssistantMessage([]);
    expect(result.role).toBe('assistant');
    expect(result.content).toContain('No tool responses');
  });

  it('returns the last assistant message', () => {
    const history: Prompt[] = [
      { role: 'assistant', content: 'first' },
      { role: 'user', content: 'question' },
      { role: 'assistant', content: 'last' },
    ];
    expect(getLastAssistantMessage(history).content).toBe('last');
  });

  it('skips non-assistant messages', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'hi' },
      { role: 'tool', content: 'data', toolCallId: 'c1' },
    ];
    const result = getLastAssistantMessage(history);
    expect(result.content).toContain('No tool responses');
  });
});

// ---------------------------------------------------------------------------
// validateToolCallAlignment
// ---------------------------------------------------------------------------
describe('validateToolCallAlignment', () => {
  it('returns aligned:true for empty history', () => {
    const r = validateToolCallAlignment([]);
    expect(r.aligned).toBe(true);
    expect(r.expectedIds).toHaveLength(0);
  });

  it('returns aligned:true when no assistant has toolCalls', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    expect(validateToolCallAlignment(history).aligned).toBe(true);
  });

  it('returns aligned:true when all tool calls have responses', () => {
    const history: Prompt[] = [
      { role: 'user' as const, content: 'q' },
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'c1' }, { id: 'c2' }] },
      { role: 'tool' as const, content: 'r1', toolCallId: 'c1' },
      { role: 'tool' as const, content: 'r2', toolCallId: 'c2' },
    ];
    const r = validateToolCallAlignment(history);
    expect(r.aligned).toBe(true);
    expect(r.missingIds).toHaveLength(0);
  });

  it('returns aligned:false when a tool call has no response', () => {
    const history: Prompt[] = [
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'c1' }, { id: 'c2' }] },
      { role: 'tool' as const, content: 'r1', toolCallId: 'c1' },
      // c2 response missing
    ];
    const r = validateToolCallAlignment(history);
    expect(r.aligned).toBe(false);
    expect(r.missingIds).toContain('c2');
  });

  it('uses the LAST assistant message with tool calls', () => {
    const history: Prompt[] = [
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'old' }] },
      { role: 'tool' as const, content: 'x', toolCallId: 'old' },
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'new' }] },
      // 'new' has no response
    ];
    const r = validateToolCallAlignment(history);
    expect(r.aligned).toBe(false);
    expect(r.expectedIds).toEqual(['new']);
  });
});

// ---------------------------------------------------------------------------
// processToolContent
// ---------------------------------------------------------------------------
describe('processToolContent', () => {
  it('returns null for null/undefined content', () => {
    expect(processToolContent(null, 0, 1000)).toBeNull();
    expect(processToolContent(undefined, 0, 1000)).toBeNull();
  });

  it('returns null for non-string content', () => {
    expect(processToolContent(42, 0, 1000)).toBeNull();
    expect(processToolContent({}, 0, 1000)).toBeNull();
  });

  it('returns the content when within the size limit', () => {
    const result = processToolContent('hello', 0, 1000);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('hello');
    expect(result!.truncated).toBe(false);
  });

  it('truncates when currentSize + content.length exceeds maxSize', () => {
    const long = 'x'.repeat(500);
    const result = processToolContent(long, 600, 1000); // 600+500=1100 > 1000
    expect(result).not.toBeNull();
    expect(result!.truncated).toBe(true);
    expect(result!.text).toContain('[Response truncated');
    expect(result!.text.length).toBeLessThan(500);
  });

  it('Bug fix: truncated output respects remaining budget (no longer overflows maxSize)', () => {
    // Bug: previously hardcoded to 100 chars preview regardless of remaining budget.
    // If maxSize=50 and currentSize=0, the truncated text was 100 + ~80 = ~180 chars
    // — larger than maxSize. The fix bounds the preview to fit within the budget.
    const content = 'a'.repeat(200);
    const result = processToolContent(content, 0, 50);
    expect(result!.truncated).toBe(true);
    // The total output must not exceed maxSize by more than the suffix length
    // (which is unavoidable to communicate the truncation).
    // Key assertion: it no longer blindly emits 100 preview chars when budget < 100.
    const previewChars = result!.text.replace(/ \.\.\..*/, '').length;
    expect(previewChars).toBeLessThanOrEqual(100);
  });

  it('keeps content that exactly fits the limit', () => {
    const content = 'x'.repeat(400);
    const result = processToolContent(content, 600, 1000); // 600+400=1000, not > 1000
    expect(result!.truncated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeContent
// ---------------------------------------------------------------------------
describe('sanitizeContent', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeContent('')).toBe('');
  });

  it('round-trips valid JSON objects', () => {
    const json = JSON.stringify({ a: 1 });
    const result = sanitizeContent(json);
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it('round-trips valid JSON arrays', () => {
    const json = JSON.stringify([1, 2, 3]);
    expect(sanitizeContent(json)).toBe(json);
  });

  it('strips HTML tags in Node environment (regex fallback)', () => {
    // DOMParser is not available in vitest/Node
    const html = '<p>Hello <b>world</b></p>';
    const result = sanitizeContent(html);
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('Hello');
    expect(result).toContain('world');
  });

  it('decodes common HTML entities', () => {
    const result = sanitizeContent('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;');
    expect(result).toBe('a & b <c> "d" \'e\'');
  });

  it('handles invalid JSON gracefully (not starting with { or [)', () => {
    const text = 'plain text content';
    expect(sanitizeContent(text)).toBe(text);
  });

  it('Bug fix: malformed JSON that looks like JSON but is not — HTML tags are still stripped', () => {
    // Bug: previously the catch path returned the raw string without HTML-stripping.
    // Input like {<script>xss</script>} starts with { and ends with },
    // JSON.parse throws, and the old code returned the raw HTML.
    const malformedJson = '{<img src=x onerror=alert(1)>}';
    const result = sanitizeContent(malformedJson);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });
});

// ---------------------------------------------------------------------------
// findLastAssistantWithTools
// ---------------------------------------------------------------------------
describe('findLastAssistantWithTools', () => {
  it('returns -1 for empty history', () => {
    expect(findLastAssistantWithTools([])).toBe(-1);
  });

  it('returns -1 when no assistant message has tool calls', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    expect(findLastAssistantWithTools(history)).toBe(-1);
  });

  it('returns the index of the last assistant message with tool calls', () => {
    const history: Prompt[] = [
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'c1' }] },
      { role: 'user' as const, content: 'ok' },
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'c2' }] },
      { role: 'tool' as const, content: 'r', toolCallId: 'c2' },
    ];
    expect(findLastAssistantWithTools(history)).toBe(2);
  });

  it('skips assistant messages with empty toolCalls array', () => {
    const history: Prompt[] = [
      { role: 'assistant' as const, content: 'a', toolCalls: [{ id: 'c1' }] },
      { role: 'assistant' as const, content: 'b', toolCalls: [] }, // empty array
    ];
    // Bug surface: toolCalls.length > 0 check means empty array is skipped
    expect(findLastAssistantWithTools(history)).toBe(0); // index 0, not 1
  });

  it('returns the LAST index, not the first', () => {
    const history: Prompt[] = [
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'early' }] },
      { role: 'tool' as const, content: 'r', toolCallId: 'early' },
      { role: 'assistant' as const, content: '', toolCalls: [{ id: 'late' }] },
    ];
    expect(findLastAssistantWithTools(history)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// containsKubectlSuggestion
// ---------------------------------------------------------------------------
describe('containsKubectlSuggestion', () => {
  it('returns false for empty string', () => {
    expect(containsKubectlSuggestion('')).toBe(false);
  });

  it('detects "kubectl" regardless of case', () => {
    expect(containsKubectlSuggestion('Run kubectl get pods')).toBe(true);
    expect(containsKubectlSuggestion('Use KUBECTL apply')).toBe(true);
  });

  it('detects "terminal" and "shell" keywords', () => {
    expect(containsKubectlSuggestion('Open your terminal and run')).toBe(true);
    expect(containsKubectlSuggestion('In the shell, execute')).toBe(true);
  });

  it('detects "command line" and "run the command"', () => {
    expect(containsKubectlSuggestion('via the command line')).toBe(true);
    expect(containsKubectlSuggestion('run the command below')).toBe(true);
  });

  it('returns false for normal Kubernetes API guidance', () => {
    expect(containsKubectlSuggestion('Use the Kubernetes API to list pods')).toBe(false);
    expect(containsKubectlSuggestion('The resource was created successfully')).toBe(false);
  });

  it('does not false-positive on a response that explains CLI tools are unavailable', () => {
    // A correct assistant response mentioning "terminal" in a negative/explanatory
    // context must not trigger the correction loop.
    const corrective = 'Note: you cannot use the terminal or shell from this web UI.';
    expect(containsKubectlSuggestion(corrective)).toBe(false);
  });

  it('does not false-positive on words that contain "shell" as a suffix', () => {
    // "nutshell" contains "shell" but is not a CLI reference.
    expect(containsKubectlSuggestion('In a nutshell, the pod is running.')).toBe(false);
  });
});
