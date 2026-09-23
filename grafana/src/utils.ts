import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

/**
 * ClusterLevelConf represents the configuration for a single cluster.
 * @typedef {Object} ClusterLevelConf
 * @property {string} grafanaUrl - The URL for the Grafana instance associated with this cluster.
 */
type ClusterLevelConf = {
  grafanaUrl: string;
};

/**
 * Config represents the configuration for the Grafana plugin.
 * @typedef {Object} Config
 * @property {ClusterLevelConf} [cluster] - The configuration for a specific cluster, where the key is the cluster name.
 */
type Config = {
  [cluster: string]: ClusterLevelConf;
};

let configStoreInstance: ConfigStore<Config> | null = null;

/**
 * Returns a ConfigStore instance for the Grafana plugin.
 * @returns {ConfigStore<Config>} A ConfigStore instance for managing the Grafana plugin configuration.
 */
export function getConfigStore(): ConfigStore<Config> {
  if (!configStoreInstance) {
    configStoreInstance = new ConfigStore<Config>('@headlamp-k8s/grafana');
  }
  return configStoreInstance;
}

/**
 * Retrieves the configuration for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 * @returns {ClusterLevelConf | null} The configuration for the specified cluster, or null if not found.
 */
export function getClusterConfig(cluster: string): ClusterLevelConf | null {
  const configStore = getConfigStore();
  const conf = configStore.get();
  if (!conf) {
    return null;
  }
  return conf[cluster] || null;
}
