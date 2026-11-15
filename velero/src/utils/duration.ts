const UNIT_NS: Record<string, bigint> = {
  h: BigInt('3600000000000'),
  m: BigInt('60000000000'),
  s: BigInt('1000000000'),
  ms: BigInt('1000000'),
  us: BigInt('1000'),
  µs: BigInt('1000'),
  μs: BigInt('1000'),
  ns: BigInt(1),
};

/** Largest time.Duration Go can store, in nanoseconds. */
const MAX_NS = BigInt('9223372036854775807');

const PART = /^(\d+)(?:\.(\d+))?(ns|us|µs|μs|ms|s|m|h)/;

/**
 * True when `value` is a non-negative Go duration, including `0` and `720h0m0s`.
 * Units are only ns, us, ms, s, m, and h, so `30d` is rejected.
 */
export function isGoDuration(value: string): boolean {
  const text = value.trim();
  if (text === '0') {
    return true;
  }
  if (!text || text.startsWith('-') || text.startsWith('+')) {
    return false;
  }

  let rest = text;
  let total = BigInt(0);
  while (rest.length > 0) {
    const match = PART.exec(rest);
    if (!match) {
      return false;
    }
    const fraction = match[2] ?? '';
    const unitNs = UNIT_NS[match[3]];
    const magnitude = BigInt(match[1] + fraction);
    const scale = BigInt(10) ** BigInt(fraction.length);
    const part = (magnitude * unitNs) / scale;
    if (total > MAX_NS - part) {
      return false;
    }
    total += part;
    rest = rest.slice(match[0].length);
  }
  return true;
}
