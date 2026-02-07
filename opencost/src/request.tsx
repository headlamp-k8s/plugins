import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;

export async function isOpenCostInstalled() {
  const queryParams = new URLSearchParams();
  queryParams.append('labelSelector', 'app.kubernetes.io/name=opencost');

  const response = await request(`/api/v1/services?${queryParams.toString()}`, {
    method: 'GET',
  });

  if (response.items && response.items.length > 0) {
    // find the service with name http-ui
    const httpUIPort = response.items[0].spec.ports.filter(port => port.name === 'http-ui');
    return [
      true,
      `${response.items[0].metadata.name}:${httpUIPort[0].name}`,
      response.items[0].metadata.namespace,
    ];
  }
  return [false, null, null];
}

export function fetchOpencostData(
  namespace: string,
  serviceName: string,
  window: string,
  resource: string,
  accumulate: boolean
) {
  const url = `/api/v1/namespaces/${namespace}/services/${serviceName}/proxy/allocation?window=${window}&aggregate=${resource}&step=1d&accumulate=${accumulate.toString()}`;

  return request(url).then(data => {
    return data;
  });
}
