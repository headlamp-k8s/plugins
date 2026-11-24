import { clusterRequest, request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

const KUEUE_API_GROUP = '/apis/kueue.x-k8s.io';

/**
 * Whether the cluster serves the Kueue API group. Only a 404 counts as not installed;
 * other errors, such as a 403, leave the page to the access check.
 *
 * @param cluster - Cluster to ask, when it is not the current one.
 */
export async function isKueueInstalled(cluster?: string): Promise<boolean> {
  try {
    // clusterRequest without a cluster would ask the Headlamp backend, so use
    // request, which prefixes the current cluster.
    await (cluster ? clusterRequest(KUEUE_API_GROUP, { cluster }) : request(KUEUE_API_GROUP));
    return true;
  } catch (error) {
    return (error as { status?: number } | undefined)?.status !== 404;
  }
}
