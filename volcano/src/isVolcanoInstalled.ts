import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export async function isVolcanoInstalled(): Promise<boolean> {
  try {
    const schedulingResponse = await ApiProxy.request('/apis/scheduling.volcano.sh/v1beta1', {
      method: 'GET',
    });
    const batchResponse = await ApiProxy.request('/apis/batch.volcano.sh/v1alpha1', {
      method: 'GET',
    });

    return !!schedulingResponse && !!batchResponse;
  } catch (error) {
    return false;
  }
}
