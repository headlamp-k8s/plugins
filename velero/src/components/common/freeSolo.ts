/** Trim entries, drop blanks, and keep the first occurrence of each value. */
export function normalizeFreeSoloValues(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const text = value.trim();
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    normalized.push(text);
  }
  return normalized;
}

/**
 * Include free-solo text the user typed but did not confirm with Enter.
 * Confirmed values are trimmed and de-duplicated as well, because Enter and
 * blur store them directly and skip the pending-text path.
 */
export function commitPendingValue(selected: string[], pending: string): string[] {
  return normalizeFreeSoloValues([...selected, pending]);
}
