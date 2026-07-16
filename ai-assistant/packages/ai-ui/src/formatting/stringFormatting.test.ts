import { describe, expect, it } from 'vitest';
import { formatString } from './stringFormatting';

describe('formatString', () => {
  it('replaces a basic placeholder', () => {
    expect(formatString('Hello {0}', 'World')).toBe('Hello World');
  });

  it('replaces multiple placeholders', () => {
    expect(formatString('{0} and {1}', 'A', 'B')).toBe('A and B');
  });

  it('keeps placeholders when args are missing', () => {
    expect(formatString('{0} {1}', 'A')).toBe('A {1}');
  });

  it('returns the original string when there are no placeholders', () => {
    expect(formatString('Hello world')).toBe('Hello world');
  });

  it('returns an empty string unchanged', () => {
    expect(formatString('')).toBe('');
  });

  it('replaces repeated placeholders', () => {
    expect(formatString('{0} {0}', 'X')).toBe('X X');
  });

  it('stringifies non-string replacement values', () => {
    expect(formatString('{0} {1} {2}', 42, true, null)).toBe('42 true null');
  });

  it('stringifies falsy defined values', () => {
    expect(formatString('{0}:{1}:{2}', 0, false, '')).toBe('0:false:');
  });

  it('preserves placeholders for explicit undefined and zero-padded indices', () => {
    expect(formatString('{0} {00} {01}', undefined, 'one')).toBe('{0} {00} {01}');
  });
});
