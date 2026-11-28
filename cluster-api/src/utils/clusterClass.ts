import type { ClusterApiCluster } from '../resources/cluster';

/**
 * Returns the namespace of the ClusterClass a Cluster's topology uses: classRef.namespace
 * (v1beta2) or classNamespace (v1beta1), and the Cluster's own namespace when neither is set.
 *
 * @param item - The Cluster resource.
 */
export function getClusterClassNamespace(item: ClusterApiCluster | null | undefined) {
  const topology = item?.spec?.topology;
  return topology?.classRef?.namespace || topology?.classNamespace || item?.metadata?.namespace;
}
