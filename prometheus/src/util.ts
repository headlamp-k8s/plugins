import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { KarpenterDisruptionChart } from './components/Chart/KarpenterDisruptionChart/KarpenterDisruptionChart';
import { NodeClaimCreationChart } from './components/Chart/KarpenterNodeClaimCreationChart/KarpenterNodeClaimCreationChart';
import { KarpenterNodeClaimsProvisionChart } from './components/Chart/KarpenterNodeClaimProvisionChart/KarpenterNodeClaimProvisionChart';
import { KarpenterNodePoolResourceChart } from './components/Chart/KarpenterNodePoolResourceChart/KarpenterNodePoolResourceChart';
import { KarpenterPendingPods } from './components/Chart/KarpenterPendingPods/KarpenterPendingPods';
import { isPrometheusInstalled, KubernetesType } from './request';

export const PLUGIN_NAME = 'prometheus';

/**
 * ClusterData type represents the configuration data for a cluster.
 * @property {boolean} autoDetect - Whether to auto-detect Prometheus metrics.
 * @property {boolean} isMetricsEnabled - Whether metrics are enabled for the cluster.
 * @property {string} address - The address of the Prometheus service.
 * @property {string} defaultTimespan - The default timespan for metrics.
 * @property {string} defaultResolution - The default resolution for metrics.
 */
type ClusterData = {
  autoDetect?: boolean;
  isMetricsEnabled?: boolean;
  address?: string;
  subPath?: string;
  defaultTimespan?: string;
  defaultResolution?: string;
};

/**
 * Conf type represents the configuration data for the prometheus plugin.
 * @property {[cluster: string]: ClusterData} - The configuration data for each cluster.
 */
type Conf = {
  [cluster: string]: ClusterData;
};

/**
 * getConfigStore returns the config store for the prometheus plugin.
 * @returns {ConfigStore<Conf>} The config store.
 */
export function getConfigStore(): ConfigStore<Conf> {
  return new ConfigStore<Conf>(PLUGIN_NAME);
}

/**
 * Checks whether the given string is a valid HTTP or HTTPS URL.
 *
 * @param {string} value - The value to validate.
 * @returns {boolean} True if the value is a valid http/https URL, otherwise false.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * getClusterConfig returns the configuration for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 * @returns {ClusterData | null} The configuration for the cluster, or null if not found.
 */
export function getClusterConfig(cluster: string): ClusterData | null {
  const configStore = getConfigStore();
  const conf = configStore.get();
  if (!cluster || !conf) {
    return null;
  }
  return conf[cluster] || null;
}

/**
 * enableMetrics enables metrics for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 */
export function enableMetrics(cluster: string) {
  const store = getConfigStore();
  const config = store.get() || {};
  const clusterConfig = config[cluster] || { autoDetect: true };
  store.update({
    ...config,
    [cluster]: {
      ...clusterConfig,
      isMetricsEnabled: true,
    },
  });
}

/**
 * disableMetrics disables metrics for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 */
export function disableMetrics(cluster: string) {
  const store = getConfigStore();
  const config = store.get() || {};
  const clusterConfig = config[cluster] || { autoDetect: true };
  store.update({
    ...config,
    [cluster]: {
      ...clusterConfig,
      isMetricsEnabled: false,
    },
  });
}

/**
 * isMetricsEnabled checks if metrics are enabled for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 * @returns {boolean} True if metrics are enabled, false otherwise.
 */
export function isMetricsEnabled(cluster: string): boolean {
  const clusterData = getClusterConfig(cluster);
  return clusterData?.isMetricsEnabled ?? false;
}

/**
 * Resolves the base address for accessing Prometheus for a cluster.
 * Supports full HTTP/HTTPS URLs or `namespace/service` Kubernetes service proxy paths.
 *
 * @param {string} cluster - The name of the cluster.
 * @returns {Promise<string | null>} The prefix for the Prometheus metrics, or null if not found.
 */
export async function getPrometheusPrefix(cluster: string): Promise<string | null> {
  const clusterData = getClusterConfig(cluster);

  // 1. Manual address (external URL or service)
  if (clusterData?.address) {
    const address = clusterData.address.trim().replace(/\/$/, '');

    if (address.startsWith('http://') || address.startsWith('https://')) {
      return address;
    }

    const parts = address.split('/');
    if (parts.length === 2) {
      const [namespace, service] = parts;
      return `${namespace}/services/${service}`;
    }
  }

  // 2. Auto-detect (restore previous behavior)
  if (clusterData?.autoDetect) {
    const prometheusEndpoint = await isPrometheusInstalled();
    if (prometheusEndpoint.type === KubernetesType.none) {
      return null;
    }

    const prometheusPortStr = prometheusEndpoint.port ? `:${prometheusEndpoint.port}` : '';

    return `${prometheusEndpoint.namespace}/${prometheusEndpoint.type}/${prometheusEndpoint.name}${prometheusPortStr}`;
  }

  return null;
}

/**
 * getPrometheusSubPath returns the subpath for the Prometheus metrics.
 * @param {string} cluster - The name of the cluster.
 * @returns {string | null} The subpath for the Prometheus metrics, or null if not found.
 */
export function getPrometheusSubPath(cluster: string): string | null {
  const clusterData = getClusterConfig(cluster);
  return !clusterData?.subPath || clusterData.subPath === '' ? null : clusterData.subPath;
}

/**
 * getPrometheusInterval returns the default timespan for the Prometheus metrics.
 * @param {string} cluster - The name of the cluster.
 * @returns {string} The default timespan for the Prometheus metrics.
 */
export function getPrometheusInterval(cluster: string): string {
  const clusterData = getClusterConfig(cluster);
  return clusterData?.defaultTimespan ?? '24h';
}

/**
 * getPrometheusResolution returns the default resolution for the Prometheus metrics.
 * @param {string} cluster - The name of the cluster.
 * @returns {string} The default resolution for the Prometheus metrics.
 */
export function getPrometheusResolution(cluster: string): string {
  const clusterData = getClusterConfig(cluster);
  return clusterData?.defaultResolution ?? 'medium';
}

export const ChartEnabledKinds = [
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'ReplicaSet',
  'Job',
  'CronJob',
  'PersistentVolumeClaim',
  'ScaledObject',
  'ScaledJob',
  'NodePool',
  'NodeClaim',
];

/**
 * Creates a formatter function that formats timestamps based on the given interval.
 * The formatter maintains state to avoid rendering duplicate timestamps.
 *
 * @param {string} interval - The time interval to format for (e.g. '10m', '1h', '24h', 'week')
 * @returns {function(number): string} A formatter function that takes a timestamp and returns a formatted string
 *
 * @example
 * const formatter = createTickTimestampFormatter('24h');
 * formatter(1698321684); // Returns "10:30"
 * formatter(1698321744); // Returns "" (if same formatted time as previous)
 *
 * Formats:
 * - For intervals <= 48h: "HH:MM" (e.g. "14:30")
 * - For today/yesterday: "HH:00" (e.g. "14:00")
 * - For week/lastweek/7d/14d: "M/D" (e.g. "10/26")
 */
export function createTickTimestampFormatter(interval: string) {
  let prevRenderedTimestamp = null;

  return function (timestamp) {
    const date = new Date(timestamp * 1000);
    let format: string;

    // Determine format based on interval
    switch (interval) {
      case '10m':
      case '30m':
      case '1h':
      case '3h':
      case '6h':
      case '12h':
      case '24h':
      case '48h':
        format = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        break;
      case 'today':
      case 'yesterday':
        format = `${date.getHours()}:00`;
        break;
      case 'week':
      case 'lastweek':
      case '7d':
      case '14d':
        format = `${date.getMonth() + 1}/${date.getDate()}`;
        break;
      default:
        format = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    // Check if the current timestamp is different from the previously rendered one
    const shouldRenderDate = format !== prevRenderedTimestamp;

    // Update the previous timestamp
    prevRenderedTimestamp = format;

    return shouldRenderDate ? format : '';
  };
}

export type PrometheusValue = [number, string];
export type PrometheusResult = {
  metric?: Record<string, string>;
  values: PrometheusValue[];
};
export type PrometheusResponse = {
  data?: {
    result?: PrometheusResult[];
  };
};
export type ChartDataPoint = { timestamp: number; y: number };

/**
 * Extracts chart data from a Prometheus time series result.
 * @param {PrometheusValue[]} values - The values array from a Prometheus result item.
 * @returns {ChartDataPoint[]} - Parsed array of { timestamp, y } objects.
 */
function extractChartData(values: PrometheusValue[] = []): ChartDataPoint[] {
  return values.map(([timestamp, value]) => ({
    timestamp,
    y: Number(value),
  }));
}

/**
 * Processes the first time series in a Prometheus response into chart data.
 * @param {PrometheusResponse} response - The raw Prometheus response.
 * @returns {ChartDataPoint[]} - Parsed chart data for the first series.
 */
export function dataProcessor(response: PrometheusResponse): ChartDataPoint[] {
  const values = response?.data?.result?.[0]?.values;
  return extractChartData(values);
}

/**
 * Creates a data processor for a selected time series index in the Prometheus response.
 * @param {number} selectedIndex - Index of the desired series to process.
 * @returns {(response: PrometheusResponse) => ChartDataPoint[]} - Data processor function for that index.
 */
export function createDataProcessor(
  selectedIndex: number
): (response: PrometheusResponse) => ChartDataPoint[] {
  return function (response: PrometheusResponse): ChartDataPoint[] {
    const values = response?.data?.result?.[selectedIndex]?.values;
    return extractChartData(values);
  };
}

/**
 * Formats a number of bytes into a human-readable string with appropriate units.
 * @param {number} bytes - The number of bytes to format
 * @returns {string} A formatted string with the bytes value and appropriate unit (B, KB, MB, GB, or TB)
 * @example
 * formatBytes(1024) // Returns "1.00KB"
 * formatBytes(1234567) // Returns "1.18MB"
 */
export function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + units[i];
}

// Number of seconds in a day (24h)
const DAY_IN_SECONDS = 86400;

// Time intervals mapped to seconds
const TIME_INTERVALS: Record<string, number> = {
  '1m': 60,
  '10m': 600,
  '30m': 1800,
  '1h': 3600,
  '3h': 10800,
  '6h': 21600,
  '12h': 43200,
  '24h': DAY_IN_SECONDS,
  '48h': 2 * DAY_IN_SECONDS,
  '7d': 7 * DAY_IN_SECONDS,
  '14d': 14 * DAY_IN_SECONDS,
};

// Fixed step sizes in seconds
const FIXED_STEPS: Record<string, number> = {
  '10s': 10,
  '30s': 30,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
};

// Resolution factors for dynamic calculation
const RESOLUTION_FACTORS: Record<string, number> = {
  low: 100,
  medium: 250,
  high: 750,
};

/**
 * Calculates the time range and step size based on the given interval and resolution.
 * @param {string} interval - The time interval (e.g., '10m', '1h', '24h', 'week').
 * @param {string} resolution - The resolution level or fixed interval (e.g., 'low', 'medium', 'high', '10s', '1m', '1h').
 * @returns {Object} An object containing the 'from' timestamp, 'to' timestamp, and 'step' in seconds.
 */
export function getTimeRangeAndStepSize(
  interval: string,
  resolution: string
): { from: number; to: number; step: number } {
  const now = Math.floor(Date.now() / 1000);

  // Calculate time range
  let from: number;
  let to: number = now;

  switch (interval) {
    case 'today':
      from = now - (now % DAY_IN_SECONDS);
      break;
    case 'yesterday':
      from = now - (now % DAY_IN_SECONDS) - DAY_IN_SECONDS;
      to = now - (now % DAY_IN_SECONDS);
      break;
    case 'week':
      from = now - 7 * DAY_IN_SECONDS;
      break;
    case 'lastweek':
      from = now - 14 * DAY_IN_SECONDS;
      to = now - 7 * DAY_IN_SECONDS;
      break;
    default: {
      const duration = TIME_INTERVALS[interval] || 600; // Default to 10 minutes interval
      from = now - duration;
      break;
    }
  }

  // Calculate step size
  let step: number;

  if (resolution in FIXED_STEPS) {
    step = FIXED_STEPS[resolution];
  } else {
    const rangeMs = (to - from) * 1000;
    const factor = RESOLUTION_FACTORS[resolution] || RESOLUTION_FACTORS.medium; // Default to medium resolution
    step = Math.max(Math.floor(rangeMs / factor / 1000), 1);
  }

  return { from, to, step };
}

export const getNodePoolChartConfigs = (name: string) => [
  {
    key: 'usage',
    label: 'Resource Usage',
    icon: 'mdi:chart-bar',
    queries: {
      usageQuery: `karpenter_nodepools_usage{nodepool='${name}'}`,
      limitQuery: `karpenter_nodepools_limit{nodepool='${name}'}`,
    },
    component: KarpenterNodePoolResourceChart,
  },
  {
    key: 'nodes',
    label: 'Allowed Disruptions',
    icon: 'mdi:chip',
    queries: {
      activeNodesQuery: `karpenter_nodepools_allowed_disruptions{nodepool='${name}'}`,
    },
    component: KarpenterDisruptionChart,
  },
  {
    key: 'pending-pods',
    label: 'Pending Pods',
    icon: 'mdi:clock-outline',
    queries: {
      pendingPodsQuery: `sum(karpenter_pods_state{phase='Pending'}) by (reason)`,
    },
    component: KarpenterPendingPods,
  },
];

export const getNodeClaimChartConfigs = (name: string, nodepool?: string) => [
  {
    key: 'creation-rate',
    label: 'Creation Rate',
    icon: 'mdi:chart-line-variant',
    queries: {
      nodeClaimCreationQuery: `sum(rate(karpenter_nodeclaims_created_total{nodepool="${
        nodepool || 'all'
      }"}[5m]))`,
    },
    component: NodeClaimCreationChart,
  },
  {
    key: 'provisioning-duration',
    label: 'Provisioning Duration',
    icon: 'mdi:clock-time-four',
    queries: {
      provisioningDurationQuery: `avg(rate(operator_nodeclaim_status_condition_transition_seconds_sum[5m])) / 
avg(rate(operator_nodeclaim_status_condition_transition_seconds_count[5m]))`,
    },
    component: KarpenterNodeClaimsProvisionChart,
  },
];
