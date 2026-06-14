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
