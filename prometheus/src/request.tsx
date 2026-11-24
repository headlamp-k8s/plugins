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

export type PrometheusEndpoint = {
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
  strategyId: PrometheusSearchStrategyId;
  resourceType: KubernetesType;
  labelSelector: string;
  /** Whether a resource with the label was found, reachable or not. */
  matched: boolean;
  matchedResource?: {
    name: string;
    namespace: string;
    /** The ports that were tried. */
    ports: string[];
    /** The port Prometheus answered a query on, if any. */
    reachablePort?: string;
  };
  error?: string;
}

export interface DiscoveryIntrospectionResult {
  steps: SearchStrategyStepResult[];
  finalEndpoint: PrometheusEndpoint;
}

export type PrometheusSearchStrategyId =
  | 'customPod'
  | 'customService'
  | 'standardPod'
  | 'standardService';

export const PROMETHEUS_SEARCH_STRATEGIES: {
  id: PrometheusSearchStrategyId;
  resourceType: KubernetesType;
  labelSelector: string;
}[] = [
  { id: 'customPod', resourceType: KubernetesType.pods, labelSelector: CUSTOM_HEADLAMP_LABEL },
  {
    id: 'customService',
    resourceType: KubernetesType.services,
    labelSelector: CUSTOM_HEADLAMP_LABEL,
  },
  {
    id: 'standardPod',
    resourceType: KubernetesType.pods,
    labelSelector: COMMON_PROMETHEUS_POD_LABEL,
  },
  {
    id: 'standardService',
    resourceType: KubernetesType.services,
    labelSelector: COMMON_PROMETHEUS_SERVICE_LABEL,
  },
];

/**
 * Returns the first Prometheus pod or service that fits our search and is reachable.
 * @returns {Promise<PrometheusEndpoint>} - A promise that resolves to the first reachable Prometheus pod/service or none if none are reachable.
 */
export async function isPrometheusInstalled(): Promise<PrometheusEndpoint> {
  return discoverPrometheus();
}

/**
 * Runs the autodetection search and returns each step it took.
 * A failed search ends it, the same way it ends autodetection.
 * @param {string} [cluster] - The cluster to search. Defaults to the current cluster.
 * @param {function} [onStep] - Called with each step as soon as it completes.
 * @returns {Promise<DiscoveryIntrospectionResult>} - The steps and the endpoint that was found, if any.
 */
export async function inspectPrometheusDiscovery(
  cluster?: string,
  onStep?: (step: SearchStrategyStepResult) => void
): Promise<DiscoveryIntrospectionResult> {
  const steps: SearchStrategyStepResult[] = [];
  const recordStep = (step: SearchStrategyStepResult) => {
    steps.push(step);
    onStep?.(step);
  };

  try {
    const finalEndpoint = await discoverPrometheus(cluster, recordStep);
    return { steps, finalEndpoint };
  } catch {
    // The failed step, with its error, has already been recorded.
    return { steps, finalEndpoint: createPrometheusEndpoint() };
  }
}

/**
 * Tries each search strategy in order and returns the first reachable Prometheus.
 * @param {string} [cluster] - The cluster to search. Defaults to the current cluster.
 * @param {function} [onStep] - Called with each step as soon as it completes.
 * @returns {Promise<PrometheusEndpoint>} - The first reachable Prometheus pod/service or none.
 * @throws If a search request fails.
 */
async function discoverPrometheus(
  cluster?: string,
  onStep?: (step: SearchStrategyStepResult) => void
): Promise<PrometheusEndpoint> {
  for (const [index, strategy] of PROMETHEUS_SEARCH_STRATEGIES.entries()) {
    const step: SearchStrategyStepResult = {
      sequence: index + 1,
      strategyId: strategy.id,
      resourceType: strategy.resourceType,
      labelSelector: strategy.labelSelector,
      matched: false,
    };

    let search: LabelSearchResult;
    try {
      search = await searchKubernetesByLabel(
        strategy.resourceType,
        strategy.labelSelector,
        cluster
      );
    } catch (err) {
      step.error = err instanceof Error ? err.message : String(err);
      onStep?.(step);
      throw err;
    }

    if (search.resource) {
      step.matched = true;
      step.matchedResource = { ...search.resource, reachablePort: search.endpoint.port };
    }
    onStep?.(step);

    if (search.endpoint.type !== KubernetesType.none) {
      return search.endpoint;
    }
  }

  // No Prometheus pod or service found
  return createPrometheusEndpoint();
}

type LabelSearchResult = {
  /** The reachable Prometheus, or none. */
  endpoint: PrometheusEndpoint;
  /** The resource that had the label, whether it was reachable or not. */
  resource?: { name: string; namespace: string; ports: string[] };
};

/**
 * Searches for a Kubernetes resource by label and tests if Prometheus is reachable.
 * @param {KubernetesType} kubernetesType - The type of Kubernetes resource.
 * @param {string} labelSelector - The label selector to search for.
 * @param {string} [cluster] - The cluster to search. Defaults to the current cluster.
 * @returns {Promise<LabelSearchResult>} - A promise that resolves to the reachable Prometheus endpoint (or none) and the resource that had the label, if any.
 */
async function searchKubernetesByLabel(
  kubernetesType: KubernetesType,
  labelSelector: string,
  cluster?: string
): Promise<LabelSearchResult> {
  if (kubernetesType === KubernetesType.none) {
    return { endpoint: createPrometheusEndpoint() };
  }

  const queryParams = new URLSearchParams();
  queryParams.append('labelSelector', labelSelector);

  const searchResponse = await request(`/api/v1/${kubernetesType}?${queryParams}`, {
    method: 'GET',
    ...clusterParam(cluster),
  });

  if (!searchResponse?.kind || ['PodList', 'ServiceList'].indexOf(searchResponse.kind) === -1) {
    return { endpoint: createPrometheusEndpoint() };
  }

  const searchResponseTyped = searchResponse as KubernetesSearchResponse;

  if (searchResponseTyped.items?.length > 0) {
    const metadata = searchResponseTyped.items[0].metadata;
    if (!metadata) {
      return { endpoint: createPrometheusEndpoint() };
    }

    const prometheusName = metadata.name;
    const prometheusNamespace = metadata.namespace;
    const prometheusPorts = getPrometheusPortsFromResponse(searchResponseTyped);
    const resource = {
      name: prometheusName,
      namespace: prometheusNamespace,
      ports: prometheusPorts,
    };

    const testResults = await Promise.all(
      prometheusPorts.map(async prometheusPort => {
        const testSuccess = await testPrometheusQuery(
          kubernetesType,
          prometheusName,
          prometheusNamespace,
          prometheusPort,
          cluster
        );
        return {
          prometheusPort,
          testSuccess,
        };
      })
    );

    for (const result of testResults) {
      if (result.testSuccess) {
        return {
          endpoint: createPrometheusEndpoint(
            kubernetesType,
            prometheusName,
            prometheusNamespace,
            result.prometheusPort
          ),
          resource,
        };
      }
    }

    return { endpoint: createPrometheusEndpoint(), resource };
  }

  return { endpoint: createPrometheusEndpoint() };
}

/**
 * Request options that send a request to the given cluster.
 * Without a cluster, the request goes to the current cluster.
 * @param {string} [cluster] - The cluster name.
 */
function clusterParam(cluster?: string): { cluster?: string } {
  return cluster ? { cluster } : {};
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
 * @param {string} [cluster] - The cluster to query. Defaults to the current cluster.
 */
async function testPrometheusQuery(
  kubernetesType: KubernetesType,
  prometheusName: string,
  prometheusNamespace: string,
  prometheusPort: string,
  cluster?: string
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
    cluster,
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
 * @param {string} [data.cluster] - The cluster to query. Defaults to the current cluster.
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
  cluster?: string;
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
    ...clusterParam(data.cluster),
  });
  if (response.status === 200) {
    return response.json();
  } else {
    const error = new Error(response.statusText);
    return Promise.reject(error);
  }
}
