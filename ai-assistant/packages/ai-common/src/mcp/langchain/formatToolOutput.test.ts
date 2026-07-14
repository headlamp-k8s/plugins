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
import { describe, expect, it, vi } from 'vitest';
import { type MCPFormatterOptions, MCPOutputFormatter } from './formatToolOutput';

// ---------------------------------------------------------------------------
// Minimal BaseChatModel stub
// ---------------------------------------------------------------------------

function makeModel(
  responseContent: string | object[]
): BaseChatModel & { bind: ReturnType<typeof vi.fn> } {
  return {
    invoke: vi.fn().mockResolvedValue({
      content: typeof responseContent === 'string' ? responseContent : responseContent,
    }),
    bind: vi.fn().mockReturnThis(),
  } as unknown as BaseChatModel & { bind: ReturnType<typeof vi.fn> };
}

// ---------------------------------------------------------------------------
// formatSimple — exercises createFallbackFormat without a live LLM
// ---------------------------------------------------------------------------

describe('MCPOutputFormatter.formatSimple', () => {
  const fmt = new MCPOutputFormatter(makeModel(''));

  it('returns raw type for plain text', () => {
    const result = fmt.formatSimple('hello world', 'test-tool');
    expect(result.type).toBe('text');
    expect(result.data.content).toBe('hello world');
    expect(result.metadata?.toolName).toBe('test-tool');
    expect(result.metadata?.responseSize).toBe(11);
  });

  it('returns list type for JSON array input', () => {
    const result = fmt.formatSimple(JSON.stringify(['a', 'b', 'c']), 'lister');
    expect(result.type).toBe('list');
    expect(result.data.items).toHaveLength(3);
    expect(result.data.items?.[0].text).toBe('a');
  });

  it('returns text/json for JSON object input', () => {
    const result = fmt.formatSimple(JSON.stringify({ key: 'val' }), 'obj-tool');
    expect(result.type).toBe('text');
    expect(result.data.language).toBe('json');
    expect(result.data.content).toContain('"key"');
  });

  it('caps list items at 100 even for large arrays', () => {
    const big = JSON.stringify(Array.from({ length: 200 }, (_, i) => `item-${i}`));
    const result = fmt.formatSimple(big, 'lister');
    expect(result.data.items).toHaveLength(100);
  });

  it('truncates large plain-text output and adds a warning', () => {
    const big = 'x'.repeat(6000);
    const result = fmt.formatSimple(big, 'tool');
    expect(result.warnings?.some(w => w.includes('truncated'))).toBe(true);
    expect(result.data.content?.length).toBeLessThan(big.length);
  });

  it('uses markdown language hint for documentation content', () => {
    const docContent =
      '# Overview\n\nThis guide covers installation.\n\n## Prerequisites\n\n- Node.js\n- npm\n\n## Getting Started\n\nFollow these steps.';
    const result = fmt.formatSimple(docContent, 'fetch-docs');
    expect(result.data.language).toBe('markdown');
  });

  it('always includes metadata with toolName and responseSize', () => {
    const result = fmt.formatSimple('data', 'my-tool');
    expect(result.metadata?.toolName).toBe('my-tool');
    expect(result.metadata?.responseSize).toBe(4);
    expect(typeof result.metadata?.processingTime).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// formatMCPOutput — exercises the LLM path with a mock model
// ---------------------------------------------------------------------------

describe('MCPOutputFormatter.formatMCPOutput', () => {
  const validJsonResponse = JSON.stringify({
    type: 'metrics',
    title: 'CPU Metrics',
    summary: 'Current CPU usage',
    data: { primary: [{ label: 'CPU', value: '80%', status: 'warning' }] },
    insights: ['CPU is high'],
    warnings: [],
    actionable_items: ['Scale up'],
  });

  it('returns parsed output when model returns valid JSON', async () => {
    const model = makeModel(validJsonResponse);
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('{"cpu":80}', 'metrics-tool');
    expect(result.type).toBe('metrics');
    expect(result.title).toBe('CPU Metrics');
    expect(result.insights).toContain('CPU is high');
  });

  it('wraps primitive AI data in a render-safe content object', async () => {
    const response = JSON.stringify({
      type: 'text',
      title: 'Count',
      summary: 'One value',
      data: 42,
    });
    const fmt = new MCPOutputFormatter(makeModel(response));

    const result = await fmt.formatMCPOutput('42', 'count-tool');

    expect(result.data).toEqual({ content: '42' });
  });

  it('returns parsed output when model wraps JSON in markdown code fence', async () => {
    const fenced = '```json\n' + validJsonResponse + '\n```';
    const model = makeModel(fenced);
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('raw', 'tool');
    expect(result.type).toBe('metrics');
  });

  it('falls back gracefully when model returns non-JSON', async () => {
    const model = makeModel('Sorry, I could not format this.');
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('data', 'tool');
    // Should not throw; type falls back to text/raw
    expect(['text', 'raw', 'error']).toContain(result.type);
    expect(result.metadata?.toolName).toBe('tool');
  });

  it('falls back gracefully when model.invoke throws', async () => {
    const model = {
      invoke: vi.fn().mockRejectedValue(new Error('Network error')),
      bind: vi.fn().mockReturnThis(),
    } as unknown as BaseChatModel;
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('raw', 'tool');
    expect(result.type).toBeDefined();
    expect(result.metadata?.toolName).toBe('tool');
  });

  it('passes maxTokens through model.bind with both snake_case and camelCase spellings', async () => {
    const model = makeModel(validJsonResponse);
    const fmt = new MCPOutputFormatter(model);
    const opts: MCPFormatterOptions = { maxTokens: 1000 };
    await fmt.formatMCPOutput('data', 'tool', opts);
    expect(model.bind).toHaveBeenCalledWith({ max_tokens: 1000, maxTokens: 1000 });
  });

  it('does not call model.bind when maxTokens is not set', async () => {
    const model = makeModel(validJsonResponse);
    const fmt = new MCPOutputFormatter(model);
    await fmt.formatMCPOutput('data', 'tool', {});
    expect(model.bind).not.toHaveBeenCalled();
  });

  it('handles array response.content (multi-part messages)', async () => {
    const model = {
      invoke: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: validJsonResponse }],
      }),
      bind: vi.fn().mockReturnThis(),
    } as unknown as BaseChatModel;
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('raw', 'tool');
    expect(result.type).toBe('metrics');
  });

  it('populates metadata fields on success', async () => {
    const model = makeModel(validJsonResponse);
    const fmt = new MCPOutputFormatter(model);
    const result = await fmt.formatMCPOutput('{"x":1}', 'my-tool');
    expect(result.metadata?.toolName).toBe('my-tool');
    expect(result.metadata?.responseSize).toBe(7);
    expect(result.metadata?.processingTime).toBeGreaterThanOrEqual(0);
  });

  it('redacts secrets via formatSimple (no LLM involved)', () => {
    const fmt = new MCPOutputFormatter({
      invoke: vi.fn(),
      bind: vi.fn(),
    } as unknown as BaseChatModel);
    const withSecret = 'result: ok\ntoken: supersecret\ndata: stuff';
    const result = fmt.formatSimple(withSecret, 'some-tool');
    const rendered = JSON.stringify(result);
    expect(rendered).not.toContain('supersecret');
    expect(rendered).toContain('[REDACTED]');
  });

  it('redacts secrets in the formatMCPOutput fallback path (LLM throws)', async () => {
    // Regression: catch block returned rawOutput directly without redacting.
    const model = {
      invoke: vi.fn().mockRejectedValue(new Error('LLM unavailable')),
      bind: vi.fn().mockReturnThis(),
    } as unknown as BaseChatModel;
    const fmt = new MCPOutputFormatter(model);
    const withSecret = 'output data\npassword: mysecret\nmore data';
    const result = await fmt.formatMCPOutput(withSecret, 'my-tool');
    const rendered = JSON.stringify(result);
    expect(rendered).not.toContain('mysecret');
    expect(rendered).toContain('[REDACTED]');
  });
});
