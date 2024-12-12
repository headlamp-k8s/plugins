import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;

const CUSTOM_HEADLAMP_LABEL = 'headlamp-prometheus=true';
const COMMON_PROMETHEUS_POD_LABEL = 'app.kubernetes.io/name=prometheus';
const COMMON_PROMETHEUS_SERVICE_LABEL = 'app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server';
const DEFAULT_PROMETHEUS_PORT = '9090';

export type KubernetesPodListResponseItem = {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    containers: [
      {
        name: string;
        image: string;
        ports: [
          {
            name: string;
            containerPort: number;
            protocol: string;
          }
        ];
      }
    ];
  };
};

export type KubernetesPodListResponse = {
  kind: 'PodList';
  items: KubernetesPodListResponseItem[];
};

export type KubernetesServiceListResponseItem = {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    ports: [
      {
        name: string;
        port: number;
        protocol: string;
      }
    ];
  };
};

export type KubernetesServiceListResponse = {
  kind: 'ServiceList';
  items: KubernetesServiceListResponseItem[];
};

export type KubernetesSearchResponse = KubernetesPodListResponse | KubernetesServiceListResponse;

export enum KubernetesType {
  none = 'none',
  pods   = 'pods',
  services = 'services',
};

export type PrometheusEndpoint = {
  type: KubernetesType;
  name: string | undefined;
  namespace: string | undefined;
  port: string | undefined;
};

/**
 * Factory to create a new instance of PrometheusEndpoint.
 * @param {KubernetesType} type - The type of Kubernetes resource.
 * @param {string} name - The name of the Kubernetes resource.
 * @param {string} namespace - The namespace of the Kubernetes resource.
 * @param {string} port - The port of the Kubernetes resource.
 * @returns {PrometheusEndpoint} - A new instance of PrometheusEndpoint.
 */
export function createPrometheusEndpoint(
  type: KubernetesType = KubernetesType.none,
  name: string | undefined = undefined,
  namespace: string | undefined = undefined,
  port: string | undefined = undefined
): PrometheusEndpoint {
  return {
    type,
    name,
    namespace,
    port
  };
}

/**
 * Returns the first Prometheus pod or service that fits our search and is reachable.
 * @returns {Promise<PrometheusEndpoint>} - A promise that resolves to the first reachable Prometheus pod/service or none if none are reachable.
 */
export async function isPrometheusInstalled(): Promise<PrometheusEndpoint> {
  // Search by a specific label for a pod
  const podSearchSpecificResponse = await searchKubernetesByLabel(KubernetesType.pods, CUSTOM_HEADLAMP_LABEL);
  if (podSearchSpecificResponse.type !== KubernetesType.none) {
    return podSearchSpecificResponse;
  }

  // Search by a specific label for a service
  const serviceSearchSpecificResponse = await searchKubernetesByLabel(KubernetesType.services, CUSTOM_HEADLAMP_LABEL);
  if (serviceSearchSpecificResponse.type !== KubernetesType.none) {
    return serviceSearchSpecificResponse;
  }

  // Search by common label for a pod
  const podSearchResponse = await searchKubernetesByLabel(KubernetesType.pods, COMMON_PROMETHEUS_POD_LABEL);
  if (podSearchResponse.type !== KubernetesType.none) {
    return podSearchResponse;
  }

  // Search by common label for a service
  const serviceSearchResponse = await searchKubernetesByLabel(KubernetesType.services, COMMON_PROMETHEUS_SERVICE_LABEL);
  if (serviceSearchResponse.type !== KubernetesType.none) {
    return serviceSearchResponse;
  }

  // No Prometheus pod or service found
  return createPrometheusEndpoint();
}

async function searchKubernetesByLabel(
  kubernetesType: KubernetesType,
  labelSelector: string
): Promise<PrometheusEndpoint> {
  if (kubernetesType === KubernetesType.none) {
    return createPrometheusEndpoint();
  }

  const queryParams = new URLSearchParams();
  queryParams.append('labelSelector', labelSelector);

  const searchResponse = await request(`/api/v1/${kubernetesType}?${queryParams}`, {
    method: 'GET',
  });

  if (!searchResponse?.kind || ['PodList', 'ServiceList'].indexOf(searchResponse.kind) === -1) {
    return createPrometheusEndpoint();
  }

  const searchResponseTyped = searchResponse as KubernetesSearchResponse;

  if (searchResponseTyped.items?.length > 0) {
    const metadata = searchResponseTyped.items[0].metadata;
    if (!metadata) {
      return createPrometheusEndpoint();
    }

    const prometheusName = metadata.name;
    const prometheusNamespace = metadata.namespace;
    const prometheusPorts = getPrometheusPortsFromResponse(searchResponseTyped);
    
    const testResults = await Promise.all(
      prometheusPorts.map(async (prometheusPort) => {
        const testSuccess = await testPrometheusQuery(kubernetesType, prometheusName, prometheusNamespace, prometheusPort);
        return {
          prometheusPort,
          testSuccess
        };
      })
    );

    for (const result of testResults) {
      if (result.testSuccess) {
        return createPrometheusEndpoint(kubernetesType, prometheusName, prometheusNamespace, result.prometheusPort);
      }
    }
  }

  return createPrometheusEndpoint();
}

/**
 * Gets the Prometheus service port from the response.
 * @param response - A PodList or ServiceList response.
 * @returns {string[]} - The Prometheus service ports.
 */
function getPrometheusPortsFromResponse(response: KubernetesSearchResponse): string[] {
  const ports: string[] = [];
  if (response.kind === 'PodList') {
    // Pod response
    for (const item of response.items) {
      for (const container of item.spec.containers) {
        for (const port of container.ports) {
          if (port.protocol === 'TCP') {
            ports.push(String(port.containerPort));
          }
        }
      }
    }
  } else if (response.kind === 'ServiceList') {
    // Service response
    for (const item of response.items) {
      for (const port of item.spec.ports) {
        if (port.protocol === 'TCP') {
          ports.push(String(port.port));
        }
      }
    }
  }

  if (ports.length === 0) {
    // Add the default Prometheus port if no ports are found
    ports.push(DEFAULT_PROMETHEUS_PORT);
  }

  return ports;
}

/**
 * Tests if prometheus will respond to a query.
 * @param {string} prometheusPodName - The name of the Prometheus pod.
 * @param {string} prometheusPodNamespace - The namespace of the Prometheus pod.
 * @param {string} prometheusPodPort - The port of the Prometheus pod.
 */
async function testPrometheusQuery(
  kubernetesType: KubernetesType,
  prometheusPodName: string,
  prometheusPodNamespace: string,
  prometheusPodPort: string
): Promise<boolean> {
  const queryParams = new URLSearchParams();
  queryParams.append('query', 'up');
  const start = Math.floor(Date.now() / 1000);
  const testSuccess = await fetchMetrics({
    prefix: `${prometheusPodNamespace}/${kubernetesType}/${prometheusPodName}${prometheusPodPort ? `:${prometheusPodPort}` : ''}`,
    query: 'up',
    from: start - 86400,
    to: start,
    step: 300,
  }).then(() => {
    return true;
  }).catch(() => {
    return false;
  });

  return testSuccess;
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
