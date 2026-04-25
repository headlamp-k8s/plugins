import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export async function isKedaInstalled(): Promise<boolean> {
  try {
    const response = await ApiProxy.request('/apis/keda.sh/v1alpha1', {
      method: 'GET',
    });
    return !!response;
  } catch (error) {
    return false;
  }
}
