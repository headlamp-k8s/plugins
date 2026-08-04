import { describe, expect, it } from 'vitest';
import { formatObject } from './formatObject';

describe('formatObject', () => {
  it('formats flat objects as key/value pairs', () => {
    expect(formatObject({ branch: 'main', tag: 'v1' })).toBe('branch: main, tag: v1');
  });

  it('flattens nested objects with dotted keys', () => {
    expect(formatObject({ semver: { range: '1.x' } })).toBe('semver.range: 1.x');
  });

  it('joins array values', () => {
    expect(formatObject({ events: ['push', 'ping'] })).toBe('events: push; ping');
  });

  it('returns an empty string for nullish values', () => {
    expect(formatObject(undefined)).toBe('');
  });
});
