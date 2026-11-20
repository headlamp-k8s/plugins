const decimalSuffixes: Record<string, number> = {
  n: -9,
  u: -6,
  m: -3,
  k: 3,
  M: 6,
  G: 9,
  T: 12,
  P: 15,
  E: 18,
};

const binarySuffixes: Record<string, number> = {
  Ki: 10,
  Mi: 20,
  Gi: 30,
  Ti: 40,
  Pi: 50,
  Ei: 60,
};

const quantityPattern =
  /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(Ki|Mi|Gi|Ti|Pi|Ei|[numkMGTPE])?$/;

function toCores(amount: number, suffix?: string): number {
  if (!suffix) {
    return amount;
  }

  if (suffix.endsWith('i')) {
    return amount * 2 ** binarySuffixes[suffix];
  }

  const exponent = decimalSuffixes[suffix];
  return exponent < 0 ? amount / 10 ** -exponent : amount * 10 ** exponent;
}

// CPU quantities are Kubernetes resource quantities: cores scaled by a decimal
// suffix (1750m is 1.75 cores), a binary suffix, or an exponent. Exponent form
// wins over the exa suffix, so 1E3 is a thousand cores and 1E is one exa-core.
export function parseCpu(value: unknown): number {
  const match = String(value ?? '')
    .trim()
    .match(quantityPattern);
  if (!match) {
    return 0;
  }

  const [, amount, suffix] = match;
  const cores = toCores(Number(amount), suffix);

  return Number.isFinite(cores) ? cores : 0;
}
