import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import type { PendingWorkloadSummaryItem } from '../resources/workloadFormatters';

const visibilityApiVersions = [
  'visibility.kueue.x-k8s.io/v1beta2',
  'visibility.kueue.x-k8s.io/v1beta1',
];

/**
 * Read a pendingworkloads list from Kueue's visibility API, newest version first.
 * Returns null when no version is served or access is denied.
 *
 * @param path - Resource path under the API version, such as `clusterqueues/<name>/pendingworkloads`.
 */
export async function fetchPendingWorkloads(
  path: string
): Promise<PendingWorkloadSummaryItem[] | null> {
  for (const apiVersion of visibilityApiVersions) {
    try {
      const summary = await request(`/apis/${apiVersion}/${path}`, {}, false);
      return summary?.items || [];
    } catch {
      // Older Kueue serves only v1beta1, and clusters without the API return 404.
    }
  }

  return null;
}
