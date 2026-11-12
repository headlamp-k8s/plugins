import { describe, expect, it } from 'vitest';
import { calculateQuotaPercentage, parseResourceQuantity } from './QuotaBar';

describe('QuotaBar quantity parsing and percentage calculations', () => {
  describe('parseResourceQuantity', () => {
    it('parses numbers and numeric strings', () => {
      expect(parseResourceQuantity(10)).toBe(10);
      expect(parseResourceQuantity('10')).toBe(10);
      expect(parseResourceQuantity(0)).toBe(0);
    });

    it('parses milli, micro, and nano quantities like 500m, 250u, 100n', () => {
      expect(parseResourceQuantity('500m')).toBe(0.5);
      expect(parseResourceQuantity('1000m')).toBe(1);
      expect(parseResourceQuantity('250u')).toBe(0.00025);
      expect(parseResourceQuantity('100n')).toBeCloseTo(1e-7);
    });

    it('parses binary suffix quantities like Ki, Mi, Gi', () => {
      expect(parseResourceQuantity('1Ki')).toBe(1024);
      expect(parseResourceQuantity('2Mi')).toBe(2 * 1024 * 1024);
      expect(parseResourceQuantity('1Gi')).toBe(1024 * 1024 * 1024);
    });

    it('handles empty, dash, null, and undefined values safely', () => {
      expect(parseResourceQuantity('-')).toBe(0);
      expect(parseResourceQuantity('')).toBe(0);
      expect(parseResourceQuantity(null)).toBe(0);
      expect(parseResourceQuantity(undefined)).toBe(0);
    });
  });

  describe('calculateQuotaPercentage', () => {
    it('calculates normal usage percentage correctly', () => {
      expect(calculateQuotaPercentage(4, 8)).toBe(50);
      expect(calculateQuotaPercentage(8, 8)).toBe(100);
      expect(calculateQuotaPercentage(0, 10)).toBe(0);
    });

    it('calculates percentage with ResourceQuantity strings', () => {
      expect(calculateQuotaPercentage('500m', '1')).toBe(50);
      expect(calculateQuotaPercentage('1Gi', '2Gi')).toBe(50);
    });

    it('safely handles zero nominal quota without throwing NaN or Infinity', () => {
      expect(calculateQuotaPercentage(0, 0)).toBe(0);
      expect(calculateQuotaPercentage(5, 0)).toBe(100);
    });

    it('caps negative percentage at 0 but allows values above 100 for borrowed usage', () => {
      expect(calculateQuotaPercentage(15, 10)).toBe(150);
      expect(calculateQuotaPercentage(-5, 10)).toBe(0);
    });
  });
});
