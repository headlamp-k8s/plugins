import { parseQuantity } from './parseQuantity';

describe('parseQuantity', () => {
  it('returns 0 for empty and invalid quantities', () => {
    expect(parseQuantity('')).toBe(0);
    expect(parseQuantity('abc')).toBe(0);
    expect(parseQuantity('.')).toBe(0);
    expect(parseQuantity('Gi')).toBe(0);
    expect(parseQuantity('1.5.5')).toBe(0);
    expect(parseQuantity('1 Gi')).toBe(0);
    expect(parseQuantity('1Xi')).toBe(0);
    expect(parseQuantity('1K')).toBe(0);
    expect(parseQuantity('1ki')).toBe(0);
    expect(parseQuantity('1mi')).toBe(0);
    expect(parseQuantity('1Gb')).toBe(0);
    expect(parseQuantity('1KiB')).toBe(0);
    expect(parseQuantity('1e')).toBe(0);
    expect(parseQuantity('1e+')).toBe(0);
    expect(parseQuantity('1e1.5')).toBe(0);
  });

  it('returns 0 for quantities too large for a number', () => {
    expect(parseQuantity('1e400')).toBe(0);
    expect(parseQuantity('-1e400')).toBe(0);
    expect(parseQuantity(`${'9'.repeat(400)}Ei`)).toBe(0);
    expect(parseQuantity('1e308')).toBe(1e308);
  });

  it('parses plain and signed numbers', () => {
    expect(parseQuantity('0')).toBe(0);
    expect(parseQuantity('8')).toBe(8);
    expect(parseQuantity('1.5')).toBe(1.5);
    expect(parseQuantity('+2')).toBe(2);
    expect(parseQuantity('-1.5')).toBe(-1.5);
    expect(parseQuantity(1000)).toBe(1000);
  });

  it('parses numbers with a leading or trailing decimal point', () => {
    expect(parseQuantity('.5')).toBe(0.5);
    expect(parseQuantity('1.')).toBe(1);
    expect(parseQuantity('.5Gi')).toBe(0.5 * 1024 ** 3);
    expect(parseQuantity('1.Gi')).toBe(1024 ** 3);
    expect(parseQuantity('-.5m')).toBe(-0.0005);
  });

  it('parses decimal SI suffixes', () => {
    expect(parseQuantity('500000000n')).toBe(0.5);
    expect(parseQuantity('500000u')).toBe(0.5);
    expect(parseQuantity('1750m')).toBe(1.75);
    expect(parseQuantity('3k')).toBe(3000);
    expect(parseQuantity('1.5M')).toBe(1.5e6);
    expect(parseQuantity('1G')).toBe(1e9);
    expect(parseQuantity('1T')).toBe(1e12);
    expect(parseQuantity('1P')).toBe(1e15);
    expect(parseQuantity('1E')).toBe(1e18);
  });

  it('parses binary SI suffixes', () => {
    expect(parseQuantity('1Ki')).toBe(1024);
    expect(parseQuantity('700Mi')).toBe(700 * 1024 ** 2);
    expect(parseQuantity('1.5Gi')).toBe(1.5 * 1024 ** 3);
    expect(parseQuantity('1Ti')).toBe(1024 ** 4);
    expect(parseQuantity('2Pi')).toBe(2 * 1024 ** 5);
    expect(parseQuantity('2Ei')).toBe(2 * 1024 ** 6);
  });

  it('parses decimal exponents', () => {
    expect(parseQuantity('1e3')).toBe(1000);
    expect(parseQuantity('1E3')).toBe(1000);
    expect(parseQuantity('1.5e3')).toBe(1500);
    expect(parseQuantity('1e+3')).toBe(1000);
    expect(parseQuantity('5e-1')).toBe(0.5);
    expect(parseQuantity('.5E-3')).toBe(0.0005);
  });

  it('reads suffixes case-sensitively', () => {
    expect(parseQuantity('1m')).toBe(0.001);
    expect(parseQuantity('1M')).toBe(1e6);
    expect(parseQuantity('1E')).toBe(1e18);
    expect(parseQuantity('1E1')).toBe(10);
  });
});
