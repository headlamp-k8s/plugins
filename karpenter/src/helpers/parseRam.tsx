const quantitySuffixes: Record<string, number> = {
  n: 1e-9,
  u: 1e-6,
  m: 1e-3,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
};

const quantityPattern =
  /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(Ki|Mi|Gi|Ti|Pi|Ei|n|u|m|k|M|G|T|P|E)?$/;

export function parseQuantity(quantity: string): number {
  if (!quantity) return 0;
  const match = String(quantity).trim().match(quantityPattern);
  if (!match) return 0;

  return Number(match[1]) * (match[2] ? quantitySuffixes[match[2]] : 1);
}

export function parseRam(ramStr: string): number {
  return parseQuantity(ramStr);
}
