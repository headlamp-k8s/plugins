/** Returns whether the URL targets a log endpoint. */
export const isLogRequest = (url: string): boolean => {
  const resourceSegments = getResourcePathSegments(url);
  if (resourceSegments.length < 3) return false;
  const subresource = resourceSegments[resourceSegments.length - 1];
  return subresource === 'log' || subresource.startsWith('log&');
};

/**
 * Returns whether a relative or absolute URL targets a single Kubernetes resource.
 * Query strings and fragments do not affect classification.
 * Resource names are opaque path segments and are not validated here.
 *
 * @throws {TypeError} If the URL cannot be parsed; callers handle request setup errors.
 */
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  return getResourcePathSegments(url).length >= 2;
};

function getResourcePathSegments(url: string): string[] {
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
      return resourceSegments;
    }
    resourceSegments = resourceSegments.slice(2);
  }

  return resourceSegments;
}
