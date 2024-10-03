import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { isPrometheusInstalled } from './request';

/**
 * ClusterData type represents the configuration data for a cluster.
 * @property {boolean} autoDetect - Whether to auto-detect Prometheus metrics.
 * @property {boolean} isMetricsEnabled - Whether metrics are enabled for the cluster.
 * @property {string} address - The address of the Prometheus service.
 * @property {string} defaultTimespan - The default timespan for metrics.
 */
type ClusterData = {
  autoDetect?: boolean;
  isMetricsEnabled?: boolean;
  address?: string;
  defaultTimespan?: string;
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
  return new ConfigStore<Conf>('@headlamp-k8s/prometheus');
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
  store.update({ [cluster]: { isMetricsEnabled: true } });
}

/**
 * disableMetrics disables metrics for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 */
export function disableMetrics(cluster: string) {
  const store = getConfigStore();
  store.update({ [cluster]: { isMetricsEnabled: false } });
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
 * getPrometheusPrefix returns the prefix for the Prometheus metrics.
 * @param {string} cluster - The name of the cluster.
 * @returns {Promise<string | null>} The prefix for the Prometheus metrics, or null if not found.
 */
export async function getPrometheusPrefix(cluster: string): Promise<string | null> {
  // check if cluster has autoDetect enabled
  // if so return the prometheus pod address
  const clusterData = getClusterConfig(cluster);
  if (clusterData?.autoDetect) {
    const [isInstalled, prometheusPodName, prometheusPodNamespace] = await isPrometheusInstalled();
    if (isInstalled) {
      return `${prometheusPodNamespace}/pods/${prometheusPodName}`;
    } else {
      return null;
    }
  }
  if (clusterData?.address) {
    const [namespace, service] = clusterData?.address.split('/');
    return `${namespace}/services/${service}`;
  }
  return null;
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

export const ChartEnabledKinds = [
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'ReplicaSet',
  'Job',
  'CronJob',
];
