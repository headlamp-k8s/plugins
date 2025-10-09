import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply, clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import YAML from 'yaml';
import { isLogRequest, isSpecificResourceRequestHelper } from '.';

// Deep merge function to merge patch with current resource
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] === null) {
      // If source value is null, remove the property
      delete result[key];
    } else if (source[key] !== undefined) {
      if (Array.isArray(source[key])) {
        // For arrays, replace entirely
        result[key] = [...source[key]];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        // For objects, recursively merge
        // Initialize target[key] as empty object if it doesn't exist or isn't an object
        if (!result[key] || typeof result[key] !== 'object' || Array.isArray(result[key])) {
          result[key] = {};
        }
        result[key] = deepMerge(result[key], source[key]);
      } else {
        // For primitive values, replace
        result[key] = source[key];
      }
    }
  }

  return result;
}

const cleanUrl = (url: string) => {
  const urlObj = new URL(url, 'http://dummy.com'); // Use dummy base for relative URLs
  urlObj.searchParams.delete('allNamespaces');
  return urlObj.pathname + urlObj.search;
};

// Function to handle the actual API request after confirmation
export const handleActualApiRequest = async (
  url: string,
  method: string,
  body: string = '',
  dialogClose: () => void,
  aiManager: any,
  resourceInfo: string,
  targetCluster?: string, // Allow specifying a specific cluster
  onFailure?: (error: any, operationType: string, resourceInfo?: any) => void, // Optional failure callback
  onSuccess?: (response: any, operationType: string, resourceInfo?: any) => void // Optional success callback
) => {
  const cluster = targetCluster || getCluster();

  // If no cluster is provided and no current cluster, try to get any available cluster
  if (!cluster) {
    // This is a fallback - ideally the cluster should be provided through the context
    console.warn('No cluster available for API request');
    return JSON.stringify({
      error: true,
      message:
        'No cluster available for API request. Please ensure you are in a cluster context or have clusters configured.',
      suggestion: 'Try navigating to a specific cluster view or check your cluster configuration.',
    });
  }

  // For POST operations
  if (method.toUpperCase() === 'POST' && body) {
    // Parse resource first, fail fast
    let resource;
    try {
      resource = YAML.parse(body);
    } catch (yamlError) {
      try {
        resource = JSON.parse(body);
      } catch (jsonError) {
        // Handle parsing errors specifically
        const parsingError = `Failed to parse resource body. YAML error: ${yamlError.message}. JSON error: ${jsonError.message}`;
        if (onFailure) {
          const parsedResourceInfo = resourceInfo ? JSON.parse(resourceInfo) : {};
          onFailure(new Error(parsingError), 'POST', parsedResourceInfo);
        }
        aiManager.history.push({
          error: true,
          role: 'assistant',
          content: `Error parsing resource: ${parsingError}`,
        });
        return;
      }
    }

    dialogClose();

    // Handle API call separately
    try {
      const response = await new Promise(resolve => {
        clusterAction(
          async () => {
            try {
              const response = await apply(resource, cluster);
              aiManager.history.push({
                role: 'tool',
                content: `${resource.kind || 'Resource'} ${
                  response.metadata.name
                } created successfully.`,
              });

              // Call the success callback if provided
              if (onSuccess) {
                const parsedResourceInfo = resourceInfo ? JSON.parse(resourceInfo) : {};
                onSuccess(response, 'POST', parsedResourceInfo);
              }

              resolve(
                JSON.stringify({
                  role: 'tool',
                  content: `${resource.kind || 'Resource'} ${
                    response.metadata.name
                  } created successfully.`,
                })
              );
            } catch (apiError) {
              // Call the failure callback if provided
              if (onFailure) {
                const parsedResourceInfo = resourceInfo ? JSON.parse(resourceInfo) : {};
                onFailure(apiError, 'POST', parsedResourceInfo);
              }

              resolve(
                JSON.stringify({
                  error: true,
                  message: `Failed to create ${resource.kind || 'resource'}: ${apiError.message}`,
                })
              );
            }
          },
          {
            startMessage: `Creating ${resource.kind || 'resource'} in cluster ${cluster}...`,
            cancelledMessage: `Cancelled creating resource in cluster.`,
            successMessage: `${resource.kind || 'Resource'} created successfully.`,
            errorMessage: `Failed to create resource.`,
          }
        );
      });
      return response;
    } catch (clusterActionError) {
      // Handle cluster action setup errors
      if (onFailure) {
        const parsedResourceInfo = resourceInfo ? JSON.parse(resourceInfo) : {};
        onFailure(clusterActionError, 'POST', parsedResourceInfo);
      }

      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error setting up cluster action: ${clusterActionError.message}`,
      });
    }
  }

  // For DELETE operations
  if (method.toUpperCase() === 'DELETE' && body) {
    // Parse resource identifier first, fail fast
    let resourceIdentifier;
    try {
      resourceIdentifier = JSON.parse(body);
    } catch (parseError) {
      // Handle parsing errors specifically
      const parsingError = `Failed to parse resource identifier: ${parseError.message}`;
      if (onFailure) {
        onFailure(new Error(parsingError), 'DELETE', {});
      }
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error parsing resource identifier: ${parsingError}`,
      });
      return;
    }

    dialogClose();

    // Handle API call separately
    try {
      await clusterRequest(url, {
        method: 'DELETE',
        cluster,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      aiManager.history.push({
        role: 'tool',
        success: true,
        content: `${resourceIdentifier.kind} ${resourceIdentifier.name} deleted successfully.`,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(resourceIdentifier, 'DELETE', resourceIdentifier);
      }
    } catch (apiError) {
      // Handle API errors specifically
      if (onFailure) {
        onFailure(apiError, 'DELETE', resourceIdentifier);
      }
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error deleting resource: ${apiError.message}`,
      });
    }
  }

  // For PUT operations only - no PATCH support
  if (method.toUpperCase() === 'PUT' && body) {
    // Parse patch first, fail fast
    let patch;
    try {
      patch = YAML.parse(body);
    } catch (yamlError) {
      try {
        patch = JSON.parse(body);
      } catch (jsonError) {
        // Handle parsing errors specifically
        const parsingError = `Failed to parse patch body. YAML error: ${yamlError.message}. JSON error: ${jsonError.message}`;
        if (onFailure) {
          const parsedResourceInfo = resourceInfo ? JSON.parse(resourceInfo) : {};
          onFailure(new Error(parsingError), 'PUT', parsedResourceInfo);
        }
        aiManager.history.push({
          error: true,
          role: 'assistant',
          content: `Error parsing patch: ${parsingError}`,
        });
        return;
      }
    }

    // Parse resource info
    let parsedResourceInfo;
    try {
      parsedResourceInfo = JSON.parse(resourceInfo);
    } catch (parseError) {
      const resourceParsingError = `Failed to parse resource info: ${parseError.message}`;
      if (onFailure) {
        onFailure(new Error(resourceParsingError), 'PUT', {});
      }
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error parsing resource info: ${resourceParsingError}`,
      });
      return;
    }

    const resourceIdentifier = `${parsedResourceInfo.kind} ${parsedResourceInfo.name}`;
    dialogClose();

    // Handle API calls separately
    try {
      clusterAction(
        async () => {
          try {
            // First, get the current resource
            const currentResource = await clusterRequest(url, {
              method: 'GET',
              cluster,
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            });

            // Deep merge the patch with the current resource
            const mergedResource = deepMerge(currentResource, patch);

            // Now make the PUT request with the merged resource
            const headers = {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            };

            const response = await clusterRequest(url, {
              method: 'PUT',
              cluster,
              body: JSON.stringify(mergedResource),
              headers,
            });

            aiManager.history.push({
              success: true,
              role: 'tool',
              content: `${resourceIdentifier} updated successfully with patch applied.`,
            });

            // Call the success callback if provided
            if (onSuccess) {
              onSuccess(response, 'PUT', parsedResourceInfo);
            }
          } catch (apiError) {
            // Handle API-specific errors (GET or PUT failures)
            if (onFailure) {
              onFailure(apiError, 'PUT', parsedResourceInfo);
            }

            console.error('Error in PUT API operations:', apiError);
            const errorMessage = `Error updating resource: ${apiError.message}`;
            aiManager.history.push({
              error: true,
              role: 'assistant',
              content: errorMessage,
            });
          }
        },
        {
          startMessage: `Applying patch to ${resourceIdentifier}...`,
          cancelledMessage: `Cancelled updating ${resourceIdentifier}.`,
          successMessage: `${resourceIdentifier} updated successfully.`,
          errorMessage: `Failed to update ${resourceIdentifier}.`,
        }
      );
    } catch (clusterActionError) {
      // Handle cluster action setup errors
      if (onFailure) {
        onFailure(clusterActionError, 'PUT', parsedResourceInfo);
      }

      console.error('Error setting up cluster action:', clusterActionError);
      const errorMessage = `Error setting up update operation: ${clusterActionError.message}`;
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: errorMessage,
      });
    }
  }

  // For all other methods (e.g. GET)
  if (method.toUpperCase() === 'GET') {
    const cleanedUrl = cleanUrl(url);

    // Setup request options separately
    let requestOptions: any;
    try {
      requestOptions = {
        method,
        cluster,
        body: body === '' ? undefined : body,
      };

      if (isLogRequest(url)) {
        // For logs, set Accept: */* and do not set Content-Type
        requestOptions.headers = {
          Accept: '*/*',
        };
      } else {
        if (isSpecificResourceRequestHelper(cleanedUrl)) {
          requestOptions.headers = {
            'Content-Type':
              method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
            Accept: 'application/json',
          };
        } else {
          requestOptions.headers = {
            'Content-Type':
              method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
            Accept:
              'application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json',
          };
        }
      }
    } catch (setupError) {
      // Handle request setup errors
      if (onFailure) {
        onFailure(setupError, 'GET', { type: 'setup_error' });
      }
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error setting up GET request: ${setupError.message}`,
      });
      return;
    }

    // Handle API call separately
    let response;
    try {
      response = await clusterRequest(cleanedUrl, {
        ...requestOptions,
        isJSON: !isLogRequest(cleanedUrl),
      });
      console.log('API response received:', response);
    } catch (apiError) {
      // Handle specific multi-container pod logs error
      if (
        isLogRequest(cleanedUrl) &&
        apiError.message &&
        (apiError.message?.includes('a container name must be specified') ||
         apiError.message?.includes('container name must be specified') ||
         (apiError.message?.includes('Bad Request') && cleanedUrl.includes('/log')) ||
         apiError.message?.includes('choose one of'))
      ) {
        // Extract pod name and available containers from error message
        const podMatch = apiError.message.match(/for pod ([^,]+)/);
        const containersMatch = apiError.message.match(/choose one of: \[([^\]]+)\]/);

        if (podMatch && containersMatch) {
          const podName = podMatch[1];
          const containers = containersMatch[1].split(' ').map(c => c.trim());

          const errorContent = `The pod "${podName}" has multiple containers. Please specify which container you want logs from:\n\nAvailable containers: ${containers.join(
            ', '
          )}\n\nTo get logs from a specific container, ask: "get logs from ${podName} container [container-name]"`;

          aiManager.history.push({
            error: false,
            role: 'assistant',
            content: errorContent,
          });

          return JSON.stringify({
            error: false,
            role: 'assistant',
            content: errorContent,
          });
        } else {
          // If we can't parse the specific error but know it's a log request with Bad Request
          // Extract pod name from URL and suggest getting pod details
          const podNameFromUrl = cleanedUrl.match(/\/pods\/([^\/]+)\/log/);
          if (podNameFromUrl) {
            const podName = podNameFromUrl[1];
            
            const errorContent = `Failed to get logs from pod "${podName}". This is likely because it has multiple containers.\n\nTo see the containers in this pod, I need to get the pod details first. Would you like me to check the pod details to see available containers?`;

            aiManager.history.push({
              error: false,
              role: 'assistant',
              content: errorContent,
            });

            return JSON.stringify({
              error: false,
              role: 'assistant',
              content: errorContent,
            });
          }
        }
      }

      // Handle general API errors
      if (onFailure) {
        // onFailure(apiError, 'GET', { type: 'api_error' });
      }
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error in API call to ${cleanedUrl}: ${apiError.message}`,
      });
      return JSON.stringify({
        error: true,
        role: 'assistant',
        content: `Error in API call to ${cleanedUrl}: ${apiError.message}`,
      });
    }

    let formattedResponse = response;
    if (isLogRequest(url)) {
      // Always treat as Response object and get text (logs are always ReadableStream)
      let logText = '';
      if (response && typeof response.text === 'function') {
        logText = await response.text();
      } else {
        // Fallback: if not a Response object, treat as string
        logText = String(response);
      }

      // Extract resource information from URL for better log button display
      const extractResourceFromUrl = (url: string) => {
        // Extract container name from query parameters if present
        const containerMatch = url.match(/[?&]container=([^&]+)/);
        const containerName = containerMatch ? containerMatch[1] : null;

        // Match patterns like:
        // /api/v1/namespaces/default/pods/my-pod/log
        // /api/v1/namespaces/default/pods/my-pod/log?container=container-name
        // /apis/apps/v1/namespaces/default/deployments/my-deployment/log
        const match = url.match(/\/namespaces\/([^\/]+)\/([^\/]+)\/([^\/]+)\/log/);
        if (match) {
          return {
            namespace: match[1],
            resourceType: match[2],
            resourceName: match[3],
            containerName: containerName,
          };
        }

        // Try to extract resource type and name from URL
        const fallbackMatch = url.match(/\/([^\/]+)\/([^\/]+)\/log/);
        if (fallbackMatch) {
          return {
            resourceType: fallbackMatch[1],
            resourceName: fallbackMatch[2],
            containerName: containerName,
          };
        }

        return {
          resourceType: 'resource',
          resourceName: 'logs',
          containerName: containerName,
        };
      };

      const resourceInfo = extractResourceFromUrl(url);

      // Create a special logs response format that can be detected by the content renderer
      const logsResponse = {
        type: 'logs',
        data: {
          logs: logText,
          resourceName: resourceInfo.resourceName,
          resourceType: resourceInfo.resourceType,
          namespace: resourceInfo.namespace,
          containerName: resourceInfo.containerName,
          url: url,
        },
      };

      // Add a user-friendly message to chat history instead of raw logs
      const containerInfo = resourceInfo.containerName
        ? ` (container: ${resourceInfo.containerName})`
        : '';
      const logSummary = logText
        ? `Logs retrieved for ${resourceInfo.resourceType} "${resourceInfo.resourceName}"${
            resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
          }${containerInfo}. ${logText.split('\n')}`
        : `No logs available for ${resourceInfo.resourceType} "${resourceInfo.resourceName}"${
            resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
          }${containerInfo}.`;

      aiManager.history.push({
        success: true,
        role: 'tool',
        content: `LOGS_BUTTON:${JSON.stringify(logsResponse)}\n\n${logSummary}`,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(logsResponse, 'GET', { type: 'logs', ...resourceInfo });
      }

      return '';
    } else if (response?.kind === 'Table') {
      // ...existing code...
      const extractKindFromUrl = (url: string) => {
        // Extract from URLs like /api/v1/pods, /apis/apps/v1/deployments, etc.
        const match = url.match(/\/(api\/v1\/[^\/]+|apis\/[^\/]+\/[^\/]+\/[^\/]+)/);
        const kind = match ? match[1] : null;
        if (kind?.length > 1) {
          const kindParts = kind.split('/');
          if (kindParts.length > 1) {
            return kindParts[kindParts.length - 1]; // Return the last part as the kind
          }
        }
        return kind;
      };

      const resourceKind = extractKindFromUrl(url);

      // Get column headers - limit to first 3 columns
      const allColumnHeaders = response.columnDefinitions.map(col => col.name);
      const columnHeaders = allColumnHeaders.slice(0, 3);

      // Create table header
      const tableHeader = `| ${columnHeaders.join(' | ')} |`;
      const tableSeparator = `|${columnHeaders.map(() => '---').join('|')}|`;

      const itemsToShow = response.rows;
      const totalItems = response.rows.length;

      // Create table rows - only show first 3 columns
      const tableRows = itemsToShow.map((row: any) => {
        const cells = row.cells || [];
        const namespace = row.object?.metadata?.namespace;

        const paddedCells = columnHeaders.map((_, index) => {
          let cellValue = cells[index] || '-';

          // For the name column (first column), create a special link marker
          if (index === 0 && resourceKind && cellValue !== '-') {
            const linkData = {
              kind: resourceKind,
              name: cellValue,
              namespace: namespace,
            };
            // Use the proper Headlamp link format
            if (!namespace) {
              cellValue = `[${linkData.name}](https://headlamp/resource-details?cluster=${cluster}&kind=${linkData.kind}&resource=${linkData.name})`;
            } else {
              cellValue = `[${linkData.name}](https://headlamp/resource-details?cluster=${cluster}&kind=${linkData.kind}&resource=${linkData.name}&ns=${linkData.namespace})`;
            }
          }

          return cellValue;
        });
        return `| ${paddedCells.join(' | ')} |`;
      });

      const tableContent = [tableHeader, tableSeparator, ...tableRows].join('\n');

      formattedResponse = [`Found ${totalItems} items:`, tableContent].join('\n');

      // Always push to history, even if no items found
      aiManager.history.push({
        success: true,
        role: 'tool',
        content: formattedResponse,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(response, 'GET', { type: 'table', resourceKind, totalItems });
      }
    } else if (typeof response === 'object') {
      formattedResponse = JSON.stringify(response, null, 2);
      aiManager.history.push({
        success: true,
        role: 'tool',
        content: formattedResponse,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(response, 'GET', { type: 'object' });
      }
    } else if (typeof response === 'string') {
      formattedResponse = response;
      aiManager.history.push({
        success: true,
        role: 'tool',
        content: formattedResponse,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(response, 'GET', { type: 'string' });
      }
    } else {
      // Handle empty or null response
      formattedResponse = 'No data found';
      aiManager.history.push({
        success: true,
        role: 'tool',
        content: formattedResponse,
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(response, 'GET', { type: 'empty' });
      }
    }

    return formattedResponse ?? 'ok';
  }
};
