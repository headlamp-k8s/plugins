const suffixDivisors: Record<string, number> = {
  n: 1e9,
  u: 1e6,
  m: 1e3,
};

const cpuQuantityPattern = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(n|u|m)?$/;

// CPU quantities are expressed in cores, optionally scaled by a decimal suffix:
// 1750m is 1.75 cores, not 1750 cores.
export function parseCpu(value: unknown): number {
  const match = String(value ?? '')
    .trim()
    .match(cpuQuantityPattern);
  if (!match) {
    return 0;
  }

  const [, amount, suffix] = match;
  const cores = Number(amount) / (suffix ? suffixDivisors[suffix] : 1);

  return Number.isFinite(cores) ? cores : 0;
}
