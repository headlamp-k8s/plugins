import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';

/**
 * Fetches logs for a specific pod or container
 */
export async function fetchLogs(
  namespace: string,
  podName: string,
  containerName?: string,
  tailLines?: number,
  previous?: boolean
): Promise<string> {
  try {
    const cluster = getCluster();
    if (!cluster) {
      throw new Error('No cluster selected');
    }

    let url = `/api/v1/namespaces/${namespace}/pods/${podName}/log`;
    const params = new URLSearchParams();

    if (containerName) {
      params.append('container', containerName);
    }

    if (tailLines) {
      params.append('tailLines', tailLines.toString());
    }

    if (previous) {
      params.append('previous', 'true');
    }

    // Add timestamps for better log readability
    params.append('timestamps', 'true');

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const logs = await clusterRequest(url, { cluster });
    return logs;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error(`Failed to fetch logs: ${error.message}`);
  }
}

/**
 * Helper to extract pod name and container name from a resource
 */
export function extractPodInfo(resourceYAML: string): {
  podName?: string;
  namespace?: string;
  containerNames?: string[];
} {
  try {
    const resource = JSON.parse(resourceYAML);

    // Direct pod
    if (resource.kind === 'Pod') {
      return {
        podName: resource.metadata?.name,
        namespace: resource.metadata?.namespace || 'default',
        containerNames: resource.spec?.containers?.map(c => c.name) || [],
      };
    }

    // For resources that manage pods like Deployments, StatefulSets, etc.
    if (resource.spec?.template?.spec?.containers) {
      return {
        namespace: resource.metadata?.namespace || 'default',
        containerNames: resource.spec.template.spec.containers.map(c => c.name) || [],
      };
    }

    return {};
  } catch (error) {
    return {};
  }
}
