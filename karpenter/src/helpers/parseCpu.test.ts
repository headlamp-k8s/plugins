import { parseCpu } from './parseCpu';

describe('parseCpu', () => {
  it('returns 0 for missing or unparseable values', () => {
    expect(parseCpu('')).toBe(0);
    expect(parseCpu('abc')).toBe(0);
  });

  it('converts milli-cores to cores', () => {
    expect(parseCpu('1750m')).toBe(1.75);
    expect(parseCpu('500m')).toBe(0.5);
  });

  it('converts micro-cores and nano-cores to cores', () => {
    expect(parseCpu('500000u')).toBe(0.5);
    expect(parseCpu('500000000n')).toBe(0.5);
  });

  it('keeps unsuffixed quantities as cores', () => {
    expect(parseCpu('8')).toBe(8);
    expect(parseCpu('1.5')).toBe(1.5);
  });
});
