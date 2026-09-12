import { describe, expect, it } from 'vitest';
import { parseDuration } from './duration';

describe('parseDuration', () => {
  it('parses single unit durations', () => {
    expect(parseDuration('30s')).toBe(30 * 1000);
    expect(parseDuration('5m')).toBe(5 * 60 * 1000);
    expect(parseDuration('1h')).toBe(60 * 60 * 1000);
  });

  it('adds up compound durations', () => {
    expect(parseDuration('1m30s')).toBe(90 * 1000);
    expect(parseDuration('1h0m0s')).toBe(60 * 60 * 1000);
  });

  it('reads milliseconds as milliseconds and not as minutes', () => {
    expect(parseDuration('500ms')).toBe(500);
    expect(parseDuration('250ms')).toBe(250);
  });

  it('keeps the fractional part', () => {
    expect(parseDuration('1.5s')).toBe(1500);
    expect(parseDuration('2.5m')).toBe(150 * 1000);
  });

  it('supports the sub millisecond units', () => {
    expect(parseDuration('100us')).toBeCloseTo(0.1);
    expect(parseDuration('100µs')).toBeCloseTo(0.1);
    expect(parseDuration('1000ns')).toBeCloseTo(0.001);
  });

  it('returns NaN when there is nothing to parse', () => {
    expect(parseDuration('')).toBeNaN();
    expect(parseDuration('later')).toBeNaN();
    expect(parseDuration(undefined)).toBeNaN();
  });
});
