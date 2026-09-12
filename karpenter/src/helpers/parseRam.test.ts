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
    expect(parseRam('1.5Gi')).toBe(0); // decimals are not supported
    expect(parseRam('100Pi')).toBe(0); // unknown unit
  });

  it('treats a plain number as bytes', () => {
    expect(parseRam('0')).toBe(0);
    expect(parseRam('1024')).toBe(1024);
  });

  it('parses binary units (Ki, Mi, Gi, Ti)', () => {
    expect(parseRam('1Ki')).toBe(Ki);
    expect(parseRam('1Mi')).toBe(Mi);
    expect(parseRam('2Gi')).toBe(2 * Gi);
    expect(parseRam('1Ti')).toBe(Ti);
  });

  it('treats the K/M/G/T suffixes the same as their Ki/Mi/Gi/Ti forms', () => {
    expect(parseRam('1K')).toBe(Ki);
    expect(parseRam('1M')).toBe(Mi);
    expect(parseRam('1G')).toBe(Gi);
    expect(parseRam('1T')).toBe(Ti);
  });

  it('is case-insensitive', () => {
    expect(parseRam('512mi')).toBe(512 * Mi);
    expect(parseRam('2gi')).toBe(2 * Gi);
  });
});
