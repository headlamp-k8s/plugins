const decimalExponents: Record<string, number> = {
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

const binaryFactors: Record<string, number> = {
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
};

const quantityPattern =
  /^([+-]?(?:\d+\.?\d*|\.\d+))(?:(Ki|Mi|Gi|Ti|Pi|Ei|n|u|m|k|M|G|T|P|E)|([eE][+-]?\d+))?$/;

export function parseQuantity(quantity: string): number {
  if (!quantity) return 0;
  const match = String(quantity).trim().match(quantityPattern);
  if (!match) return 0;

  const [, value, suffix, exponent] = match;
  if (suffix && suffix in binaryFactors) return Number(value) * binaryFactors[suffix];
  if (suffix) return Number(`${value}e${decimalExponents[suffix]}`);
  return Number(value + (exponent ?? ''));
}

export function parseRam(ramStr: string): number {
  return parseQuantity(ramStr);
}
