/** Returns whether the URL targets a log endpoint. */
export const isLogRequest = (url: string): boolean => {
  return url.includes('/log?') || url.endsWith('/log') || url.includes('/log&');
};

/** Returns whether the URL points to a single Kubernetes resource instead of a list endpoint. */
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  let pathname = url;
  try {
    pathname = new URL(url, 'http://localhost').pathname;
  } catch {
    pathname = url.split(/[?#]/, 1)[0];
  }
  const segments = pathname.split('/').filter(Boolean);
  const apiSegments =
    segments[0] === 'api'
      ? segments.slice(2)
      : segments[0] === 'apis'
      ? segments.slice(3)
      : segments;
  const namespaceIndex = apiSegments.lastIndexOf('namespaces');
  const resourceSegments =
    namespaceIndex >= 0 ? apiSegments.slice(namespaceIndex + 2) : apiSegments;
  return resourceSegments.length >= 2 && resourceSegments.slice(-2).every(isResourceSegment);
};

function isResourceSegment(value: string): boolean {
  if (!value) return false;
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (
      !(
        (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        character === '_' ||
        character === '-'
      )
    ) {
      return false;
    }
  }
  return true;
}
