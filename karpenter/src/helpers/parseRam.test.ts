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
    expect(parseRam('1Xi')).toBe(0);
    expect(parseRam('1Gb')).toBe(0);
  });

  it('treats a plain number as bytes', () => {
    expect(parseRam('0')).toBe(0);
    expect(parseRam('1024')).toBe(1024);
    expect(parseRam(1073741824)).toBe(Gi);
  });

  it('parses binary units (Ki, Mi, Gi, Ti)', () => {
    expect(parseRam('1Ki')).toBe(Ki);
    expect(parseRam('1Mi')).toBe(Mi);
    expect(parseRam('2Gi')).toBe(2 * Gi);
    expect(parseRam('1Ti')).toBe(Ti);
  });

  it('parses decimal quantities', () => {
    expect(parseRam('1.5Gi')).toBe(1.5 * Gi);
    expect(parseRam('1.5G')).toBe(1.5e9);
    expect(parseRam('.5Gi')).toBe(0.5 * Gi);
    expect(parseRam('1.Gi')).toBe(Gi);
  });

  it('parses Pi and Ei', () => {
    expect(parseRam('2Pi')).toBe(2 * 1024 ** 5);
    expect(parseRam('2Ei')).toBe(2 * 1024 ** 6);
  });

  it('treats suffixes without i as decimal multiples', () => {
    expect(parseRam('1k')).toBe(1e3);
    expect(parseRam('1G')).toBe(1e9);
    expect(parseRam('1Gi')).toBe(Gi);
  });

  it('is case-sensitive, so m is milli and not mega', () => {
    expect(parseRam('512m')).toBe(0.512);
    expect(parseRam('512M')).toBe(512e6);
    expect(parseRam('512mi')).toBe(0);
    expect(parseRam('2gi')).toBe(0);
  });
});
