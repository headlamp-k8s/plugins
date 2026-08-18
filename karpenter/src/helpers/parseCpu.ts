export function parseCpu(cpuStr: string | number | undefined | null): number {
  if (typeof cpuStr === 'number') return cpuStr;
  if (!cpuStr) return 0;
  const str = cpuStr.toString().trim();
  if (str.endsWith('m')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) ? 0 : val / 1000;
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}
