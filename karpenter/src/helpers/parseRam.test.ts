import { describe, expect, it } from 'vitest';
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
