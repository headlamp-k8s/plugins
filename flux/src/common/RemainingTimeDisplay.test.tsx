import { describe, expect, it } from 'vitest';
import { formatRemainingTime } from './remainingTime';

describe('formatRemainingTime', () => {
  const now = 1700000000000;

  it('formats a seconds-scale future time', () => {
    expect(formatRemainingTime(now + 45 * 1000, now)).toBe('45s');
  });

  it('formats a minute-scale future time', () => {
    expect(formatRemainingTime(now + 5 * 60 * 1000, now)).toBe('5m');
  });
});
