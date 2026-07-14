import { describe, expect, it, vi } from 'vitest';
import {
  createLLMResultCapture,
  mergeContentAcrossGenerations,
  mergeToolCallsAcrossGenerations,
} from './mergeGenerations';

// =============================================================================
// createLLMResultCapture
// =============================================================================

describe('createLLMResultCapture', () => {
  it('getResult returns null before handleLLMEnd is called', () => {
    const capture = createLLMResultCapture();
    expect(capture.getResult()).toBeNull();
  });

  it('getResult returns the value passed to handleLLMEnd', () => {
    const capture = createLLMResultCapture();
    const fakeResult = { generations: [[]] };
    capture.callback.handleLLMEnd(fakeResult);
    expect(capture.getResult()).toBe(fakeResult);
  });

  it('each createLLMResultCapture call is independent', () => {
    const a = createLLMResultCapture();
    const b = createLLMResultCapture();
    a.callback.handleLLMEnd('result-a');
    expect(a.getResult()).toBe('result-a');
    expect(b.getResult()).toBeNull();
  });

  it('handleLLMEnd can be called multiple times; last value wins', () => {
    const capture = createLLMResultCapture();
    capture.callback.handleLLMEnd('first');
    capture.callback.handleLLMEnd('second');
    expect(capture.getResult()).toBe('second');
  });

  it('callback object has the handleLLMEnd method LangChain expects', () => {
    const capture = createLLMResultCapture();
    expect(typeof capture.callback.handleLLMEnd).toBe('function');
  });
});

// =============================================================================
// mergeToolCallsAcrossGenerations
// =============================================================================

describe('mergeToolCallsAcrossGenerations', () => {
  it('returns initialToolCalls unchanged when they are already non-empty', () => {
    const initial = [{ id: 'c1', name: 'tool', args: {} }];
    const result = mergeToolCallsAcrossGenerations(initial, { generations: [[]] });
    expect(result).toBe(initial); // same reference
  });

  it('returns initialToolCalls unchanged when fullLLMResult is null', () => {
    const initial: unknown[] = [];
    expect(mergeToolCallsAcrossGenerations(initial, null)).toBe(initial);
  });

  it('returns initialToolCalls unchanged when fullLLMResult has no generations', () => {
    expect(mergeToolCallsAcrossGenerations([], {})).toEqual([]);
  });

  it('merges tool calls from secondary generations when initial is empty', () => {
    const tc = { id: 'c1', name: 'k8s', args: {} };
    const fullLLMResult = {
      generations: [[{ message: { tool_calls: [tc] } }]],
    };
    const result = mergeToolCallsAcrossGenerations([], fullLLMResult);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(tc);
  });

  it('merges tool calls from multiple secondary generations', () => {
    const tc1 = { id: 'c1', name: 'tool_a' };
    const tc2 = { id: 'c2', name: 'tool_b' };
    const fullLLMResult = {
      generations: [[{ message: { tool_calls: [tc1] } }, { message: { tool_calls: [tc2] } }]],
    };
    const result = mergeToolCallsAcrossGenerations([], fullLLMResult);
    expect(result).toHaveLength(2);
  });

  it('skips generations whose message has no tool_calls', () => {
    const tc = { id: 'c1', name: 'tool_a' };
    const fullLLMResult = {
      generations: [
        [
          { message: { content: 'some text' } }, // no tool_calls
          { message: { tool_calls: [tc] } },
        ],
      ],
    };
    expect(mergeToolCallsAcrossGenerations([], fullLLMResult)).toHaveLength(1);
  });

  it('skips generations with empty tool_calls array', () => {
    const fullLLMResult = {
      generations: [[{ message: { tool_calls: [] } }]],
    };
    expect(mergeToolCallsAcrossGenerations([], fullLLMResult)).toHaveLength(0);
  });

  it('handles generations where message is null/undefined gracefully', () => {
    const fullLLMResult = {
      generations: [[{ message: null }, { message: undefined }]],
    };
    expect(() => mergeToolCallsAcrossGenerations([], fullLLMResult)).not.toThrow();
    expect(mergeToolCallsAcrossGenerations([], fullLLMResult)).toHaveLength(0);
  });

  it('does not mutate the initial array', () => {
    const initial: unknown[] = [];
    const fullLLMResult = {
      generations: [[{ message: { tool_calls: [{ id: 'c1' }] } }]],
    };
    const result = mergeToolCallsAcrossGenerations(initial, fullLLMResult);
    expect(initial).toHaveLength(0); // original untouched
    expect(result).toHaveLength(1);
  });
});

// =============================================================================
// mergeContentAcrossGenerations
// =============================================================================

describe('mergeContentAcrossGenerations', () => {
  const identity = (c: unknown) => String(c ?? '');

  it('returns initialContent immediately when it is non-empty', () => {
    const result = mergeContentAcrossGenerations('hello', null, identity);
    expect(result).toBe('hello');
  });

  it('returns initialContent when fullLLMResult is null', () => {
    expect(mergeContentAcrossGenerations('', null, identity)).toBe('');
  });

  it('returns initialContent when fullLLMResult has no generations', () => {
    expect(mergeContentAcrossGenerations('', {}, identity)).toBe('');
  });

  it('extracts content from the first generation that has it', () => {
    const extractText = (c: unknown) => c as string;
    const fullLLMResult = {
      generations: [[{ message: { content: 'from secondary' } }]],
    };
    expect(mergeContentAcrossGenerations('', fullLLMResult, extractText)).toBe('from secondary');
  });

  it('skips generations whose extractText returns empty string', () => {
    const calls: unknown[] = [];
    const extractText = (c: unknown) => {
      calls.push(c);
      return c === 'good' ? 'good' : '';
    };
    const fullLLMResult = {
      generations: [[{ message: { content: 'bad' } }, { message: { content: 'good' } }]],
    };
    expect(mergeContentAcrossGenerations('', fullLLMResult, extractText)).toBe('good');
    expect(calls).toHaveLength(2);
  });

  it('returns empty string when no generation provides content', () => {
    const extractText = (_: unknown) => '';
    const fullLLMResult = {
      generations: [[{ message: { content: 'x' } }]],
    };
    expect(mergeContentAcrossGenerations('', fullLLMResult, extractText)).toBe('');
  });

  it('calls extractText with the message content', () => {
    const spy = vi.fn().mockReturnValue('extracted');
    const fullLLMResult = {
      generations: [[{ message: { content: 'raw content' } }]],
    };
    mergeContentAcrossGenerations('', fullLLMResult, spy);
    expect(spy).toHaveBeenCalledWith('raw content');
  });

  it('skips generations that have no content field', () => {
    const extractText = vi.fn().mockReturnValue('');
    const fullLLMResult = {
      generations: [[{ message: {} }]],
    };
    mergeContentAcrossGenerations('', fullLLMResult, extractText);
    expect(extractText).not.toHaveBeenCalled();
  });
});
