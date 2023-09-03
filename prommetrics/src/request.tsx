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

export function fetchMetrics(
    prefix:string,
    query: string,
    from: string,
    to: string,
    step: string
  ) {
    
   const params = new URLSearchParams();
    if (from) {
      params.append('start', from);
    }
    if (to) {
      params.append('end', to);
    }
    if (step) {
      params.append('step', step);
    }
    if (query) {
      params.append('query', query);
    }
  
    return request(
      `/api/v1/namespaces/${prefix}/proxy/api/v1/query_range?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }
  