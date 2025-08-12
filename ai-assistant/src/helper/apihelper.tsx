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
  targetCluster?: string // Allow specifying a specific cluster
) => {
  console.log('url', 'method');
  console.log(url, method, body, resourceInfo);
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
    try {
      let resource;

      try {
        resource = YAML.parse(body);
      } catch (e) {
        resource = JSON.parse(body);
      }

      dialogClose();
      clusterAction(
        async () => {
          const response = await apply(resource, cluster);
          aiManager.history.push({
            role: 'tool',
            content: `${resource.kind || 'Resource'} ${
              response.metadata.name
            } created successfully.`,
          });
          return response;
        },
        {
          startMessage: `Creating ${resource.kind || 'resource'} in cluster ${cluster}...`,
          cancelledMessage: `Cancelled creating resource in cluster.`,
          successMessage: `${resource.kind || 'Resource'} created successfully.`,
          errorMessage: `Failed to create resource.`,
        }
      );
    } catch (error) {
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error creating resource: ${error.message}`,
      });

      return JSON.stringify({
        error: true,
        role: 'assistant',
        content: `Error creating resource: ${error.message}`,
      });
    }
  }

  // For DELETE operations
  if (method.toUpperCase() === 'DELETE' && body) {
    try {
      const resourceIdentifier = JSON.parse(body);
      dialogClose();
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

      return JSON.stringify({
        success: true,
        role: 'tool',
        content: `${resourceIdentifier.kind} ${resourceIdentifier.name} deleted successfully.`,
      });
    } catch (error) {
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error deleting resource: ${error.message}`,
      });
      return JSON.stringify({
        error: true,
        role: 'assistant',
        content: `Error deleting resource: ${error.message}`,
      });
    }
  }

  // For PUT operations only - no PATCH support
  if (method.toUpperCase() === 'PUT' && body) {
    try {
      let patch;
      try {
        patch = YAML.parse(body);
      } catch (e) {
        patch = JSON.parse(body);
      }

      const parsedResourceInfo = JSON.parse(resourceInfo);
      const resourceIdentifier = `${parsedResourceInfo.kind} ${parsedResourceInfo.name}`;

      dialogClose();

      clusterAction(
        async () => {
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

          return response;
        },
        {
          startMessage: `Applying patch to ${resourceIdentifier}...`,
          cancelledMessage: `Cancelled updating ${resourceIdentifier}.`,
          successMessage: `${resourceIdentifier} updated successfully.`,
          errorMessage: `Failed to update ${resourceIdentifier}.`,
        }
      );

      // Return success response immediately after dispatching the action
      return JSON.stringify({
        success: true,
        role: 'tool',
        content: `${resourceIdentifier} patch application initiated.`,
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      const errorMessage = `Error updating resource: ${error.message}`;
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: errorMessage,
      });

      return JSON.stringify({
        error: true,
        role: 'assistant',
        content: errorMessage,
      });
    }
  }

  // For all other methods (e.g. GET)
  if (method.toUpperCase() === 'GET') {
    const cleanedUrl = cleanUrl(url);

    try {
      const requestOptions: any = {
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
      let response;
      try {
        response = await clusterRequest(cleanedUrl, {
          ...requestOptions,
          isJSON: !isLogRequest(cleanedUrl),
        });
      } catch (error) {
        console.log('Error in clusterRequest:', error);
        aiManager.history.push({
          error: true,
          role: 'assistant',
          content: `Error in API call to ${cleanedUrl}: ${error.message}`,
        });
        return JSON.stringify({
          error: true,
          role: 'assistant',
          content: `Error in API call to ${cleanedUrl}: ${error.message}`,
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
          // Match patterns like:
          // /api/v1/namespaces/default/pods/my-pod/log
          // /apis/apps/v1/namespaces/default/deployments/my-deployment/log
          const match = url.match(/\/namespaces\/([^\/]+)\/([^\/]+)\/([^\/]+)\/log/);
          if (match) {
            return {
              namespace: match[1],
              resourceType: match[2],
              resourceName: match[3],
            };
          }

          // Try to extract resource type and name from URL
          const fallbackMatch = url.match(/\/([^\/]+)\/([^\/]+)\/log/);
          if (fallbackMatch) {
            return {
              resourceType: fallbackMatch[1],
              resourceName: fallbackMatch[2],
            };
          }

          return {
            resourceType: 'resource',
            resourceName: 'logs',
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
            url: url,
          },
        };

        // Add a user-friendly message to chat history instead of raw logs
        const logSummary = logText
          ? `Logs retrieved for ${resourceInfo.resourceType} "${resourceInfo.resourceName}"${
              resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
            }. ${logText.split('\n')}`
          : `No logs available for ${resourceInfo.resourceType} "${resourceInfo.resourceName}"${
              resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
            }.`;

        aiManager.history.push({
          success: true,
          role: 'tool',
          content: `LOGS_BUTTON:${JSON.stringify(logsResponse)}\n\n${logSummary}`,
        });

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
      } else if (typeof response === 'object') {
        formattedResponse = JSON.stringify(response, null, 2);
        aiManager.history.push({
          success: true,
          role: 'tool',
          content: formattedResponse,
        });
      } else if (typeof response === 'string') {
        formattedResponse = response;
        aiManager.history.push({
          success: true,
          role: 'tool',
          content: formattedResponse,
        });
      } else {
        // Handle empty or null response
        formattedResponse = 'No data found';
        aiManager.history.push({
          success: true,
          role: 'tool',
          content: formattedResponse,
        });
      }

      return formattedResponse ?? 'ok';
    } catch (error) {
      console.log(error);
      aiManager.history.push({
        error: true,
        role: 'assistant',
        content: `Error in API call to ${url}: ${error.message}`,
      });
      return JSON.stringify({
        error: true,
        role: 'assistant',
        content: `Error in API call to ${url}: ${error.message}`,
      });
    }
  }
};
