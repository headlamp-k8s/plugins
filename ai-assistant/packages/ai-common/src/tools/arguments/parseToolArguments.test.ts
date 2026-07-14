import { describe, expect, it } from 'vitest';
import {
  checkIfArgumentsComplete,
  identifyEnhancedFields,
  parseArgumentsFromResponse,
  sanitizeLLMArguments,
} from './parseToolArguments';

// =============================================================================
// checkIfArgumentsComplete
// =============================================================================

describe('checkIfArgumentsComplete', () => {
  const schema = {
    required: ['namespace', 'name'],
    properties: {
      namespace: { type: 'string' },
      name: { type: 'string' },
      replicas: { type: 'number' },
    },
  };

  it('returns true when all required fields are present and non-empty', () => {
    expect(checkIfArgumentsComplete({ namespace: 'default', name: 'my-pod' }, schema)).toBe(true);
  });

  it('returns false when a required field is missing', () => {
    expect(checkIfArgumentsComplete({ namespace: 'default' }, schema)).toBe(false);
  });

  it('returns false when a required field is undefined', () => {
    expect(checkIfArgumentsComplete({ namespace: 'default', name: undefined }, schema)).toBe(false);
  });

  it('returns false when a required field is null', () => {
    expect(checkIfArgumentsComplete({ namespace: 'default', name: null }, schema)).toBe(false);
  });

  it('returns false when a required field is an empty string', () => {
    expect(checkIfArgumentsComplete({ namespace: '', name: 'foo' }, schema)).toBe(false);
  });

  // ── placeholder detection ─────────────────────────────────────────────────

  it('returns false when a required field contains "<optional"', () => {
    expect(checkIfArgumentsComplete({ namespace: '<optional value>', name: 'foo' }, schema)).toBe(
      false
    );
  });

  it('returns false when a required field contains "optional:"', () => {
    expect(
      checkIfArgumentsComplete({ namespace: 'optional: any namespace', name: 'foo' }, schema)
    ).toBe(false);
  });

  it('returns false when a required field is "tbd" (case-insensitive)', () => {
    expect(checkIfArgumentsComplete({ namespace: 'TBD', name: 'foo' }, schema)).toBe(false);
    expect(checkIfArgumentsComplete({ namespace: 'tbd', name: 'foo' }, schema)).toBe(false);
  });

  it('returns false when a required field is "not specified" (case-insensitive)', () => {
    expect(checkIfArgumentsComplete({ namespace: 'Not Specified', name: 'foo' }, schema)).toBe(
      false
    );
  });

  it('returns false when an optional field contains a placeholder', () => {
    expect(
      checkIfArgumentsComplete(
        { namespace: 'default', name: 'foo', extra: '<optional>' },
        { required: ['namespace', 'name'], properties: {} }
      )
    ).toBe(false);
  });

  // ── numeric field validation ──────────────────────────────────────────────

  it('returns false when a number-typed property is passed as a non-numeric string', () => {
    expect(
      checkIfArgumentsComplete({ namespace: 'default', name: 'foo', replicas: 'three' }, schema)
    ).toBe(false);
  });

  it('returns true when a number-typed property is passed as a valid numeric string', () => {
    expect(
      checkIfArgumentsComplete({ namespace: 'default', name: 'foo', replicas: '3' }, schema)
    ).toBe(true);
  });

  it('returns true when a number-typed property is already a number', () => {
    expect(
      checkIfArgumentsComplete({ namespace: 'default', name: 'foo', replicas: 3 }, schema)
    ).toBe(true);
  });

  // ── edge cases ────────────────────────────────────────────────────────────

  it('returns true for empty args against a schema with no required fields', () => {
    expect(checkIfArgumentsComplete({}, { required: [], properties: {} })).toBe(true);
  });

  it('returns true for empty args against a schema with no required array', () => {
    expect(checkIfArgumentsComplete({}, {})).toBe(true);
  });
});

// =============================================================================
// parseArgumentsFromResponse
// =============================================================================

describe('parseArgumentsFromResponse', () => {
  it('parses a clean JSON object string', () => {
    const result = parseArgumentsFromResponse('{"namespace":"default","name":"nginx"}');
    expect(result).toEqual({ namespace: 'default', name: 'nginx' });
  });

  it('extracts JSON embedded in surrounding prose', () => {
    const response = 'Sure! Here are the arguments:\n{"namespace":"kube-system"}\nLet me know!';
    expect(parseArgumentsFromResponse(response)).toEqual({ namespace: 'kube-system' });
  });

  it('returns {} when the response contains no JSON object', () => {
    expect(parseArgumentsFromResponse('sorry, I cannot help with that')).toEqual({});
  });

  it('returns {} for an empty string', () => {
    expect(parseArgumentsFromResponse('')).toEqual({});
  });

  it('returns {} for malformed JSON', () => {
    expect(parseArgumentsFromResponse('{ bad json }')).toEqual({});
  });

  it('strips null values via sanitizeLLMArguments', () => {
    const result = parseArgumentsFromResponse('{"namespace":"default","name":null}');
    expect(result).not.toHaveProperty('name');
    expect(result).toHaveProperty('namespace', 'default');
  });

  it('strips placeholder strings via sanitizeLLMArguments', () => {
    const result = parseArgumentsFromResponse('{"namespace":"<optional namespace>","name":"foo"}');
    expect(result).not.toHaveProperty('namespace');
    expect(result).toHaveProperty('name', 'foo');
  });

  it('coerces numeric strings for known numeric fields', () => {
    const result = parseArgumentsFromResponse('{"count":"3","name":"pod"}');
    expect(result).toEqual({ count: 3, name: 'pod' });
  });
});

// =============================================================================
// sanitizeLLMArguments
// =============================================================================

describe('sanitizeLLMArguments', () => {
  // ── null / undefined removal ──────────────────────────────────────────────

  it('drops null values', () => {
    expect(sanitizeLLMArguments({ a: null, b: 'keep' })).toEqual({ b: 'keep' });
  });

  it('drops undefined values', () => {
    expect(sanitizeLLMArguments({ a: undefined, b: 'keep' })).toEqual({ b: 'keep' });
  });

  // ── placeholder string removal ────────────────────────────────────────────

  it('drops strings containing "<optional"', () => {
    expect(sanitizeLLMArguments({ ns: '<optional namespace>' })).toEqual({});
  });

  it('drops strings containing "optional:"', () => {
    expect(sanitizeLLMArguments({ ns: 'optional: anything' })).toEqual({});
  });

  it('drops strings equal to "tbd" (case-insensitive)', () => {
    expect(sanitizeLLMArguments({ ns: 'TBD' })).toEqual({});
    expect(sanitizeLLMArguments({ ns: 'tbd' })).toEqual({});
  });

  it('drops strings equal to "not specified" (case-insensitive)', () => {
    expect(sanitizeLLMArguments({ ns: 'Not Specified' })).toEqual({});
  });

  it('drops strings equal to "n/a" (case-insensitive)', () => {
    expect(sanitizeLLMArguments({ ns: 'N/A' })).toEqual({});
    expect(sanitizeLLMArguments({ ns: 'n/a' })).toEqual({});
  });

  it('drops empty / whitespace-only strings', () => {
    expect(sanitizeLLMArguments({ ns: '', label: '   ' })).toEqual({});
  });

  // ── numeric coercion ──────────────────────────────────────────────────────

  it('coerces numeric strings for "count" fields', () => {
    expect(sanitizeLLMArguments({ count: '5' })).toEqual({ count: 5 });
  });

  it('coerces numeric strings for "price" fields', () => {
    expect(sanitizeLLMArguments({ price: '19.99' })).toEqual({ price: 19.99 });
  });

  it('coerces numeric strings for "adult" / "child" / "infant" / "pet" fields', () => {
    expect(sanitizeLLMArguments({ adults: '2', children: '1', infants: '0', pets: '1' })).toEqual({
      adults: 2,
      children: 1,
      infants: 0,
      pets: 1,
    });
  });

  it('does NOT coerce numeric strings for non-numeric field names', () => {
    expect(sanitizeLLMArguments({ name: '42', namespace: '3' })).toEqual({
      name: '42',
      namespace: '3',
    });
  });

  it('does NOT coerce non-numeric strings even for numeric field names', () => {
    expect(sanitizeLLMArguments({ count: 'three' })).toEqual({ count: 'three' });
  });

  // ── negative value dropping for person/pet counts ─────────────────────────

  it('drops negative values for "pet" fields', () => {
    expect(sanitizeLLMArguments({ pets: -1 })).toEqual({});
  });

  it('drops negative values for "adult" fields', () => {
    expect(sanitizeLLMArguments({ adults: -2 })).toEqual({});
  });

  it('drops negative values for "child" fields', () => {
    expect(sanitizeLLMArguments({ children: -1 })).toEqual({});
  });

  it('drops negative values for "infant" fields', () => {
    expect(sanitizeLLMArguments({ infants: -1 })).toEqual({});
  });

  it('keeps negative numbers for non-person fields', () => {
    expect(sanitizeLLMArguments({ temperature: -10 })).toEqual({ temperature: -10 });
  });

  it('keeps zero for person/pet fields', () => {
    expect(sanitizeLLMArguments({ pets: 0 })).toEqual({ pets: 0 });
  });

  // ── recursive / nested objects ────────────────────────────────────────────

  it('recursively sanitises nested plain objects', () => {
    const input = {
      metadata: { name: 'nginx', labels: { env: 'tbd' } },
      spec: { replicas: null },
    };
    expect(sanitizeLLMArguments(input)).toEqual({
      metadata: { name: 'nginx', labels: {} },
      spec: {},
    });
  });

  it('does NOT recurse into arrays', () => {
    // Arrays pass through as-is
    const input = { items: ['a', null, 'b'] };
    expect(sanitizeLLMArguments(input)).toEqual({ items: ['a', null, 'b'] });
  });

  // ── passthrough ────────────────────────────────────────────────────────────

  it('keeps boolean values', () => {
    expect(sanitizeLLMArguments({ watch: true, dry: false })).toEqual({
      watch: true,
      dry: false,
    });
  });

  it('keeps valid non-placeholder strings', () => {
    expect(sanitizeLLMArguments({ namespace: 'kube-system' })).toEqual({
      namespace: 'kube-system',
    });
  });

  it('returns an empty object for an empty input', () => {
    expect(sanitizeLLMArguments({})).toEqual({});
  });
});

// =============================================================================
// identifyEnhancedFields
// =============================================================================

describe('identifyEnhancedFields', () => {
  it('returns fields present in enhanced but absent from original', () => {
    expect(identifyEnhancedFields({}, { namespace: 'default' })).toEqual(['namespace']);
  });

  it('returns fields whose value changed', () => {
    expect(identifyEnhancedFields({ namespace: 'old' }, { namespace: 'new' })).toEqual([
      'namespace',
    ]);
  });

  it('returns fields where original value was null', () => {
    expect(identifyEnhancedFields({ ns: null }, { ns: 'default' })).toEqual(['ns']);
  });

  it('returns fields where original value was undefined', () => {
    expect(identifyEnhancedFields({ ns: undefined }, { ns: 'default' })).toEqual(['ns']);
  });

  it('returns fields where original value was empty string', () => {
    expect(identifyEnhancedFields({ ns: '' }, { ns: 'default' })).toEqual(['ns']);
  });

  it('does NOT return fields whose value is unchanged', () => {
    expect(identifyEnhancedFields({ namespace: 'default' }, { namespace: 'default' })).toEqual([]);
  });

  it('does NOT return the "_llmEnhanced" metadata key', () => {
    const enhanced = { _llmEnhanced: { enhanced: true }, namespace: 'default' };
    const result = identifyEnhancedFields({}, enhanced);
    expect(result).not.toContain('_llmEnhanced');
    expect(result).toContain('namespace');
  });

  it('compares nested objects by JSON value, not reference', () => {
    const orig = { labels: { env: 'prod' } };
    const enh = { labels: { env: 'prod' } }; // same structure, different reference
    expect(identifyEnhancedFields(orig, enh)).toEqual([]);
  });

  it('detects changed nested objects', () => {
    const orig = { labels: { env: 'dev' } };
    const enh = { labels: { env: 'prod' } };
    expect(identifyEnhancedFields(orig, enh)).toEqual(['labels']);
  });

  it('returns all changed keys when multiple fields differ', () => {
    const orig = { namespace: 'default', name: '' };
    const enh = { namespace: 'kube-system', name: 'nginx', replicas: 3 };
    expect(identifyEnhancedFields(orig, enh).sort()).toEqual(
      ['name', 'namespace', 'replicas'].sort()
    );
  });

  it('returns empty array when original and enhanced are identical', () => {
    const obj = { namespace: 'default', name: 'nginx' };
    expect(identifyEnhancedFields(obj, { ...obj })).toEqual([]);
  });

  it('returns empty array for two empty objects', () => {
    expect(identifyEnhancedFields({}, {})).toEqual([]);
  });
});

// =============================================================================
// Edge-case / bug regression tests
// =============================================================================

describe('checkIfArgumentsComplete — boundary values', () => {
  const numSchema = { required: ['n'], properties: { n: { type: 'number' } } };

  it('0 is a valid value (falsy but not empty)', () => {
    expect(checkIfArgumentsComplete({ n: 0 }, numSchema)).toBe(true);
  });

  it('false boolean is a valid value', () => {
    const s = { required: ['flag'], properties: { flag: { type: 'boolean' } } };
    expect(checkIfArgumentsComplete({ flag: false }, s)).toBe(true);
  });

  it('negative numeric string "-5" is valid for number type', () => {
    expect(checkIfArgumentsComplete({ n: '-5' }, numSchema)).toBe(true);
  });

  it('decimal string "3.14" is valid for number type', () => {
    const s = { required: ['r'], properties: { r: { type: 'number' } } };
    expect(checkIfArgumentsComplete({ r: '3.14' }, s)).toBe(true);
  });

  it('"tbd" detection is case-insensitive (TBD, Tbd all caught)', () => {
    const s = { required: ['x'], properties: { x: { type: 'string' } } };
    expect(checkIfArgumentsComplete({ x: 'TBD' }, s)).toBe(false);
    expect(checkIfArgumentsComplete({ x: 'Tbd' }, s)).toBe(false);
  });
});

describe('sanitizeLLMArguments — boundary values', () => {
  it('preserves 0 (falsy number)', () => {
    expect(sanitizeLLMArguments({ port: 0 })).toEqual({ port: 0 });
  });

  it('preserves false boolean', () => {
    expect(sanitizeLLMArguments({ watch: false })).toEqual({ watch: false });
  });

  it('preserves empty array (not a placeholder)', () => {
    expect(sanitizeLLMArguments({ items: [] })).toEqual({ items: [] });
  });

  it('does NOT recurse into arrays — null inside array stays', () => {
    expect(sanitizeLLMArguments({ list: [null, 'a'] })).toEqual({ list: [null, 'a'] });
  });

  it('string "false" is not a placeholder — kept as-is', () => {
    expect(sanitizeLLMArguments({ mode: 'false' })).toEqual({ mode: 'false' });
  });

  it('numeric string in a non-numeric field name stays as string', () => {
    expect(sanitizeLLMArguments({ namespace: '42' })).toEqual({ namespace: '42' });
  });

  it('negative pet count is dropped; zero pet count is kept', () => {
    expect(sanitizeLLMArguments({ pets: -1 })).toEqual({});
    expect(sanitizeLLMArguments({ pets: 0 })).toEqual({ pets: 0 });
  });
});
