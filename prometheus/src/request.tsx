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

/**
 * Fetches metrics data from Prometheus using the provided parameters.
 * @param {object} data - The parameters for fetching metrics.
 * @param {string} data.prefix - The namespace prefix.
 * @param {string} data.query - The Prometheus query string.
 * @param {number} data.from - The start time for the query (Unix timestamp).
 * @param {number} data.to - The end time for the query (Unix timestamp).
 * @param {number} data.step - The step size for the query (in seconds).
 * @returns {Promise<object>} - A promise that resolves to the fetched metrics data.
 * @throws {Error} - Throws an error if the request fails.
 */
export async function fetchMetrics(data: {
  prefix: string;
  query: string;
  from: number;
  to: number;
  step: number;
}): Promise<object> {
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

  const response = await request(
    `/api/v1/namespaces/${data.prefix}/proxy/api/v1/query_range?${params.toString()}`,
    {
      method: 'GET',
      isJSON: false,
    }
  );
  if (response.status === 200) {
    return response.json();
  } else {
    const error = new Error(response.statusText);
    return Promise.reject(error);
  }
}
