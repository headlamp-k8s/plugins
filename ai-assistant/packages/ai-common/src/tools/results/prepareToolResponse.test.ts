import { describe, expect, it } from 'vitest';
import {
  buildToolDataAnalysisRequest,
  fillMissingRequiredFields,
  isRegularConversationMessage,
} from './prepareToolResponse';

const baseUserContext = {
  userMessage: 'show pods in default namespace',
  conversationHistory: [],
  lastToolResults: {},
  timeContext: new Date(),
};

// =============================================================================
// isRegularConversationMessage
// =============================================================================

describe('isRegularConversationMessage', () => {
  it('returns true for a plain user message', () => {
    expect(isRegularConversationMessage({ role: 'user', content: 'hello' })).toBe(true);
  });

  it('returns true for an assistant message with no tool calls', () => {
    expect(isRegularConversationMessage({ role: 'assistant', content: 'Sure, here you go.' })).toBe(
      true
    );
  });

  it('returns false for a system message', () => {
    expect(isRegularConversationMessage({ role: 'system', content: 'You are...' })).toBe(false);
  });

  it('returns false for a tool message', () => {
    expect(
      isRegularConversationMessage({
        role: 'tool',
        content: '{"pods":[]}',
        toolCallId: 'c1',
      })
    ).toBe(false);
  });

  it('returns false for an assistant message that has pending tool calls', () => {
    expect(
      isRegularConversationMessage({
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'c1', function: { name: 'k8s', arguments: '{}' } }],
      })
    ).toBe(false);
  });

  it('returns true for an assistant message with an empty toolCalls array', () => {
    // toolCalls: [] has length 0, so the condition `toolCalls?.length` is falsy
    expect(
      isRegularConversationMessage({ role: 'assistant', content: 'done', toolCalls: [] })
    ).toBe(true);
  });

  it('returns false for display-only messages regardless of role', () => {
    expect(
      isRegularConversationMessage({
        role: 'assistant',
        content: 'spinner',
        isDisplayOnly: true,
      })
    ).toBe(false);
    expect(
      isRegularConversationMessage({ role: 'user', content: 'ui-only', isDisplayOnly: true })
    ).toBe(false);
  });

  it('returns false for a system message that is also display-only', () => {
    expect(
      isRegularConversationMessage({
        role: 'system',
        content: 'reminder',
        isDisplayOnly: true,
      })
    ).toBe(false);
  });
});

// =============================================================================
// buildToolDataAnalysisRequest
// =============================================================================

describe('buildToolDataAnalysisRequest', () => {
  it('includes the tool data verbatim', () => {
    const data = '{"pods": ["nginx", "redis"]}';
    expect(buildToolDataAnalysisRequest(data)).toContain(data);
  });

  it('asks the LLM to analyze the data', () => {
    const result = buildToolDataAnalysisRequest('some data');
    expect(result.toLowerCase()).toContain('analyze');
  });

  it('mentions the Kubernetes API as the data source', () => {
    expect(buildToolDataAnalysisRequest('x')).toContain('Kubernetes API');
  });

  it('instructs the LLM to answer the original question', () => {
    expect(buildToolDataAnalysisRequest('x')).toContain('original question');
  });

  it('handles empty tool data gracefully (returns a string)', () => {
    expect(typeof buildToolDataAnalysisRequest('')).toBe('string');
    expect(buildToolDataAnalysisRequest('').length).toBeGreaterThan(0);
  });

  it('data is placed between the intro and the instruction', () => {
    const result = buildToolDataAnalysisRequest('MY_DATA');
    const dataIdx = result.indexOf('MY_DATA');
    const introIdx = result.indexOf('Kubernetes API');
    const instrIdx = result.indexOf('analyze');
    // intro comes first, then data, then instruction
    expect(introIdx).toBeLessThan(dataIdx);
    expect(dataIdx).toBeLessThan(instrIdx);
  });
});

// =============================================================================
// fillMissingRequiredFields
// =============================================================================

describe('fillMissingRequiredFields', () => {
  it('fills a required field that is undefined', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const ctx = { ...baseUserContext, userMessage: 'list pods' };
    const result = fillMissingRequiredFields({}, schema, ctx);
    // namespace not in message → falls back to 'default'
    expect(result.namespace).toBe('default');
  });

  it('fills a required field that is null', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const result = fillMissingRequiredFields({ namespace: null }, schema, baseUserContext);
    expect(result.namespace).not.toBeNull();
  });

  it('fills a required field that is empty string', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const result = fillMissingRequiredFields({ namespace: '' }, schema, baseUserContext);
    expect(result.namespace).not.toBe('');
  });

  it('does NOT overwrite a required field that already has a value', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const result = fillMissingRequiredFields({ namespace: 'kube-system' }, schema, baseUserContext);
    expect(result.namespace).toBe('kube-system');
  });

  it('does NOT fill optional fields that are missing', () => {
    const schema = {
      properties: {
        namespace: { type: 'string' },
        label: { type: 'string' },
      },
      required: ['namespace'],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect('label' in result).toBe(false);
  });

  it('returns a shallow copy — original args object is not mutated', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const original: Record<string, unknown> = {};
    fillMissingRequiredFields(original, schema, baseUserContext);
    expect(original.namespace).toBeUndefined();
  });

  it('fills boolean required field with false default', () => {
    const schema = {
      properties: { watch: { type: 'boolean' } },
      required: ['watch'],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect(result.watch).toBe(false);
  });

  it('fills number required field with 0 default', () => {
    const schema = {
      properties: { port: { type: 'number' } },
      required: ['port'],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect(result.port).toBe(0);
  });

  it('fills object required field with {} default', () => {
    const schema = {
      properties: { config: { type: 'object' } },
      required: ['config'],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect(result.config).toEqual({});
  });

  it('handles empty required array (no fields to fill)', () => {
    const schema = {
      properties: { ns: { type: 'string' } },
      required: [],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect(result).toEqual({});
  });

  it('handles missing properties (no schema properties → no fills)', () => {
    const result = fillMissingRequiredFields({}, { required: ['ns'] }, baseUserContext);
    expect(result).toEqual({});
  });

  it('uses user message to extract namespace when mentioned', () => {
    const schema = {
      properties: { namespace: { type: 'string' } },
      required: ['namespace'],
    };
    const ctx = { ...baseUserContext, userMessage: 'list pods namespace: kube-system' };
    const result = fillMissingRequiredFields({}, schema, ctx);
    expect(result.namespace).toBe('kube-system');
  });

  it('fills multiple missing required fields in one call', () => {
    const schema = {
      properties: {
        namespace: { type: 'string' },
        watch: { type: 'boolean' },
        limit: { type: 'number' },
      },
      required: ['namespace', 'watch', 'limit'],
    };
    const result = fillMissingRequiredFields({}, schema, baseUserContext);
    expect(typeof result.namespace).toBe('string');
    expect(typeof result.watch).toBe('boolean');
    expect(typeof result.limit).toBe('number');
  });
});
