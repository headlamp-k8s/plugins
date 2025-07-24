import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply, clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import YAML from 'yaml';
import { isLogRequest, isSpecificResourceRequestHelper } from '.';

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
  resourceInfo: string
) => {
  const cluster = getCluster();
  if (!cluster) {
    return JSON.stringify({ error: true, message: 'No cluster selected' });
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
      return JSON.stringify({
        error: true,
        message: `Error creating resource: ${error.message}`,
      });
    }
  }

  // For DELETE operations
  if (method.toUpperCase() === 'DELETE' && body) {
    try {
      const resourceIdentifier = JSON.parse(body);

      dialogClose();
      clusterRequest(url, {
        method: 'DELETE',
        cluster,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
        .then(() => {
          aiManager.history.push({
            role: 'tool',
            content: `${resourceIdentifier.kind} ${resourceIdentifier.name} deleted successfully.`,
          });
        })
        .catch(error => {
          aiManager.history.push({
            role: 'assistant',
            content: `Error deleting resource: ${error.message}`,
          });
        });
    } catch (error) {
      aiManager.history.push({
        role: 'assistant',
        content: `Error deleting resource: ${error.message}`,
      });
    }
  }

  // For PATCH/PUT operations
  if ((method.toUpperCase() === 'PATCH' || method.toUpperCase() === 'PUT') && body) {
    try {
      let resource;
      try {
        resource = YAML.parse(body);
      } catch (e) {
        resource = JSON.parse(body);
      }

      const parsedResourceInfo = JSON.parse(resourceInfo);
      const resourceIdentifier = `${parsedResourceInfo.kind} ${parsedResourceInfo.name}`;

      // Ensure the resource has the required fields

      const processedBody = JSON.stringify(resource);

      dialogClose();
      clusterAction(
        async () => {
          const headers = {
            'Content-Type':
              method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
            Accept: 'application/json',
          };
          const response = await clusterRequest(url, {
            method,
            cluster,
            body: processedBody,
            headers,
          });

          aiManager.history.push({
            role: 'tool',
            content: `${resourceIdentifier} updated successfully.`,
          });
          return response;
        },
        {
          startMessage: `Updating ${resourceIdentifier}...`,
          cancelledMessage: `Cancelled updating ${resourceIdentifier}.`,
          successMessage: `${resourceIdentifier} updated successfully.`,
          errorMessage: `Failed to update ${resourceIdentifier}.`,
        }
      );
    } catch (error) {
      aiManager.history.push({
        role: 'assistant',
        content: `Error updating resource: ${error.message}`,
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

      const response = await clusterRequest(cleanedUrl, {
        ...requestOptions,
        isJSON: !isLogRequest(cleanedUrl),
      });

      let formattedResponse = response;
      if (isLogRequest(url)) {
        // Always treat as Response object and get text (logs are always ReadableStream)
        if (response && typeof response.text === 'function') {
          const logText = await response.text();
          aiManager.history.push({
            role: 'tool',
            content: logText,
          });
          return logText;
        }
        // Fallback: if not a Response object, treat as string
        aiManager.history.push({
          role: 'tool',
          content: String(response),
        });
        return String(response);
      } else if (response?.kind === 'Table') {
        // ...existing code...
        const extractKindFromUrl = (url: string) => {
          // Extract from URLs like /api/v1/pods, /apis/apps/v1/deployments, etc.
          const match = url.match(
            /\/(:?api\/v1|apis\/[^\/]+\/[^\/]+)\/(?:namespaces\/[^\/]+\/)?([^\/\?]+)/
          );
          return match ? match[1] : null;
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
              if (!namespace) {
                cellValue = `[${linkData.name}](/c/${cluster}/${resourceKind}/${linkData.name})`;
              } else {
                cellValue = `[${linkData.name}](/c/${cluster}/${resourceKind}/${linkData.namespace}/${linkData.name})`;
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
          role: 'tool',
          content: formattedResponse,
        });
      } else if (typeof response === 'object') {
        formattedResponse = JSON.stringify(response, null, 2);
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse,
        });
      } else if (typeof response === 'string') {
        formattedResponse = response;
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse,
        });
      } else {
        // Handle empty or null response
        formattedResponse = 'No data found';
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse,
        });
      }

      return formattedResponse ?? 'ok';
    } catch (error) {
      aiManager.history.push({
        role: 'assistant',
        content: `Error in API call to ${url}: ${error.message}`,
      });
      throw error;
    }
  }
};
