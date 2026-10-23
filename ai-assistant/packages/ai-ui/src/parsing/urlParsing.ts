/** Returns whether the URL targets a log endpoint. */
export const isLogRequest = (url: string): boolean => {
  return url.includes('/log?') || url.endsWith('/log') || url.includes('/log&');
};

/**
 * Returns whether a relative or absolute URL targets a single Kubernetes resource.
 * Query strings and fragments do not affect classification.
 * Resource names are opaque path segments and are not validated here.
 *
 * @throws {TypeError} If the URL cannot be parsed; callers handle request setup errors.
 */
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  const segments = new URL(url, 'http://localhost').pathname.split('/').filter(Boolean);
  let resourceSegments =
    segments[0] === 'api'
      ? segments.slice(2)
      : segments[0] === 'apis'
      ? segments.slice(3)
      : segments;

  if (resourceSegments[0] === 'namespaces' && resourceSegments.length > 2) {
    // Core Namespace subresources are not namespaced resource collections.
    if (
      segments[0] === 'api' &&
      resourceSegments.length === 3 &&
      (resourceSegments[2] === 'status' || resourceSegments[2] === 'finalize')
    ) {
      return true;
    }
    resourceSegments = resourceSegments.slice(2);
  }

  return resourceSegments.length >= 2;
};
