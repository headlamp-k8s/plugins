import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export const PLUGIN_NAME = 'node-shell';

/**
 * ClusterData type represents the configuration data for a cluster.
 * @property {boolean} autoDetect - Whether to auto-detect Prometheus metrics.
 * @property {boolean} isMetricsEnabled - Whether metrics are enabled for the cluster.
 * @property {string} address - The address of the Prometheus service.
 * @property {string} defaultTimespan - The default timespan for metrics.
 */
type ClusterData = {
  image?: string;
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
