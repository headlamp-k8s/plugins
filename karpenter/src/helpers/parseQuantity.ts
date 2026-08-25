const BINARY_SI_POWERS: Record<string, number> = { Ki: 10, Mi: 20, Gi: 30, Ti: 40, Pi: 50, Ei: 60 };

const DECIMAL_SI_EXPONENTS: Record<string, number> = {
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

/**
 * Parses a Kubernetes resource quantity, such as `1750m`, `1.5Gi` or `1e3`, into a number.
 *
 * Accepts the quantity format of k8s.io/apimachinery: a signed decimal number, which may start
 * or end with its decimal point, and an optional suffix that is binary SI (`Ki` to `Ei`), decimal
 * SI (`n` to `E`) or a decimal exponent (`e3`, `E-3`). Suffixes are case-sensitive, so `1m` is
 * one thousandth and `1M` is one million.
 *
 * @param quantity - The quantity. A resource list can also hold it as a plain integer.
 * @returns The quantity in its base unit, such as cores or bytes, or 0 when it is not a valid
 *   quantity or is too large for a number.
 */
export function parseQuantity(quantity: string | number): number {
  const match = `${quantity}`.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:([KMGTPE]i)|([numkMGTPE])|[eE]([+-]?\d+))?$/
  );
  if (!match) return 0;

  const [, number, binarySuffix, decimalSuffix, exponent] = match;
  const value = binarySuffix
    ? Number(number) * 2 ** BINARY_SI_POWERS[binarySuffix]
    : Number(`${number}e${decimalSuffix ? DECIMAL_SI_EXPONENTS[decimalSuffix] : exponent ?? 0}`);

  return Number.isFinite(value) ? value : 0;
}
