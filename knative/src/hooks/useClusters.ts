import { useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';

/**
 * Hook to get cluster names based on selected clusters or current cluster.
 * Returns an array of cluster names to use for API queries.
 *
 * Priority:
 * 1. Selected clusters (if any)
 * 2. Current cluster (if available)
 * 3. No cluster available -> empty list
 */
export function useClusters(): string[] {
  const selectedClusters = useSelectedClusters();
  const currentCluster = getCluster();

  // If there are selected clusters, use those
  if (selectedClusters && selectedClusters.length > 0) {
    return selectedClusters;
  }

  // Otherwise, use only the current cluster
  if (currentCluster) {
    return [currentCluster];
  }

  // Fallback: no cluster available, return empty list instead of throwing
  return [];
}
