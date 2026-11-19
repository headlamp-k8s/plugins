import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

const KUEUE_API_GROUP = '/apis/kueue.x-k8s.io';

/**
 * Whether the cluster serves the Kueue API group. Only a 404 counts as not installed;
 * other errors, such as a 403, leave the page to the access check.
 *
 * @param cluster - Cluster to ask, when it is not the current one.
 */
export async function isKueueInstalled(cluster?: string): Promise<boolean> {
  try {
    // Leaving cluster out, rather than undefined, keeps the current cluster.
    await clusterRequest(KUEUE_API_GROUP, cluster ? { cluster } : {});
    return true;
  } catch (error) {
    return (error as { status?: number } | undefined)?.status !== 404;
  }
}
