import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

const KUEUE_API_GROUP = '/apis/kueue.x-k8s.io';

export async function isKueueInstalled(cluster: string): Promise<boolean> {
  try {
    await clusterRequest(KUEUE_API_GROUP, { cluster });
    return true;
  } catch (error) {
    return (error as { status?: number }).status !== 404;
  }
}
