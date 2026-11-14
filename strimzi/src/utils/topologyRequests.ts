/** API paths the topology view reads for one Kafka cluster. */
export interface TopologyRequestPaths {
  nodePools: string;
  podSets: string;
  pods: string;
}

/**
 * Builds the API paths for a Kafka cluster's node pools, pod sets, and pods.
 *
 * Every path is limited to the Kafka cluster's namespace and selects by the
 * `strimzi.io/cluster` label on the server, so users whose permissions only
 * cover that namespace can load the topology, and other clusters' resources
 * are never downloaded.
 *
 * @param namespace - Namespace of the Kafka cluster.
 * @param clusterName - Name of the Kafka cluster.
 * @param kafkaVersion - Served `kafka.strimzi.io` API version.
 * @param coreVersion - Served `core.strimzi.io` API version.
 * @returns The request paths.
 */
export function topologyRequestPaths(
  namespace: string,
  clusterName: string,
  kafkaVersion: string,
  coreVersion: string
): TopologyRequestPaths {
  const ns = encodeURIComponent(namespace);
  const query = `labelSelector=${encodeURIComponent(`strimzi.io/cluster=${clusterName}`)}`;

  return {
    nodePools: `/apis/kafka.strimzi.io/${kafkaVersion}/namespaces/${ns}/kafkanodepools?${query}`,
    podSets: `/apis/core.strimzi.io/${coreVersion}/namespaces/${ns}/strimzipodsets?${query}`,
    pods: `/api/v1/namespaces/${ns}/pods?${query}`,
  };
}
