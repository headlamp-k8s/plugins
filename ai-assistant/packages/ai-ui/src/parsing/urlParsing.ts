/** Returns whether the URL targets a log endpoint. */
export const isLogRequest = (url: string): boolean => {
  return url.includes('/log?') || url.endsWith('/log') || url.includes('/log&');
};

/** Returns whether the URL points to a single Kubernetes resource instead of a list endpoint. */
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  // This matches patterns like /api/v1/namespaces/default/pods/my-pod
  // But doesn't match /api/v1/namespaces/default/pods

  // Check if this is a simple resource type URL (list endpoint)
  if (/\/(?:api|apis)\/.*?\/\w+\/?$/.test(url)) {
    return false;
  }

  // More specific resource pattern that should end with a resource name
  // Pattern like /api/v1/namespaces/default/pods/my-pod
  const specificResourcePattern = /\/(?:namespaces\/[\w-]+\/)?[\w-]+\/[\w-]+\/?$/;
  const isSpecific = specificResourcePattern.test(url);

  return isSpecific;
};
