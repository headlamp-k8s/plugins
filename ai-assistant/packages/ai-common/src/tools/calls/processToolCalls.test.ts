import { describe, expect, it } from 'vitest';
import {
  buildDisabledToolsMessage,
  filterToolCallsByEnabled,
  mergeApprovedArguments,
  normalizeLLMToolCalls,
  shouldProcessToolFollowUp,
} from './processToolCalls';

// =============================================================================
// normalizeLLMToolCalls
// =============================================================================

describe('normalizeLLMToolCalls', () => {
  it('converts a single tool call to the normalised format', () => {
    const raw = [{ id: 'c1', name: 'kubernetes_api_request', args: { path: '/api/v1/pods' } }];
    expect(normalizeLLMToolCalls(raw)).toEqual([
      {
        type: 'function',
        id: 'c1',
        function: { name: 'kubernetes_api_request', arguments: '{"path":"/api/v1/pods"}' },
      },
    ]);
  });

  it('serialises args as JSON', () => {
    const raw = [{ id: 'c2', name: 'my_tool', args: { count: 3, flag: true } }];
    const [result] = normalizeLLMToolCalls(raw);
    expect(JSON.parse(result.function.arguments)).toEqual({ count: 3, flag: true });
  });

  it('defaults to {} when args is absent', () => {
    const raw = [{ id: 'c3', name: 'no_args_tool' }];
    const [result] = normalizeLLMToolCalls(raw);
    expect(result.function.arguments).toBe('{}');
  });

  it('defaults to {} when args is null', () => {
    const raw = [{ id: 'c4', name: 'null_args', args: null }];
    const [result] = normalizeLLMToolCalls(raw);
    expect(result.function.arguments).toBe('{}');
  });

  it('sets type to "function" for every entry', () => {
    const raw = [
      { id: 'a', name: 'tool_a', args: {} },
      { id: 'b', name: 'tool_b', args: {} },
    ];
    const results = normalizeLLMToolCalls(raw);
    expect(results.every(r => r.type === 'function')).toBe(true);
  });

  it('handles an empty array', () => {
    expect(normalizeLLMToolCalls([])).toEqual([]);
  });

  it('preserves order across multiple entries', () => {
    const raw = [
      { id: 'x', name: 'first', args: {} },
      { id: 'y', name: 'second', args: {} },
      { id: 'z', name: 'third', args: {} },
    ];
    const result = normalizeLLMToolCalls(raw);
    expect(result.map(r => r.id)).toEqual(['x', 'y', 'z']);
  });
});

// =============================================================================
// filterToolCallsByEnabled
// =============================================================================

describe('filterToolCallsByEnabled', () => {
  const makeTc = (id: string, name: string) => ({
    type: 'function' as const,
    id,
    function: { name, arguments: '{}' },
  });

  it('puts enabled tools in the enabled bucket', () => {
    const calls = [makeTc('c1', 'k8s_tool'), makeTc('c2', 'other_tool')];
    const { enabled } = filterToolCallsByEnabled(calls, ['k8s_tool']);
    expect(enabled).toHaveLength(1);
    expect(enabled[0].id).toBe('c1');
  });

  it('puts disabled tools in the disabled bucket', () => {
    const calls = [makeTc('c1', 'k8s_tool'), makeTc('c2', 'other_tool')];
    const { disabled } = filterToolCallsByEnabled(calls, ['k8s_tool']);
    expect(disabled).toHaveLength(1);
    expect(disabled[0].id).toBe('c2');
  });

  it('returns all enabled when all tools are in the enabled list', () => {
    const calls = [makeTc('c1', 'a'), makeTc('c2', 'b')];
    const { enabled, disabled } = filterToolCallsByEnabled(calls, ['a', 'b']);
    expect(enabled).toHaveLength(2);
    expect(disabled).toHaveLength(0);
  });

  it('returns all disabled when no tools are in the enabled list', () => {
    const calls = [makeTc('c1', 'a'), makeTc('c2', 'b')];
    const { enabled, disabled } = filterToolCallsByEnabled(calls, []);
    expect(enabled).toHaveLength(0);
    expect(disabled).toHaveLength(2);
  });

  it('handles empty input array', () => {
    const { enabled, disabled } = filterToolCallsByEnabled([], ['k8s_tool']);
    expect(enabled).toHaveLength(0);
    expect(disabled).toHaveLength(0);
  });

  it('preserves original order within each bucket', () => {
    const calls = [makeTc('a', 'on'), makeTc('b', 'off'), makeTc('c', 'on'), makeTc('d', 'off')];
    const { enabled, disabled } = filterToolCallsByEnabled(calls, ['on']);
    expect(enabled.map(t => t.id)).toEqual(['a', 'c']);
    expect(disabled.map(t => t.id)).toEqual(['b', 'd']);
  });
});

// =============================================================================
// buildDisabledToolsMessage
// =============================================================================

describe('buildDisabledToolsMessage', () => {
  it('includes the tool name in the message', () => {
    const msg = buildDisabledToolsMessage('kubernetes_api_request');
    expect(msg).toContain('kubernetes_api_request');
  });

  it('accepts an array and joins names with ", "', () => {
    const msg = buildDisabledToolsMessage(['tool_a', 'tool_b']);
    expect(msg).toContain('tool_a, tool_b');
  });

  it('mentions "disabled in your settings"', () => {
    const msg = buildDisabledToolsMessage('my_tool');
    expect(msg.toLowerCase()).toContain('disabled');
  });

  it('includes steps to enable the tool', () => {
    const msg = buildDisabledToolsMessage('my_tool');
    expect(msg).toContain('AI Assistant settings');
    expect(msg).toContain('Enable the');
  });

  it('returns a non-empty string for an empty array', () => {
    expect(buildDisabledToolsMessage([])).toBeTruthy();
  });

  it('handles a single-element array same as a plain string', () => {
    const fromArray = buildDisabledToolsMessage(['only_tool']);
    const fromString = buildDisabledToolsMessage('only_tool');
    expect(fromArray).toBe(fromString);
  });
});

// =============================================================================
// shouldProcessToolFollowUp
// =============================================================================

describe('shouldProcessToolFollowUp', () => {
  const makeResponse = (content: unknown) => ({
    role: 'tool',
    content: JSON.stringify(content),
  });

  it('returns false for an empty array (guards against .every() vacuous truth)', () => {
    expect(shouldProcessToolFollowUp([])).toBe(false);
  });

  it('returns true when a response has no shouldProcessFollowUp field', () => {
    const responses = [makeResponse({ data: 'some result' })];
    expect(shouldProcessToolFollowUp(responses)).toBe(true);
  });

  it('returns true when shouldProcessFollowUp is explicitly true', () => {
    const responses = [makeResponse({ shouldProcessFollowUp: true })];
    expect(shouldProcessToolFollowUp(responses)).toBe(true);
  });

  it('returns false when any response sets shouldProcessFollowUp to false', () => {
    const responses = [
      makeResponse({ shouldProcessFollowUp: true }),
      makeResponse({ shouldProcessFollowUp: false }),
    ];
    expect(shouldProcessToolFollowUp(responses)).toBe(false);
  });

  it('returns false when the only response opts out', () => {
    const responses = [makeResponse({ shouldProcessFollowUp: false, status: 'pending' })];
    expect(shouldProcessToolFollowUp(responses)).toBe(false);
  });

  it('returns true for non-JSON content (parse error → default true)', () => {
    const responses = [{ role: 'tool', content: 'plain text result' }];
    expect(shouldProcessToolFollowUp(responses)).toBe(true);
  });

  it('returns true when all responses allow follow-up', () => {
    const responses = [
      makeResponse({ result: 'ok' }),
      makeResponse({ shouldProcessFollowUp: true }),
    ];
    expect(shouldProcessToolFollowUp(responses)).toBe(true);
  });

  it('handles malformed JSON gracefully (defaults to true)', () => {
    const responses = [{ role: 'tool', content: '{ invalid json' }];
    expect(shouldProcessToolFollowUp(responses)).toBe(true);
  });
});

// =============================================================================
// mergeApprovedArguments
// =============================================================================

describe('mergeApprovedArguments', () => {
  const makeTc = (id: string, args = '{}') => ({
    type: 'function' as const,
    id,
    function: { name: 'some_tool', arguments: args },
  });

  it('replaces arguments with the approved version', () => {
    const toolCalls = [makeTc('c1', '{"old":true}')];
    const approvalData = [{ id: 'c1', arguments: { new: true } }];
    const result = mergeApprovedArguments(toolCalls, approvalData, ['c1']);
    expect(JSON.parse(result[0].function.arguments)).toEqual({ new: true });
  });

  it('excludes tool calls not in approvedIds', () => {
    const toolCalls = [makeTc('c1'), makeTc('c2')];
    const approvalData = [
      { id: 'c1', arguments: { a: 1 } },
      { id: 'c2', arguments: { b: 2 } },
    ];
    const result = mergeApprovedArguments(toolCalls, approvalData, ['c1']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });

  it('returns original arguments when no approval data matches the id', () => {
    const toolCalls = [makeTc('c1', '{"orig":1}')];
    // Approval data has a different id
    const approvalData = [{ id: 'c99', arguments: { other: 2 } }];
    const result = mergeApprovedArguments(toolCalls, approvalData, ['c1']);
    expect(result[0].function.arguments).toBe('{"orig":1}');
  });

  it('preserves other function properties (name, type, id)', () => {
    const toolCalls = [
      { type: 'function' as const, id: 'c1', function: { name: 'my_tool', arguments: '{}' } },
    ];
    const approvalData = [{ id: 'c1', arguments: { namespace: 'default' } }];
    const result = mergeApprovedArguments(toolCalls, approvalData, ['c1']);
    expect(result[0].id).toBe('c1');
    expect(result[0].type).toBe('function');
    expect(result[0].function.name).toBe('my_tool');
  });

  it('returns empty array when approvedIds is empty', () => {
    const toolCalls = [makeTc('c1'), makeTc('c2')];
    const approvalData = [{ id: 'c1', arguments: {} }];
    expect(mergeApprovedArguments(toolCalls, approvalData, [])).toHaveLength(0);
  });

  it('handles empty toolCalls array', () => {
    expect(mergeApprovedArguments([], [], ['c1'])).toHaveLength(0);
  });

  it('serialises complex nested argument objects correctly', () => {
    const toolCalls = [makeTc('c1')];
    const approvalData = [{ id: 'c1', arguments: { nested: { deep: [1, 2, 3] } } }];
    const result = mergeApprovedArguments(toolCalls, approvalData, ['c1']);
    expect(JSON.parse(result[0].function.arguments)).toEqual({ nested: { deep: [1, 2, 3] } });
  });
});

// =============================================================================
// Edge-case / bug regression tests
// =============================================================================

describe('normalizeLLMToolCalls — edge cases', () => {
  it('normalizes a missing id to an empty string', () => {
    const [result] = normalizeLLMToolCalls([{ name: 'tool', args: {} }]);
    expect(result.id).toBe('');
  });

  it('args=null defaults to {}', () => {
    const [result] = normalizeLLMToolCalls([{ id: 'c1', name: 'tool', args: null }]);
    expect(result.function.arguments).toBe('{}');
  });

  it('drops malformed tool calls without a string name', () => {
    expect(normalizeLLMToolCalls([null, {}, { name: 42 }, { name: 'valid' }])).toEqual([
      {
        type: 'function',
        id: '',
        function: { name: 'valid', arguments: '{}' },
      },
    ]);
  });

  it('serialises nested args without losing data', () => {
    const args = { a: { b: [1, 2] }, c: true };
    const [result] = normalizeLLMToolCalls([{ id: 'x', name: 't', args }]);
    expect(JSON.parse(result.function.arguments)).toEqual(args);
  });
});

describe('buildDisabledToolsMessage — plural fix', () => {
  it('BUG (fixed): multiple tools uses "tools" not "tool"', () => {
    // Before fix: "Enable the \"tool_a, tool_b\" tool" — grammatically wrong.
    const msg = buildDisabledToolsMessage(['tool_a', 'tool_b']);
    expect(msg).toMatch(/Enable the "tool_a, tool_b" tools/);
  });

  it('single tool still uses "tool" (singular)', () => {
    const msg = buildDisabledToolsMessage(['only_tool']);
    expect(msg).toMatch(/Enable the "only_tool" tool\b/);
  });

  it('plain string arg uses singular "tool" in the Enable line', () => {
    const msg = buildDisabledToolsMessage('my_tool');
    expect(msg).toContain('Enable the "my_tool" tool');
    // "required tools" is fine — only the Enable instruction uses singular/plural
    expect(msg).not.toMatch(/Enable the "[^"]+" tools/);
  });
});

describe('shouldProcessToolFollowUp — strict-false guard', () => {
  const makeResp = (v: unknown) => ({
    role: 'tool',
    content: JSON.stringify({ shouldProcessFollowUp: v }),
  });

  it('null is NOT treated as opt-out (only strict false opts out)', () => {
    expect(shouldProcessToolFollowUp([makeResp(null)])).toBe(true);
  });

  it('0 is NOT treated as opt-out', () => {
    expect(shouldProcessToolFollowUp([makeResp(0)])).toBe(true);
  });

  it('false IS an opt-out', () => {
    expect(shouldProcessToolFollowUp([makeResp(false)])).toBe(false);
  });

  it('one opt-out in a batch of three causes the whole batch to opt out', () => {
    const responses = [
      { role: 'tool', content: JSON.stringify({ shouldProcessFollowUp: true }) },
      makeResp(false),
      { role: 'tool', content: '{}' },
    ];
    expect(shouldProcessToolFollowUp(responses)).toBe(false);
  });
});

describe('filterToolCallsByEnabled — case sensitivity', () => {
  const tc = (id: string, name: string) => ({
    type: 'function' as const,
    id,
    function: { name, arguments: '{}' },
  });

  it('name matching is case-sensitive (uppercase mismatch → disabled)', () => {
    const { enabled, disabled } = filterToolCallsByEnabled(
      [tc('c1', 'Kubernetes_api_request')],
      ['kubernetes_api_request']
    );
    expect(enabled).toHaveLength(0);
    expect(disabled).toHaveLength(1);
  });
});

describe('mergeApprovedArguments — immutability', () => {
  const tc = (id: string) => ({
    type: 'function' as const,
    id,
    function: { name: 'tool', arguments: '{"original":true}' },
  });

  it('does not mutate the original toolCalls array', () => {
    const calls = [tc('c1')];
    const original = calls[0].function.arguments;
    mergeApprovedArguments(calls, [{ id: 'c1', arguments: { new: true } }], ['c1']);
    expect(calls[0].function.arguments).toBe(original);
  });

  it('handles special characters in argument values', () => {
    const result = mergeApprovedArguments(
      [tc('c1')],
      [{ id: 'c1', arguments: { query: 'hello "world"' } }],
      ['c1']
    );
    expect(JSON.parse(result[0].function.arguments).query).toBe('hello "world"');
  });
});
