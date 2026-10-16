/**
 * Replaces numbered placeholders such as `{0}` with supplied values.
 *
 * @param template - String containing zero-based numbered placeholders.
 * @param args - Defined values converted to strings when their canonical placeholder is present.
 * @returns Formatted string; placeholders with missing, undefined, or zero-padded indices remain.
 */
export function formatString(template: string, ...args: unknown[]): string {
  return template.replace(/{(\d+)}/g, (match, number: string) => {
    if (number.length > 1 && number.startsWith('0')) return match;
    const value = args[Number(number)];
    return value === undefined ? match : String(value);
  });
}

/**
 * Converts a name into a filesystem-safe file name segment.
 *
 * Unsafe character runs become `-`, and leading/trailing dashes are trimmed
 * with loops because `/^-+|-+$/g` is quadratic on long dash runs.
 *
 * @param name - Name to sanitize.
 * @param fallback - Value returned when nothing safe remains.
 * @returns Safe file name segment, or `fallback`.
 */
export function toSafeFileName(name: string, fallback: string): string {
  const replaced = name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  let start = 0;
  let end = replaced.length;
  while (start < end && replaced[start] === '-') start++;
  while (end > start && replaced[end - 1] === '-') end--;
  return replaced.slice(start, end) || fallback;
}
