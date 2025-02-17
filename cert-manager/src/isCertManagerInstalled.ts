import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export async function isCertManagerInstalled(): Promise<boolean> {
  try {
    const response = await ApiProxy.request('/apis/cert-manager.io/v1', {
      method: 'GET',
    });
    return !!response;
  } catch (error) {
    return false;
  }
}
