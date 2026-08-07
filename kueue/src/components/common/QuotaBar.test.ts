import { describe, expect, it } from 'vitest';
import { calculateQuotaPercentage } from './QuotaBar';

describe('QuotaBar percentage calculations', () => {
  it('calculates normal usage percentage correctly', () => {
    expect(calculateQuotaPercentage(4, 8)).toBe(50);
    expect(calculateQuotaPercentage(8, 8)).toBe(100);
    expect(calculateQuotaPercentage(0, 10)).toBe(0);
  });

  it('safely handles zero nominal quota without throwing NaN or Infinity', () => {
    expect(calculateQuotaPercentage(0, 0)).toBe(0);
    expect(calculateQuotaPercentage(5, 0)).toBe(100);
  });

  it('caps percentage within 0 to 100 range', () => {
    expect(calculateQuotaPercentage(15, 10)).toBe(100);
    expect(calculateQuotaPercentage(-5, 10)).toBe(0);
  });
});
