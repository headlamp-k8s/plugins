/**
 * Checks whether the given string is a valid HTTP or HTTPS URL.
 *
 * @param {string} value - The value to validate.
 * @returns {boolean} True if the value is a valid http/https URL, otherwise false.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
