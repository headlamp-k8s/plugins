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
      clusterAction(
        async () => {
          const response = await apply(resource, cluster);
          console.log('Response from apply:', response);
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
     const cleanedUrl = cleanUrl(url);
    
    try {
      const response = await clusterRequest(cleanedUrl, {
        method,
        cluster,
        body: body === '' ? undefined : body,
        headers: isLogRequest(url)
          ? {
              Accept: 'application/json',
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
            }
          : isSpecificResourceRequestHelper(cleanedUrl)
          ? {
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
              Accept: 'application/json',
            }
          : {
              'Content-Type':
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
              Accept: 'application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json',
            },
      });

      let formattedResponse = response;
      console.log('Response from API request:', response);
      if (isLogRequest(url)) {
        if (
          typeof response === 'object' &&
          response.kind === 'Status' &&
          response.status === 'Failure'
        ) {
          formattedResponse = `Error fetching logs: ${response.message || 'Unknown error'}`;
        }
      } else if (response?.kind === 'Table') {
        // Extract resource kind from URL for list view link
        const extractKindFromUrl = (url: string) => {
          // Extract from URLs like /api/v1/pods, /apis/apps/v1/deployments, etc.
          const match = url.match(/\/(?:api\/v1|apis\/[^\/]+\/[^\/]+)\/(?:namespaces\/[^\/]+\/)?([^\/\?]+)/);
          return match ? match[1] : null;
        };
        
        const resourceKind = extractKindFromUrl(url);
        
        // // Debug: Log the response structure to understand what columns we're getting
        // console.log('Table columns:', response.columnDefinitions.map(col => col.name));
        // console.log('First row data:', response.rows[0]?.cells);
        // console.log('URL:', url);
        
        // Get column headers - limit to first 3 columns
        const allColumnHeaders = response.columnDefinitions.map(col => col.name);
        const columnHeaders = allColumnHeaders.slice(0, 3);
        
        // Create table header
        const tableHeader = `| ${columnHeaders.join(' | ')} |`;
        const tableSeparator = `|${columnHeaders.map(() => '---').join('|')}|`;
        
        // Limit to first 30 items
        const maxItems = 30;
        const itemsToShow = response.rows.slice(0, maxItems);
        const totalItems = response.rows.length;
        console.log("response is ",response)

        // Create table rows - only show first 3 columns and first 30 items
        const tableRows = itemsToShow.map((row: any) => {
          console.log("namespace is ", row.object?.metadata?.namespace);
          const cells = row.cells || [];
          const namespace = row.object?.metadata?.namespace;
          
          const paddedCells = columnHeaders.map((_, index) => {
            let cellValue = cells[index] || '-';
            
            // For the name column (first column), create a special link marker
            if (index === 0 && resourceKind && cellValue !== '-') {
              const linkData = {
                kind: resourceKind,
                name: cellValue,
                namespace: namespace
              };
              if(!namespace) {
                cellValue = `[${linkData.name}](/c/${cluster}/${resourceKind}/${linkData.name})`;
              } else {
                cellValue = `[${linkData.name}](/c/${cluster}/${resourceKind}/${linkData.namespace}/${linkData.name})`;  
              }
            }
            
            return cellValue;
          });
          return `| ${paddedCells.join(' | ')} |`;
        });
        
        const tableContent = [
          tableHeader,
          tableSeparator,
          ...tableRows,
        ].join('\n');

        // Add information about item limits and link to full list view
        const limitInfo = totalItems > maxItems 
          ? `\n\n*Showing ${maxItems} of ${totalItems} items. For the complete list, go to the [Headlamp ${resourceKind} list view](/c/${cluster}/${resourceKind}).*`
          : '';

        formattedResponse = [
          `Found ${totalItems} items:`,
          tableContent,
          limitInfo
        ].join('\n');

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
