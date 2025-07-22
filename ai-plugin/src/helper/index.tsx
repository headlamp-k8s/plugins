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

declare global {
  interface Window {
    /**
     * headlampBaseUrl is used to set the base URL for the app.
     *
     * When headlamp is compiled if a baseUrl is set, then it adds this variable to the
     * appropriate base URL from the environment.
     *
     * Read only.
     */
    headlampBaseUrl?: string;
  }
}

export function isElectron(): boolean {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    (window.process as any).type === 'renderer'
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!(process.versions as any).electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}

declare global {
  interface Window {
    /**
     * Used by docker desktop. If it's there, probably it's docker desktop.
     */
    ddClient: any | undefined;
  }
}

export function isDockerDesktop(): boolean {
  if (window?.ddClient === undefined) {
    return false;
  }
  return true;
}

export function getAppUrl(): string {
  let url = 'http://localhost:4466';
  if (isDockerDesktop()) {
    url = 'http://localhost:64446';
  }

  url += '/';

  return url;
}