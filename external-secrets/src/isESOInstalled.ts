import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export async function isESOInstalled(): Promise<boolean> {
  try {
    const response = await ApiProxy.request('/apis/external-secrets.io/v1', {
      method: 'GET',
    });
    return !!response;
  } catch (error) {
    return false;
  }
}
