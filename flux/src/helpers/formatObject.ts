/**
 * Formats a plain object as readable "key: value" text, flattening nested keys with dots,
 * so screen readers don't announce JSON/YAML punctuation.
 */
export function formatObject(value: unknown, prefix = ''): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(item => formatObject(item, prefix)).join('; ');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, entry]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
          return Object.keys(entry).length > 0 ? formatObject(entry, fullKey) : fullKey;
        }
        return `${fullKey}: ${formatObject(entry)}`;
      })
      .join(', ');
  }
  return String(value);
}
