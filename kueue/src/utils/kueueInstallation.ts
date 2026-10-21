import { clusterFetch } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/fetch';

const KUEUE_API_GROUP = '/apis/kueue.x-k8s.io';

export async function isKueueInstalled(cluster: string): Promise<boolean> {
  try {
    await clusterFetch(KUEUE_API_GROUP, { cluster });
    return true;
  } catch (error) {
    return (error as { status?: number }).status !== 404;
  }
}
