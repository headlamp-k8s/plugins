import { describe, expect, it } from 'vitest';
import { parseCpu } from './parseCpu';
import { parseRam } from './parseRam';

describe('parseRam', () => {
  it.each([
    ['64Gi', 64 * 2 ** 30],
    ['700Mi', 700 * 2 ** 20],
    ['1.5Gi', 1.5 * 2 ** 30],
    ['2Pi', 2 * 2 ** 50],
    ['1Ei', 2 ** 60],
    ['1G', 1e9],
    ['1.5G', 1.5e9],
    ['500k', 500e3],
    ['1000', 1000],
    ['129e6', 129e6],
  ])('parses %s', (value, expected) => {
    expect(parseRam(value)).toBe(expected);
  });

  it.each(['', '0', 'abc', '1Gb', '1 Gi', '1KiB'])('returns 0 for %j', value => {
    expect(parseRam(value)).toBe(0);
  });
});

describe('parseCpu', () => {
  it.each([
    ['8', 8],
    ['1750m', 1.75],
    ['500m', 0.5],
    ['0.5', 0.5],
    ['250000u', 0.25],
    ['100000000n', 0.1],
  ])('parses %s', (value, expected) => {
    expect(parseCpu(value)).toBeCloseTo(expected, 9);
  });

  it('returns 0 for an empty value', () => {
    expect(parseCpu('')).toBe(0);
  });
});
