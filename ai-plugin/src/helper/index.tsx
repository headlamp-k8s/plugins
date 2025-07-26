export const formatString = function (a: string, ...args: any) {
  return a.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
};

// Helper function to check if a URL is requesting logs
export const isLogRequest = (url: string): boolean => {
  return url.includes('/log?') || url.endsWith('/log');
};

// Helper function to check if a URL is requesting a specific resource
export const isSpecificResourceRequestHelper = (url: string): boolean => {
  // This matches patterns like /api/v1/namespaces/default/pods/my-pod
  // But doesn't match /api/v1/namespaces/default/pods

  // Check if this is a simple resource type URL (list endpoint)
  if (/\/(?:api|apis)\/.*?\/\w+\/?$/.test(url)) {
    console.log('URL is a list endpoint:', url);
    return false;
  }

  // More specific resource pattern that should end with a resource name
  // Pattern like /api/v1/namespaces/default/pods/my-pod
  const specificResourcePattern = /\/(?:namespaces\/[\w-]+\/)?[\w-]+\/[\w-]+\/?$/;
  const isSpecific = specificResourcePattern.test(url);

  return isSpecific;
};
