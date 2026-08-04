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

/**
 * Some clusters (e.g. EKS with certain CNI configurations) reject
 * kube-apiserver service-proxy requests to the OpenCost backend with
 * "error trying to reach service: Address is not allowed". When the
 * configured service value is itself a full URL, talk to it directly
 * instead of going through the apiserver proxy.
 */
function isDirectUrl(serviceName: string): boolean {
  return /^https?:\/\//i.test(serviceName);
}

export function fetchOpencostData(
  namespace: string,
  serviceName: string,
  window: string,
  resource: string,
  accumulate: boolean
) {
  const queryString = `window=${window}&aggregate=${resource}&step=1d&accumulate=${accumulate.toString()}`;

  if (isDirectUrl(serviceName)) {
    const baseUrl = serviceName.replace(/\/+$/, '');
    return fetch(`${baseUrl}/allocation?${queryString}`).then(response => {
      if (!response.ok) {
        throw new Error(
          `Request to OpenCost URL ${baseUrl} failed with status ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    });
  }

  const url = `/api/v1/namespaces/${namespace}/services/${serviceName}/proxy/allocation?${queryString}`;
  return request(url);
}
