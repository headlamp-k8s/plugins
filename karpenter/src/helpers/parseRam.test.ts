import { describe, expect, it } from 'vitest';
import { parseCpu } from './parseCpu';
import { parseRam } from './parseRam';

const Ki = 1024;
const Mi = Ki * Ki;
const Gi = Mi * Ki;
const Ti = Gi * Ki;

describe('parseRam', () => {
  it('returns 0 for empty input', () => {
    expect(parseRam('')).toBe(0);
  });

  it('returns 0 for values it cannot parse', () => {
    expect(parseRam('abc')).toBe(0);
    expect(parseRam('1Gb')).toBe(0);
    expect(parseRam('1 Gi')).toBe(0);
    expect(parseRam('1KiB')).toBe(0);
  });

  it('returns 0 when an exponent is combined with a suffix', () => {
    expect(parseRam('1e3Gi')).toBe(0);
    expect(parseRam('1e3k')).toBe(0);
  });

  it('treats a plain number as bytes', () => {
    expect(parseRam('0')).toBe(0);
    expect(parseRam('1024')).toBe(1024);
  });

  it('parses binary units (Ki, Mi, Gi, Ti, Pi, Ei)', () => {
    expect(parseRam('1Ki')).toBe(Ki);
    expect(parseRam('1Mi')).toBe(Mi);
    expect(parseRam('2Gi')).toBe(2 * Gi);
    expect(parseRam('1Ti')).toBe(Ti);
    expect(parseRam('2Pi')).toBe(2 * 2 ** 50);
    expect(parseRam('1Ei')).toBe(2 ** 60);
  });

  it('parses decimal units (k, M, G, T) as powers of 1000', () => {
    expect(parseRam('500k')).toBe(500e3);
    expect(parseRam('1M')).toBe(1e6);
    expect(parseRam('1G')).toBe(1e9);
    expect(parseRam('1T')).toBe(1e12);
  });

  it('parses decimal values and exponents', () => {
    expect(parseRam('1.5Gi')).toBe(1.5 * Gi);
    expect(parseRam('1.5G')).toBe(1.5e9);
    expect(parseRam('129e6')).toBe(129e6);
    expect(parseRam('1E3')).toBe(1000);
  });

  it('is case-sensitive like Kubernetes quantities', () => {
    expect(parseRam('512mi')).toBe(0);
    expect(parseRam('2gi')).toBe(0);
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
