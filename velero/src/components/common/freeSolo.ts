/**
 * Include free-solo text the user typed but did not confirm with Enter.
 * Empty text and duplicates are left unchanged.
 */
export function commitPendingValue(selected: string[], pending: string): string[] {
  const text = pending.trim();
  if (!text || selected.includes(text)) {
    return selected;
  }
  return [...selected, text];
}
