import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;

const CUSTOM_HEADLAMP_LABEL = 'headlamp-prometheus=true';
const COMMON_PROMETHEUS_POD_LABEL = 'app.kubernetes.io/name=prometheus';
const COMMON_PROMETHEUS_SERVICE_LABEL =
  'app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server';
const DEFAULT_PROMETHEUS_PORT = '9090';

type KubernetesPodListResponseItem = {
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

type KubernetesPodListResponse = {
  kind: 'PodList';
  items: KubernetesPodListResponseItem[];
};

type KubernetesServiceListResponseItem = {
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

type KubernetesServiceListResponse = {
  kind: 'ServiceList';
  items: KubernetesServiceListResponseItem[];
};

type KubernetesSearchResponse = KubernetesPodListResponse | KubernetesServiceListResponse;

export enum KubernetesType {
  none = 'none',
  pods = 'pods',
  services = 'services',
}

type PrometheusEndpoint = {
  type: KubernetesType;
  name: string | undefined;
  namespace: string | undefined;
  port: string | undefined;
};

/**
 * Helper to create a new instance of PrometheusEndpoint.
 * @param {KubernetesType} type - The type of Kubernetes resource.
 * @param {string} name - The name of the Kubernetes resource.
 * @param {string} namespace - The namespace of the Kubernetes resource.
 * @param {string} port - The port of the Kubernetes resource.
 * @returns {PrometheusEndpoint} - A new instance of PrometheusEndpoint.
 */
function createPrometheusEndpoint(
  type: KubernetesType = KubernetesType.none,
  name: string | undefined = undefined,
  namespace: string | undefined = undefined,
  port: string | undefined = undefined
): PrometheusEndpoint {
  return {
    type,
    name,
    namespace,
    port,
  };
}

export interface SearchStrategyStepResult {
  sequence: number;
  strategyName: string;
  description: string;
  resourceType: KubernetesType;
  labelSelector: string;
  matched: boolean;
  matchedResource?: {
    name: string;
    namespace: string;
    port: string;
    endpointUrl: string;
    reachable: boolean;
  };
  error?: string;
}

export interface DiscoveryIntrospectionResult {
  steps: SearchStrategyStepResult[];
  finalEndpoint?: PrometheusEndpoint;
  error?: string;
}

export const PROMETHEUS_SEARCH_STRATEGIES = [
  {
    strategyName: 'Custom Pod Label Search',
    description: 'Searches for Pods matching headlamp-prometheus=true label',
    resourceType: KubernetesType.pods,
    labelSelector: CUSTOM_HEADLAMP_LABEL,
  },
  {
    strategyName: 'Custom Service Label Search',
    description: 'Searches for Services matching headlamp-prometheus=true label',
    resourceType: KubernetesType.services,
    labelSelector: CUSTOM_HEADLAMP_LABEL,
  },
  {
    strategyName: 'Standard Pod Label Search',
    description: 'Searches for Pods matching app.kubernetes.io/name=prometheus label',
    resourceType: KubernetesType.pods,
    labelSelector: COMMON_PROMETHEUS_POD_LABEL,
  },
  {
    strategyName: 'Standard Service Label Search',
    description: 'Searches for Services matching app.kubernetes.io/name=prometheus,app.kubernetes.io/component=server label',
    resourceType: KubernetesType.services,
    labelSelector: COMMON_PROMETHEUS_SERVICE_LABEL,
  },
];

/**
 * Returns the first Prometheus pod or service that fits our search and is reachable.
 * @returns {Promise<PrometheusEndpoint>} - A promise that resolves to the first reachable Prometheus pod/service or none if none are reachable.
 */
export async function isPrometheusInstalled(): Promise<PrometheusEndpoint> {
  const introspection = await inspectPrometheusDiscovery();
  return introspection.finalEndpoint || createPrometheusEndpoint();
}

/**
 * Runs all autodetection search strategies sequentially and returns the complete introspection log.
 */
export async function inspectPrometheusDiscovery(): Promise<DiscoveryIntrospectionResult> {
  const steps: SearchStrategyStepResult[] = [];
  let finalEndpoint: PrometheusEndpoint = createPrometheusEndpoint();

  for (let i = 0; i < PROMETHEUS_SEARCH_STRATEGIES.length; i++) {
    const strat = PROMETHEUS_SEARCH_STRATEGIES[i];
    const stepResult: SearchStrategyStepResult = {
      sequence: i + 1,
      strategyName: strat.strategyName,
      description: strat.description,
      resourceType: strat.resourceType,
      labelSelector: strat.labelSelector,
      matched: false,
    };

    try {
      const endpoint = await searchKubernetesByLabel(strat.resourceType, strat.labelSelector);
      if (endpoint.type !== KubernetesType.none) {
        stepResult.matched = true;
        const endpointUrl = `${endpoint.namespace}/${endpoint.type}/${endpoint.name}:${endpoint.port}`;
        stepResult.matchedResource = {
          name: endpoint.name || '',
          namespace: endpoint.namespace || '',
          port: endpoint.port || '',
          endpointUrl,
          reachable: true,
        };
        steps.push(stepResult);
        if (finalEndpoint.type === KubernetesType.none) {
          finalEndpoint = endpoint;
        }
        break;
      }
    } catch (err: any) {
      stepResult.error = err?.message || String(err);
    }
    steps.push(stepResult);
  }

  return {
    steps,
    finalEndpoint,
  };
}

/**
 * Searches for a Kubernetes resource by label and tests if Prometheus is reachable.
 * @param {KubernetesType} kubernetesType - The type of Kubernetes resource.
 * @param {string} labelSelector - The label selector to search for.
 * @returns {Promise<PrometheusEndpoint>} - A promise that resolves to the Prometheus endpoint or none if none are reachable.
 */
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
      prometheusPorts.map(async prometheusPort => {
        const testSuccess = await testPrometheusQuery(
          kubernetesType,
          prometheusName,
          prometheusNamespace,
          prometheusPort
        );
        return {
          prometheusPort,
          testSuccess,
        };
      })
    );

    for (const result of testResults) {
      if (result.testSuccess) {
        return createPrometheusEndpoint(
          kubernetesType,
          prometheusName,
          prometheusNamespace,
          result.prometheusPort
        );
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
 * @param {KubernetesType} kubernetesType - The type of Kubernetes resource.
 * @param {string} prometheusName - The name of the Prometheus pod or service.
 * @param {string} prometheusNamespace - The namespace of the Prometheus pod or service.
 * @param {string} prometheusPort - The port of the Prometheus pod or service.
 */
async function testPrometheusQuery(
  kubernetesType: KubernetesType,
  prometheusName: string,
  prometheusNamespace: string,
  prometheusPort: string
): Promise<boolean> {
  const queryParams = new URLSearchParams();
  queryParams.append('query', 'up');
  const start = Math.floor(Date.now() / 1000);
  const testSuccess = await fetchMetrics({
    prefix: `${prometheusNamespace}/${kubernetesType}/${prometheusName}${
      prometheusPort ? `:${prometheusPort}` : ''
    }`,
    query: 'up',
    from: start - 86400,
    to: start,
    step: 300,
  })
    .then(() => {
      return true;
    })
    .catch(() => {
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
  subPath?: string;
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
  var url = `/api/v1/namespaces/${data.prefix}/proxy/api/v1/query_range?${params.toString()}`;
  if (data.subPath && data.subPath !== '') {
    if (data.subPath.startsWith('/')) {
      data.subPath = data.subPath.slice(1);
    }
    if (data.subPath.endsWith('/')) {
      data.subPath = data.subPath.slice(0, -1);
    }
    url = `/api/v1/namespaces/${data.prefix}/proxy/${
      data.subPath
    }/api/v1/query_range?${params.toString()}`;
  }

  const response = await request(url, {
    method: 'GET',
    isJSON: false,
  });
  if (response.status === 200) {
    return response.json();
  } else {
    const error = new Error(response.statusText);
    return Promise.reject(error);
  }
}
