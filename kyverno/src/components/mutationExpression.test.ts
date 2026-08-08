import { describe, expect, test } from 'vitest';
import { getMutationExpression } from './mutationExpression';

describe('getMutationExpression', () => {
  test('reads the expression from a JSONPatch mutation', () => {
    expect(
      getMutationExpression({
        jsonPatch: { expression: '[JSONPatch{op: "add", path: "/metadata/labels/x", value: "y"}]' },
      })
    ).toBe('[JSONPatch{op: "add", path: "/metadata/labels/x", value: "y"}]');
  });

  test('reads the expression from an ApplyConfiguration mutation', () => {
    expect(
      getMutationExpression({ applyConfiguration: { expression: 'Object{spec: object.spec}' } })
    ).toBe('Object{spec: object.spec}');
  });

  test('uses a placeholder when the mutation has no expression', () => {
    expect(getMutationExpression({})).toBe('-');
  });
});
