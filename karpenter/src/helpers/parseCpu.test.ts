import { parseCpu } from './parseCpu';

const Ki = 2 ** 10;
const Gi = 2 ** 30;
const Pi = 2 ** 50;
const Ei = 2 ** 60;

describe('parseCpu', () => {
  it.each([
    ['0', 0],
    ['1', 1],
    ['8', 8],
    ['16', 16],
  ])('parses whole cores: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it.each([
    ['1m', 0.001],
    ['500m', 0.5],
    ['700m', 0.7],
    ['1750m', 1.75],
    ['3500m', 3.5],
  ])('parses milli-cores: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it.each([
    ['500000u', 0.5],
    ['250000u', 0.25],
    ['100000000n', 0.1],
  ])('parses micro and nano cores: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it.each([
    ['1k', 1e3],
    ['2k', 2e3],
    ['12k', 12e3],
    ['1M', 1e6],
    ['1G', 1e9],
    ['1T', 1e12],
    ['1P', 1e15],
    ['1E', 1e18],
  ])('parses decimal SI suffixes: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it.each([
    ['1Ki', Ki],
    ['1.5Gi', 1.5 * Gi],
    ['2Pi', 2 * Pi],
    ['1Ei', Ei],
  ])('parses binary SI suffixes: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it.each([
    ['0.5', 0.5],
    ['.25', 0.25],
    ['1.75', 1.75],
    ['1e3', 1000],
    ['1.5e-1', 0.15],
  ])('parses decimal and exponent forms: %s', (quantity, expected) => {
    expect(parseCpu(quantity)).toBe(expected);
  });

  it('returns 0 for empty, null and undefined values', () => {
    expect(parseCpu('')).toBe(0);
    expect(parseCpu('   ')).toBe(0);
    expect(parseCpu(null)).toBe(0);
    expect(parseCpu(undefined)).toBe(0);
  });

  it('returns 0 for quantities it cannot parse', () => {
    expect(parseCpu('abc')).toBe(0);
    expect(parseCpu('m')).toBe(0);
    expect(parseCpu('1750mm')).toBe(0);
    expect(parseCpu('1 Gi')).toBe(0);
    expect(parseCpu('1KiB')).toBe(0);
    expect(parseCpu('1e')).toBe(0);
  });

  it('is case-sensitive like Kubernetes quantities', () => {
    expect(parseCpu('2gi')).toBe(0);
    expect(parseCpu('1K')).toBe(0);
  });

  it('returns 0 instead of Infinity for out-of-range values', () => {
    expect(parseCpu('1e999')).toBe(0);
  });
});
