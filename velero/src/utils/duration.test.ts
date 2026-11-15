import { describe, expect, test } from 'vitest';
import { isGoDuration } from './duration';

describe('isGoDuration', () => {
  test('accepts Go durations used by Velero', () => {
    expect(isGoDuration('0')).toBe(true);
    expect(isGoDuration('720h0m0s')).toBe(true);
    expect(isGoDuration('1h30m')).toBe(true);
    expect(isGoDuration('1.5h')).toBe(true);
    expect(isGoDuration('.5h')).toBe(true);
    expect(isGoDuration('1.s')).toBe(true);
    expect(isGoDuration('1h.5m')).toBe(true);
  });

  test('rejects calendar days and values Go cannot store', () => {
    expect(isGoDuration('30d')).toBe(false);
    expect(isGoDuration('')).toBe(false);
    expect(isGoDuration('-1h')).toBe(false);
    expect(isGoDuration('2562048h')).toBe(false);
    expect(isGoDuration('.s')).toBe(false);
    expect(isGoDuration('1h.m')).toBe(false);
  });
});
