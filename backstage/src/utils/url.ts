/**
 * Returns whether `url` is a valid http(s) base URL for a Backstage instance.
 */
export function isValidBackstageBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
