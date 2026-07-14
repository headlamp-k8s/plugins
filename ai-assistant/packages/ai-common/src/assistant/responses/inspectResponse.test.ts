import { describe, expect, it } from 'vitest';
import type { ConversationMessage as Prompt } from '../../conversation/types';
import {
  getRecentToolResponses,
  isEmptyLLMContent,
  isMCPFormattedOutput,
  mapCorrectedResponseToolCalls,
} from './inspectResponse';

// =============================================================================
// isEmptyLLMContent
// =============================================================================

describe('isEmptyLLMContent', () => {
  it('returns true for empty string', () => {
    expect(isEmptyLLMContent('')).toBe(true);
  });

  it('returns true for whitespace-only string', () => {
    expect(isEmptyLLMContent('   ')).toBe(true);
    expect(isEmptyLLMContent('\n\t')).toBe(true);
  });

  it('returns true for null', () => {
    expect(isEmptyLLMContent(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isEmptyLLMContent(undefined)).toBe(true);
  });

  it('returns false for a non-empty string', () => {
    expect(isEmptyLLMContent('Hello')).toBe(false);
  });

  it('returns false for a string that has only a single character', () => {
    expect(isEmptyLLMContent('.')).toBe(false);
  });

  it('returns false for a string with leading/trailing whitespace but non-whitespace content', () => {
    expect(isEmptyLLMContent('  hello  ')).toBe(false);
  });
});

// =============================================================================
// isMCPFormattedOutput
// =============================================================================

describe('isMCPFormattedOutput', () => {
  it('returns true for { formatted: true, mcpOutput: <anything> }', () => {
    const payload = JSON.stringify({ formatted: true, mcpOutput: '<table>data</table>' });
    expect(isMCPFormattedOutput(payload)).toBe(true);
  });

  it('returns false when formatted is false', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ formatted: false, mcpOutput: 'x' }))).toBe(false);
  });

  it('returns false when mcpOutput is absent', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ formatted: true }))).toBe(false);
  });

  it('returns false when formatted is absent', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ mcpOutput: 'data' }))).toBe(false);
  });

  it('returns false for a regular JSON tool response', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ pods: [], count: 0 }))).toBe(false);
  });

  it('returns false for an error JSON payload', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ error: true, message: 'Not found' }))).toBe(false);
  });

  it('returns false for non-JSON content (does not throw)', () => {
    expect(isMCPFormattedOutput('plain text')).toBe(false);
    expect(isMCPFormattedOutput('{ invalid json')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isMCPFormattedOutput('')).toBe(false);
  });

  it('mcpOutput: null still returns false (falsy mcpOutput)', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ formatted: true, mcpOutput: null }))).toBe(false);
  });

  it('mcpOutput: 0 still returns false (falsy mcpOutput)', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ formatted: true, mcpOutput: 0 }))).toBe(false);
  });

  it('mcpOutput: "" still returns false (falsy mcpOutput)', () => {
    expect(isMCPFormattedOutput(JSON.stringify({ formatted: true, mcpOutput: '' }))).toBe(false);
  });

  it('returns true when mcpOutput is an object (non-empty)', () => {
    const payload = JSON.stringify({ formatted: true, mcpOutput: { rows: [] } });
    expect(isMCPFormattedOutput(payload)).toBe(true);
  });
});

// =============================================================================
// getRecentToolResponses
// =============================================================================

describe('getRecentToolResponses', () => {
  const toolPrompt = (content: string, id: string, name?: string): Prompt => ({
    role: 'tool',
    content,
    toolCallId: id,
    name,
  });

  it('returns the most recent tool responses in order', () => {
    const history = [toolPrompt('{"a":1}', 'c1', 'tool_a'), toolPrompt('{"b":2}', 'c2', 'tool_b')];
    const result = getRecentToolResponses(history);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('{"a":1}');
    expect(result[1].content).toBe('{"b":2}');
  });

  it('limits to the most recent maxCount entries', () => {
    const history = [
      toolPrompt('old', 'c1'),
      toolPrompt('mid', 'c2'),
      toolPrompt('new', 'c3'),
      toolPrompt('newest', 'c4'),
    ];
    const result = getRecentToolResponses(history, 2);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('new');
    expect(result[1].content).toBe('newest');
  });

  it('defaults to 3 most recent when maxCount is omitted', () => {
    const history = Array.from({ length: 5 }, (_, i) => toolPrompt(`r${i}`, `c${i}`));
    const result = getRecentToolResponses(history);
    expect(result).toHaveLength(3);
    expect(result[2].content).toBe('r4');
  });

  it('excludes entries that have no toolCallId', () => {
    const history: Prompt[] = [
      { role: 'tool', content: 'no-id' }, // no toolCallId
      toolPrompt('with-id', 'c1'),
    ];
    const result = getRecentToolResponses(history);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('with-id');
  });

  it('excludes non-tool messages', () => {
    const history: Prompt[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello', toolCallId: 'fake' },
      toolPrompt('data', 'c1'),
    ];
    expect(getRecentToolResponses(history)).toHaveLength(1);
  });

  it('maps name and content correctly', () => {
    const result = getRecentToolResponses([toolPrompt('{"x":1}', 'c1', 'my_tool')]);
    expect(result[0].name).toBe('my_tool');
    expect(result[0].content).toBe('{"x":1}');
  });

  it('name is undefined when the prompt has no name', () => {
    const result = getRecentToolResponses([{ role: 'tool', content: 'x', toolCallId: 'c1' }]);
    expect(result[0].name).toBeUndefined();
  });

  it('returns empty array for empty history', () => {
    expect(getRecentToolResponses([])).toEqual([]);
  });

  it('returns empty array when no tool messages exist', () => {
    const history: Prompt[] = [{ role: 'user', content: 'hi' }];
    expect(getRecentToolResponses(history)).toEqual([]);
  });
});

// =============================================================================
// mapCorrectedResponseToolCalls
// =============================================================================

describe('mapCorrectedResponseToolCalls', () => {
  it('maps id, name, and args correctly', () => {
    const toolCalls = [{ id: 'c1', name: 'kubernetes_api_request', args: { path: '/api/v1' } }];
    const result = mapCorrectedResponseToolCalls(toolCalls);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
    expect(result[0].type).toBe('function');
    expect(result[0].function.name).toBe('kubernetes_api_request');
    expect(JSON.parse(result[0].function.arguments)).toEqual({ path: '/api/v1' });
  });

  it('falls back to "kubernetes_api_request" when name is absent', () => {
    // This happens when the corrected response inherits a partially-formed tool call
    const [result] = mapCorrectedResponseToolCalls([{ id: 'c1', args: {} }]);
    expect(result.function.name).toBe('kubernetes_api_request');
  });

  it('falls back to "kubernetes_api_request" when name is empty string', () => {
    const [result] = mapCorrectedResponseToolCalls([{ id: 'c1', name: '', args: {} }]);
    expect(result.function.name).toBe('kubernetes_api_request');
  });

  it('defaults args to {} when absent', () => {
    const [result] = mapCorrectedResponseToolCalls([{ id: 'c1', name: 'my_tool' }]);
    expect(result.function.arguments).toBe('{}');
  });

  it('defaults id to empty string when absent', () => {
    const [result] = mapCorrectedResponseToolCalls([{ name: 'my_tool', args: {} }]);
    expect(result.id).toBe('');
  });

  it('handles multiple tool calls preserving order', () => {
    const calls = [
      { id: 'a', name: 'tool_a', args: {} },
      { id: 'b', name: 'tool_b', args: {} },
    ];
    const result = mapCorrectedResponseToolCalls(calls);
    expect(result.map(r => r.id)).toEqual(['a', 'b']);
  });

  it('returns empty array for empty input', () => {
    expect(mapCorrectedResponseToolCalls([])).toEqual([]);
  });

  it('drops malformed non-object tool calls', () => {
    expect(mapCorrectedResponseToolCalls([null, 'bad', 42])).toEqual([]);
  });

  it('serialises complex nested args correctly', () => {
    const [result] = mapCorrectedResponseToolCalls([
      { id: 'c1', name: 'tool', args: { nested: { arr: [1, 2] } } },
    ]);
    expect(JSON.parse(result.function.arguments)).toEqual({ nested: { arr: [1, 2] } });
  });
});
