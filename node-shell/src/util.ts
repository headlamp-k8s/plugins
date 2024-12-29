import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export const PLUGIN_NAME = 'node-shell';

/**
 * ClusterData type represents the configuration data for a cluster.
 * @property {boolean} isEnabled - Whether node-shell is enabled for the cluster.
 * @property {string} image - Image to create the node shell.
 * @property {string} namespace - The namespace to spawn the pod to create a node shell.
 */
type ClusterData = {
  image?: string;
  namespace?: string;
  isEnabled?: boolean;
};

/**
 * Conf type represents the configuration data for the node-shell plugin.
 * @property {[cluster: string]: ClusterData} - The configuration data for each cluster.
 */
type Conf = {
  [cluster: string]: ClusterData;
};

/**
 * isEnabled checks if node-shell is enabled for a specific cluster.
 * @param {string} cluster - The name of the cluster.
 * @returns {boolean} True or null if node-shell is enabled, false otherwise.
 */
export function isEnabled(cluster: string): boolean {
  const clusterData = getClusterConfig(cluster);
  return clusterData?.isEnabled ?? true;
}

/**
 * getConfigStore returns the config store for the node-shell plugin.
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
