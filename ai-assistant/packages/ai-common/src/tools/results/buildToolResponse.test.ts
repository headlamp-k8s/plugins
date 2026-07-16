import { describe, expect, it } from 'vitest';
import {
  assembleFallbackResponseContent,
  buildConfirmationPlaceholderJson,
  buildFailedOperationsFallback,
  buildToolExecutionErrorJson,
  detectToolResponseError,
  formatToolResponseContent,
} from './buildToolResponse';

// =============================================================================
// detectToolResponseError
// =============================================================================

describe('detectToolResponseError', () => {
  it('returns isError:false for a successful JSON response', () => {
    const content = JSON.stringify({ pods: ['nginx', 'redis'], count: 2 });
    expect(detectToolResponseError(content)).toEqual({ isError: false, errorMsg: null });
  });

  it('returns isError:true and the message for { error: true }', () => {
    const content = JSON.stringify({ error: true, message: 'Not found' });
    const result = detectToolResponseError(content);
    expect(result.isError).toBe(true);
    expect(result.errorMsg).toBe('Not found');
  });

  it('defaults errorMsg to "Unknown error" when message is absent', () => {
    const content = JSON.stringify({ error: true });
    expect(detectToolResponseError(content).errorMsg).toBe('Unknown error');
  });

  it('returns isError:false when error is false', () => {
    const content = JSON.stringify({ error: false, data: 'ok' });
    expect(detectToolResponseError(content)).toEqual({ isError: false, errorMsg: null });
  });

  it('falls back to text heuristic when content is not JSON', () => {
    expect(detectToolResponseError('connection error occurred').isError).toBe(true);
    expect(detectToolResponseError('request failed with 404').isError).toBe(true);
  });

  it('returns the raw text as errorMsg in the text-heuristic path', () => {
    const { errorMsg } = detectToolResponseError('something failed here');
    expect(errorMsg).toBe('something failed here');
  });

  it('returns isError:false for plain non-error text', () => {
    expect(detectToolResponseError('all pods running').isError).toBe(false);
    expect(detectToolResponseError('namespace: kube-system').isError).toBe(false);
  });

  it('is case-insensitive for the text heuristic', () => {
    expect(detectToolResponseError('ERROR: disk full').isError).toBe(true);
    expect(detectToolResponseError('FAILED to connect').isError).toBe(true);
  });

  it('returns isError:false for empty string', () => {
    expect(detectToolResponseError('')).toEqual({ isError: false, errorMsg: null });
  });
});

// =============================================================================
// buildToolExecutionErrorJson
// =============================================================================

describe('buildToolExecutionErrorJson', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(buildToolExecutionErrorJson('my_tool', 'oops', {}))).not.toThrow();
  });

  it('sets error: true', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('my_tool', 'oops', {}));
    expect(parsed.error).toBe(true);
  });

  it('includes the tool name', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('kubernetes_api', 'timeout', {}));
    expect(parsed.toolName).toBe('kubernetes_api');
  });

  it('includes the error message', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('t', 'disk full', {}));
    expect(parsed.message).toBe('disk full');
  });

  it('includes the args as request', () => {
    const args = { namespace: 'default', path: '/api/v1/pods' };
    const parsed = JSON.parse(buildToolExecutionErrorJson('t', 'e', args));
    expect(parsed.request).toEqual(args);
  });

  it('includes a userFriendlyMessage mentioning the tool name', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('exec_tool', 'timeout', {}));
    expect(parsed.userFriendlyMessage).toContain('exec_tool');
    expect(parsed.userFriendlyMessage).toContain('timeout');
  });
});

// =============================================================================
// buildConfirmationPlaceholderJson
// =============================================================================

describe('buildConfirmationPlaceholderJson', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(buildConfirmationPlaceholderJson())).not.toThrow();
  });

  it('sets status to pending_confirmation', () => {
    const parsed = JSON.parse(buildConfirmationPlaceholderJson());
    expect(parsed.status).toBe('pending_confirmation');
  });

  it('sets shouldProcessFollowUp to false', () => {
    const parsed = JSON.parse(buildConfirmationPlaceholderJson());
    expect(parsed.shouldProcessFollowUp).toBe(false);
  });

  it('mentions the HTTP method when provided', () => {
    const parsed = JSON.parse(buildConfirmationPlaceholderJson('PUT'));
    expect(parsed.message).toContain('PUT');
  });

  it('uses a generic message when method is omitted', () => {
    const parsed = JSON.parse(buildConfirmationPlaceholderJson());
    expect(parsed.message).toContain('confirmation');
    expect(parsed.message).not.toContain('undefined');
  });

  it('uses a generic message when method is undefined', () => {
    const parsed = JSON.parse(buildConfirmationPlaceholderJson(undefined));
    expect(parsed.message).toContain('confirmation');
  });
});

// =============================================================================
// buildFailedOperationsFallback
// =============================================================================

describe('buildFailedOperationsFallback', () => {
  it('includes each failed operation in the output', () => {
    const ops = ['kubernetes_api: 404 not found', 'exec_tool: timeout'];
    const result = buildFailedOperationsFallback(ops);
    expect(result).toContain('kubernetes_api: 404 not found');
    expect(result).toContain('exec_tool: timeout');
  });

  it('prefixes each operation with "- "', () => {
    const result = buildFailedOperationsFallback(['a: err']);
    expect(result).toContain('- a: err');
  });

  it('contains the word CRITICAL', () => {
    expect(buildFailedOperationsFallback(['x: e'])).toContain('CRITICAL');
  });

  it('instructs the LLM to inform the user', () => {
    const result = buildFailedOperationsFallback(['x: e']);
    expect(result).toContain('inform the user');
  });

  it('handles a single operation', () => {
    const result = buildFailedOperationsFallback(['tool_a: failed']);
    expect(result).toContain('- tool_a: failed');
  });

  it('handles an empty list gracefully', () => {
    expect(() => buildFailedOperationsFallback([])).not.toThrow();
    expect(buildFailedOperationsFallback([])).toContain('CRITICAL');
  });
});

// =============================================================================
// formatToolResponseContent
// =============================================================================

describe('formatToolResponseContent', () => {
  it('returns pre-formatted MCP output unchanged', () => {
    const mcpPayload = JSON.stringify({ formatted: true, mcpOutput: '<table>...</table>' });
    expect(formatToolResponseContent(mcpPayload)).toBe(mcpPayload);
  });

  it('prefixes error responses with "Error: "', () => {
    const content = JSON.stringify({ error: true, message: 'pod not found' });
    expect(formatToolResponseContent(content)).toBe('Error: pod not found');
  });

  it('uses generic fallback when error has no message', () => {
    const content = JSON.stringify({ error: true });
    expect(formatToolResponseContent(content)).toContain('Tool execution failed');
  });

  it('returns userFriendlyMessage directly', () => {
    const content = JSON.stringify({ userFriendlyMessage: 'Deployment scaled to 3' });
    expect(formatToolResponseContent(content)).toBe('Deployment scaled to 3');
  });

  it('pretty-prints any other JSON object', () => {
    const content = JSON.stringify({ items: [1, 2, 3] });
    const result = formatToolResponseContent(content);
    expect(result).toContain('"items"');
    expect(result).toContain('  1'); // pretty-printed with indent
  });

  it('trims and returns plain text unchanged', () => {
    expect(formatToolResponseContent('  hello world  ')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(formatToolResponseContent('')).toBe('');
  });

  it('returns malformed JSON as trimmed plain text', () => {
    expect(formatToolResponseContent('{ invalid')).toBe('{ invalid');
  });
});

// =============================================================================
// assembleFallbackResponseContent
// =============================================================================

describe('assembleFallbackResponseContent', () => {
  it('returns empty string for an empty array', () => {
    expect(assembleFallbackResponseContent([])).toBe('');
  });

  it('returns just the content (no name prefix) for a single response', () => {
    const responses = [{ name: 'k8s_tool', content: JSON.stringify({ pods: [] }) }];
    const result = assembleFallbackResponseContent(responses);
    expect(result).not.toContain('k8s_tool:');
    expect(result).toContain('"pods"');
  });

  it('returns content without name when name is absent (single)', () => {
    const responses = [{ content: 'plain result' }];
    expect(assembleFallbackResponseContent(responses)).toBe('plain result');
  });

  it('prefixes each section with the tool name for multiple responses', () => {
    const responses = [
      { name: 'tool_a', content: 'result A' },
      { name: 'tool_b', content: 'result B' },
    ];
    const result = assembleFallbackResponseContent(responses);
    expect(result).toContain('tool_a: result A');
    expect(result).toContain('tool_b: result B');
  });

  it('separates multiple responses with a blank line', () => {
    const responses = [
      { name: 'a', content: 'first' },
      { name: 'b', content: 'second' },
    ];
    expect(assembleFallbackResponseContent(responses)).toContain('\n\n');
  });

  it('defaults tool name to "tool" when name is absent (multiple)', () => {
    const responses = [{ content: 'one' }, { content: 'two' }];
    const result = assembleFallbackResponseContent(responses);
    expect(result).toContain('tool: one');
    expect(result).toContain('tool: two');
  });

  it('runs each response through formatToolResponseContent', () => {
    const errorContent = JSON.stringify({ error: true, message: 'boom' });
    const responses = [
      { name: 'a', content: errorContent },
      { name: 'b', content: 'ok' },
    ];
    const result = assembleFallbackResponseContent(responses);
    expect(result).toContain('Error: boom');
    expect(result).toContain('ok');
  });

  it('trims trailing whitespace from the final result', () => {
    const responses = [
      { name: 'x', content: 'data' },
      { name: 'y', content: '  ' },
    ];
    expect(assembleFallbackResponseContent(responses)).not.toMatch(/\s+$/);
  });
});

// =============================================================================
// Edge-case / bug regression tests
// =============================================================================

describe('detectToolResponseError — strict vs loose error check', () => {
  it('requires error===true (strict): { error: "string" } is NOT detected as error', () => {
    // Intentional: strict check avoids false positives from non-boolean error fields.
    const result = detectToolResponseError(JSON.stringify({ error: 'yes', message: 'oops' }));
    expect(result.isError).toBe(false);
  });

  it('text heuristic: plain-text content with "error" word IS flagged', () => {
    expect(detectToolResponseError('connection error occurred').isError).toBe(true);
  });

  it('undefined errorMsg defaults to "Unknown error" when message absent', () => {
    const { errorMsg } = detectToolResponseError(JSON.stringify({ error: true }));
    expect(errorMsg).toBe('Unknown error');
  });
});

describe('formatToolResponseContent — loose error check', () => {
  it('{ error: "string" } IS shown as Error: for display (loose check)', () => {
    // Note: detectToolResponseError uses strict ===true but formatToolResponseContent
    // uses truthy — intentional asymmetry preserved from original code.
    const result = formatToolResponseContent(JSON.stringify({ error: 'yes', message: 'oops' }));
    expect(result).toContain('Error:');
  });

  it('handles JSON number at root level', () => {
    expect(formatToolResponseContent('42')).toBe('42');
  });

  it('handles JSON boolean at root level', () => {
    expect(formatToolResponseContent('true')).toBe('true');
  });

  it('"null" string produces "null" (safe passthrough)', () => {
    expect(formatToolResponseContent('null')).toBe('null');
  });

  it('userFriendlyMessage takes priority over pretty-printing', () => {
    const obj = { result: { lots: 'of data' }, userFriendlyMessage: 'Short message' };
    expect(formatToolResponseContent(JSON.stringify(obj))).toBe('Short message');
  });
});

describe('assembleFallbackResponseContent — edge cases', () => {
  it('single formatted MCP response passes through raw JSON unchanged', () => {
    const mcpContent = JSON.stringify({ formatted: true, mcpOutput: '<b>data</b>' });
    expect(assembleFallbackResponseContent([{ name: 'tool', content: mcpContent }])).toBe(
      mcpContent
    );
  });

  it('single response does NOT add a tool-name prefix', () => {
    const result = assembleFallbackResponseContent([{ name: 'my_tool', content: 'data' }]);
    expect(result).toBe('data');
    expect(result).not.toContain('my_tool:');
  });
});

describe('buildToolExecutionErrorJson — edge cases', () => {
  it('handles undefined args (request key present, value undefined → omitted)', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('tool', 'err', undefined));
    expect(parsed.error).toBe(true);
    expect(parsed.toolName).toBe('tool');
  });

  it('preserves array args', () => {
    const parsed = JSON.parse(buildToolExecutionErrorJson('t', 'e', [1, 2]));
    expect(parsed.request).toEqual([1, 2]);
  });
});
