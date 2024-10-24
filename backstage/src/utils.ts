import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

/**
 * ClusterLevelConf represents the configuration for a single cluster.
 * @typedef {Object} ClusterLevelConf
 * @property {string} backstageUrl - The URL for the Backstage instance associated with this cluster.
 */
type ClusterLevelConf = {
  backstageUrl: string;
};

/**
 * Config represents the configuration for the backstage plugin.
 * @typedef {Object} Config
 * @property {ClusterLevelConf} [cluster] - The configuration for a specific cluster, where the key is the cluster name.
 */
type Config = {
  [cluster: string]: ClusterLevelConf;
};

/**
 * Returns a ConfigStore instance for the backstage plugin.
 * @returns {ConfigStore<Config>} A ConfigStore instance for managing the backstage plugin configuration.
 */
export function getConfigStore(): ConfigStore<Config> {
  return new ConfigStore<Config>('@headlamp-k8s/backstage');
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
