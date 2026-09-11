export function parseCpu(cpuStr: string): number {
  if (!cpuStr) return 0;

  const quantity = `${cpuStr}`.trim();
  const match = quantity.match(/^(\d+(?:\.\d+)?)(n|u|m)?$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2];

  const perCore: Record<string, number> = {
    n: 1e9,
    u: 1e6,
    m: 1e3,
  };

  return unit ? num / perCore[unit] : num;
}
