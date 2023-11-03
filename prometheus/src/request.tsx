import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;

export async function isPrometheusInstalled() {
  const queryParams = new URLSearchParams();
  queryParams.append('labelSelector', 'app.kubernetes.io/name=prometheus');

  const response = await request(`/api/v1/pods?${queryParams.toString()}`, {
    method: 'GET',
  });

  if (response.items && response.items.length > 0) {
    return [true, response.items[0].metadata.name, response.items[0].metadata.namespace];
  }
  return [false, null, null];
}

export function fetchMetrics(data: {
  prefix: string;
  query: string;
  from: number;
  to: number;
  step: number;
}) {
  const params = new URLSearchParams();
  if (data.from) {
    params.append('start', data.from.toString());
  }
  if (data.to) {
    params.append('end', data.to.toString());
  }
  if (data.step) {
    params.append('step', data.step.toString());
  }
  if (data.query) {
    params.append('query', data.query);
  }

  return request(
    `/api/v1/namespaces/${data.prefix}/proxy/api/v1/query_range?${params.toString()}`,
    {
      method: 'GET',
    }
  );
}
