/**
 * Utility functions to help filter Kubernetes API responses
 * This helps the AI assistant filter responses from the kubernetes_api_request tool
 */

// Filter pods by name prefix
export function filterPodsByPrefix(apiResponse: any, prefix: string): string[] {
  try {
    if (!apiResponse || !apiResponse.items) {
      return [];
    }

    const matchingPods = apiResponse.items
      .filter(pod => pod.metadata?.name?.startsWith(prefix))
      .map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace || 'default',
        status: pod.status?.phase,
      }));

    return matchingPods;
  } catch (error) {
    console.error('Error filtering pods by prefix:', error);
    return [];
  }
}

// Filter any resource by name prefix
export function filterResourcesByPrefix(apiResponse: any, prefix: string): any[] {
  try {
    if (!apiResponse || !apiResponse.items) {
      return [];
    }

    return apiResponse.items
      .filter(item => item.metadata?.name?.startsWith(prefix))
      .map(item => ({
        kind: item.kind,
        name: item.metadata.name,
        namespace: item.metadata.namespace || 'default',
        creationTimestamp: item.metadata.creationTimestamp,
      }));
  } catch (error) {
    console.error('Error filtering resources by prefix:', error);
    return [];
  }
}

// Filter any resource by namespace
export function filterResourcesByNamespace(apiResponse: any, namespace: string): any[] {
  try {
    if (!apiResponse || !apiResponse.items) {
      return [];
    }

    return apiResponse.items
      .filter(item => item.metadata?.namespace === namespace)
      .map(item => ({
        kind: item.kind,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        creationTimestamp: item.metadata.creationTimestamp,
      }));
  } catch (error) {
    console.error('Error filtering resources by namespace:', error);
    return [];
  }
}

// Format API response for better readability
export function formatApiResponseForDisplay(apiResponse: any): string {
  try {
    if (!apiResponse) {
      return 'No data available';
    }

    // Check if this is a list of items
    if (apiResponse.items && Array.isArray(apiResponse.items)) {
      return JSON.stringify(
        {
          kind: apiResponse.kind,
          apiVersion: apiResponse.apiVersion,
          items: apiResponse.items.map(item => ({
            kind: item.kind,
            name: item.metadata.name,
            namespace: item.metadata.namespace || 'default',
            creationTimestamp: item.metadata.creationTimestamp,
          })),
        },
        null,
        2
      );
    }

    // Single resource
    return JSON.stringify(apiResponse, null, 2);
  } catch (error) {
    console.error('Error formatting API response:', error);
    return JSON.stringify(apiResponse, null, 2);
  }
}
