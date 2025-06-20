export function parseRam(ramStr: string): number {
  if (!ramStr) return 0;
  const match = ramStr.match(/^(\d+)([KMGT]i?)?$/i);
  if (!match) return 0;

  const num = parseInt(match[1]);
  const unit = match[2]?.toUpperCase();

  const units: Record<string, number> = {
    K: 1024,
    KI: 1024,
    M: 1024 * 1024,
    MI: 1024 * 1024,
    G: 1024 * 1024 * 1024,
    GI: 1024 * 1024 * 1024,
    T: 1024 * 1024 * 1024 * 1024,
    TI: 1024 * 1024 * 1024 * 1024,
  };

  return num * (units[unit] || 1);
}
