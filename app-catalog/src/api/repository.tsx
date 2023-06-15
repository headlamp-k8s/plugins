import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { getHeadlampAPIHeaders } from './releases';

const request = ApiProxy.request;

export function addRepository(repoName: string, repoURL: string) {
  return request('/helm/repositories', {
    method: 'POST',
    body: JSON.stringify({
      name: repoName,
      url: repoURL,
    }),
    headers: { ...getHeadlampAPIHeaders() },
  });
}
