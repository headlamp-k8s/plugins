import { parseCpu } from './parseCpu';

describe('parseCpu', () => {
  it('should parse millicores correctly', () => {
    expect(parseCpu('500m')).toBe(0.5);
    expect(parseCpu('1000m')).toBe(1);
    expect(parseCpu('250m')).toBe(0.25);
    expect(parseCpu('1500m')).toBe(1.5);
  });

  it('should parse whole cores correctly', () => {
    expect(parseCpu('1')).toBe(1);
    expect(parseCpu('4')).toBe(4);
    expect(parseCpu('0.5')).toBe(0.5);
    expect(parseCpu(2)).toBe(2);
  });

  it('should handle falsy and invalid values', () => {
    expect(parseCpu('')).toBe(0);
    expect(parseCpu(undefined)).toBe(0);
    expect(parseCpu(null)).toBe(0);
    expect(parseCpu('invalid')).toBe(0);
  });
});
