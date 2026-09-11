const DECIMAL_UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E'];

export function parseRam(ramStr: string): number {
  if (!ramStr) return 0;

  const match = `${ramStr}`.trim().match(/^(\d+(?:\.\d+)?)(?:([KMGTPE])(i)?)?$/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const exponent = DECIMAL_UNITS.indexOf(match[2]?.toUpperCase() ?? '');

  return num * (match[3] ? 1024 : 1000) ** exponent;
}
