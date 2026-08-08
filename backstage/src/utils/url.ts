/**
 * Validates a URL string for Backstage.
 * Only allows http and https schemes to prevent unsafe URI execution (e.g. javascript:, test:demo).
 *
 * @param url The URL string to validate
 * @returns true if valid http/https URL, false otherwise
 */
export function validateUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
