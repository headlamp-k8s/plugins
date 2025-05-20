import { clusterAction } from '@kinvolk/headlamp-plugin/lib';
import { apply, clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import YAML from 'yaml';
import { isLogRequest, isSpecificResourceRequestHelper } from '.';

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

  console.log('Making Kubernetes API request:', { url, method, body });

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
      const actionPromise = clusterAction(
        async () => {
          const response = await apply(resource, cluster);
          return response;
        },
        {
          startMessage: `Creating ${resource.kind || 'resource'} in cluster ${cluster}...`,
          cancelledMessage: `Cancelled creating resource in cluster.`,
          successMessage: `${resource.kind || 'Resource'} created successfully.`,
          errorMessage: `Failed to create resource.`,
        }
      );
      actionPromise
        .then(() => {
          aiManager.history.push({
            role: 'tool',
            content: `${resource.kind || 'Resource'} created successfully.`,
          });
        })
        .catch(error => {
          aiManager.history.push({
            role: 'assistant',
            content: `Error creating resource: ${error.message}`,
          });
        });
      return {
        status: 'success',
        operation: 'CREATE',
        message: `${resource.kind || 'Resource'} created successfully`,
        resourceType: resource.kind,
        name: resource.metadata?.name,
        namespace: resource.metadata?.namespace,
      };
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
    console.log('Processing PATCH/PUT request:', { url, method, body });
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
    try {
      const response = await clusterRequest(url, {
        method,
        cluster,
        body: body === '' ? undefined : body,
        headers: isLogRequest(url)
          ? {
              Accept: 'application/json',
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
            }
          : isSpecificResourceRequestHelper(url)
          ? {
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
              Accept: 'application/json',
            }
          : {
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
              Accept: 'application/json;as=Table;g=meta.k8s.io;v=v1',
            },
      });

      let formattedResponse = response;
      
      if (isLogRequest(url)) {
        if (
          typeof response === 'object' &&
          response.kind === 'Status' &&
          response.status === 'Failure'
        ) {
          formattedResponse = `Error fetching logs: ${response.message || 'Unknown error'}`;
        }
      } else if (response?.kind === 'Table') {
        // Group rows by namespace
        const rowsByNamespace = response.rows.reduce((acc: { [key: string]: any[] }, row: any) => {
          const namespace = row.object.metadata.namespace;
          if (!acc[namespace]) {
            acc[namespace] = [];
          }
          acc[namespace].push(row);
          return acc;
        }, {});

        // Create formatted output
        const formattedRows = Object.entries(rowsByNamespace).map(([namespace, rows]: [string, any[]]) => {
          const namespaceHeader = `\n### ${namespace} (${rows.length} items)`;
          const tableHeader = '| Name | Status |';
          const separator = '|------|--------|';
          const tableRows = rows.map((row: any) => {
            const name = row.cells[0] || '';
            const status = row.cells[2] || ''; // Status is typically the 3rd column
            return `| ${name} | ${status} |`;
          });
          
          return [
            namespaceHeader,
            tableHeader,
            separator,
            ...tableRows
          ].join('\n');
        });

        formattedResponse = [
          `Found ${response.rows.length} items across ${Object.keys(rowsByNamespace).length} namespaces:`,
          ...formattedRows
        ].join('\n');

        // Always push to history, even if no items found
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse
        });
      } else if (typeof response === 'object') {
        formattedResponse = JSON.stringify(response, null, 2);
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse
        });
      } else if (typeof response === 'string') {
        formattedResponse = response;
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse
        });
      } else {
        // Handle empty or null response
        formattedResponse = 'No data found';
        aiManager.history.push({
          role: 'tool',
          content: formattedResponse
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
