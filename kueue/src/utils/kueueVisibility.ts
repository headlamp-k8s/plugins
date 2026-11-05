import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { useEffect, useState } from 'react';
import type { PendingWorkloadSummaryItem } from '../resources/workloadFormatters';

/** Kueue's on-demand visibility API, served as v1beta2 since Kueue 0.15. */
const visibilityApiVersion = 'visibility.kueue.x-k8s.io/v1beta2';

/** Kueue's own default page size for pendingworkloads. */
const pageSize = 1000;

/** How often to reread a pendingworkloads list, since it cannot be watched. */
export const pendingWorkloadsRefreshMs = 15000;

/**
 * Read a pendingworkloads list from Kueue's visibility API, following offset pages
 * until a short page shows the list is complete.
 * Returns null when the API is not served or access is denied.
 *
 * @param path - Resource path under the API version, such as `clusterqueues/<name>/pendingworkloads`.
 * @param cluster - Cluster to ask, when it is not the current one.
 */
export async function fetchPendingWorkloads(
  path: string,
  cluster?: string
): Promise<PendingWorkloadSummaryItem[] | null> {
  // Leaving cluster out, rather than undefined, keeps the current cluster.
  const params = cluster ? { cluster } : {};

  try {
    const items: PendingWorkloadSummaryItem[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const summary = await request(
        `/apis/${visibilityApiVersion}/${path}?limit=${pageSize}&offset=${offset}`,
        params,
        false
      );
      const page = summary?.items || [];
      items.push(...page);
      if (page.length < pageSize) {
        return items;
      }
    }
  } catch {
    // Clusters without the visibility API return 404, and users without access get 403.
  }

  return null;
}

/**
 * Keep a pendingworkloads list loaded, rereading it every pendingWorkloadsRefreshMs so
 * it follows Workloads being admitted, added or deleted. Pass a null path to skip it.
 * Returns null until loaded, and when the API is not served or access is denied.
 */
export function usePendingWorkloads(path: string | null, cluster?: string) {
  const [items, setItems] = useState<PendingWorkloadSummaryItem[] | null>(null);

  useEffect(() => {
    setItems(null);
    if (!path) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      fetchPendingWorkloads(path, cluster).then(result => {
        if (!cancelled) {
          setItems(result);
          // Wait for this lookup before starting the next, so slow ones cannot overlap.
          timer = setTimeout(load, pendingWorkloadsRefreshMs);
        }
      });
    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [path, cluster]);

  return items;
}
