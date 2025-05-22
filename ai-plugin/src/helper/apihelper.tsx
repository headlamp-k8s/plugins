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
      clusterAction(
        async () => {
          const response = await apply(resource, cluster);
          console.log('Response from apply:', response);
           aiManager.history.push({
            role: 'tool',
            content: `${resource.kind || 'Resource'} ${response.metadata.name} created successfully.`,
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

        // Create formatted output using small boxes instead of tables
        const formattedRows = Object.entries(rowsByNamespace).map(([namespace, rows]: [string, any[]]) => {
          const namespaceHeader = `\n### ${namespace} (${rows.length} items)`;
          const resourceBoxes = rows.map((row: any) => {
            // const name = row.cells[0] || '';
            // Extract all available information from cells
            const additionalInfo = [];
            // console.log("name is ", name);
            // // Always add name and namespace first
            let boxContent = ``;
            console.log("Row is ", row);
            console.log("header is", response.columnDefinitions);
            // Process each cell in the row to add relevant information
            if (row.cells && row.cells.length > 1) {
              // Get column headers to know what data we're displaying
              const columnHeaders = response.columnDefinitions.map(col => col.name.toLowerCase());
              
              // Add each cell's data if it has content and isn't already shown (name and namespace)
              for (let i = 1; i < row.cells.length; i++) {
                const cellValue = row.cells[i];
                console.log("columnHeaders is ", columnHeaders);
                const header = columnHeaders[i] || `Field ${i+1}`;
                console.log("Cell value is ", cellValue);
                console.log("Header is ", header);
                if(header === 'name' || header === 'namespace') {
                  additionalInfo.push(`🔷 ${header.charAt(0).toUpperCase() + header.slice(1)}: ${cellValue}`)
                  continue;;                }
                console.log('Processing cell:', { header, cellValue });
                // Skip empty values or already shown name/namespace
                // if (!cellValue || header === 'name' || header === 'namespace') continue;
                
                // Special treatment for common fields
                if (header === 'status') {
                  const statusEmoji = cellValue.toLowerCase().includes('running') || 
                                     cellValue.toLowerCase().includes('active') || 
                                     cellValue.toLowerCase().includes('success') ? 
                                     '✅' : '❌';
                  additionalInfo.push(`🔶 Status: ${statusEmoji} ${cellValue}`);
                } 
                else if (header.includes('cpu') || header.includes('memory') || header.includes('usage')) {
                  additionalInfo.push(`📊 ${header.charAt(0).toUpperCase() + header.slice(1)}: ${cellValue}`);
                }
                else if (header === 'age') {
                  additionalInfo.push(`⏱️ Age: ${cellValue}`);
                }
                else if (header === 'ready') {
                  additionalInfo.push(`🔄 Ready: ${cellValue}`);
                }
                else if (header === 'restarts') {
                  additionalInfo.push(`🔁 Restarts: ${cellValue}`);
                } else if (header === 'message') {
                  // For message fields, use a speech bubble emoji
                  additionalInfo.push(`💬 Message: ${cellValue}`);
                }
                else {
                  // For other fields, just capitalize the header
                  additionalInfo.push(`⚙️ ${header.charAt(0).toUpperCase() + header.slice(1)}: ${cellValue}`);
                }
              }
            }
            console.log("Additional info is ", additionalInfo);
            // Add any additional object metadata that might be useful
            if (row.object && row.object.metadata) {
              if (row.object.metadata.labels && Object.keys(row.object.metadata.labels).length > 0) {
                const keyLabels = Object.entries(row.object.metadata.labels)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ');
                additionalInfo.push(`🏷️ Labels: ${keyLabels}`);
              }
            }
            
            // Combine all information
            if (additionalInfo.length > 0) {
              // sort additionalInfo such that name and namespace are first
              additionalInfo.sort((a, b) => {
                if (a.includes('Name:') && !b.includes('Name:')) return -1;
                if (!a.includes('Name:') && b.includes('Name:')) return 1;
                if (a.includes('Namespace:') && !b.includes('Namespace:')) return -1;
                if (!a.includes('Namespace:') && b.includes('Namespace:')) return 1;
                return 0;
              });
              boxContent += '\n' + additionalInfo.join('\n');
            }
            
            return `\`\`\`\n${boxContent}\n\`\`\``;
          });
          
          return [
            namespaceHeader,
            ...resourceBoxes
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
