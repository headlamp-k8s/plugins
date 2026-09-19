import { parseRam } from './parseRam';

describe('parseRam', () => {
  it('returns 0 for missing or unparseable values', () => {
    expect(parseRam('')).toBe(0);
    expect(parseRam('abc')).toBe(0);
    expect(parseRam('1Xi')).toBe(0);
  });

  it('parses decimal quantities', () => {
    expect(parseRam('1.5Gi')).toBe(1.5 * 1024 ** 3);
    expect(parseRam('1.5G')).toBe(1.5e9);
  });

  it('parses Pi and Ei', () => {
    expect(parseRam('2Pi')).toBe(2 * 1024 ** 5);
    expect(parseRam('2Ei')).toBe(2 * 1024 ** 6);
  });

  it('treats suffixes without i as decimal multiples', () => {
    expect(parseRam('1G')).toBe(1e9);
    expect(parseRam('1Gi')).toBe(1024 ** 3);
  });

  it('parses plain byte counts and existing binary units', () => {
    expect(parseRam('1000')).toBe(1000);
    expect(parseRam('64Gi')).toBe(68719476736);
    expect(parseRam('700Mi')).toBe(734003200);
  });
});
