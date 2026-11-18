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

/** A topology list that couldn't be read. */
export interface TopologyLoadFailure {
  /** What the list holds, as shown to the user, e.g. "StrimziPodSets". */
  resource: string;
  /** HTTP status of the failed request, when the error carries one. */
  status?: number;
}

/**
 * Returns the items of a settled list request, or an empty list when it failed,
 * so one unreadable list doesn't hide the lists that did load.
 *
 * @param result - The settled request.
 * @returns The listed items.
 */
export function settledItems<T>(result: PromiseSettledResult<{ items?: T[] } | undefined>): T[] {
  return result.status === 'fulfilled' ? (result.value?.items ?? []) : [];
}

/**
 * Collects the list requests that failed.
 *
 * @param results - Each list's user-facing name and its settled request.
 * @returns One entry per failed request, in the given order.
 */
export function topologyLoadFailures(
  results: Array<[resource: string, result: PromiseSettledResult<unknown>]>
): TopologyLoadFailure[] {
  return results
    .filter(([, result]) => result.status === 'rejected')
    .map(([resource, result]) => {
      const status = (result as PromiseRejectedResult).reason?.status;
      return typeof status === 'number' ? { resource, status } : { resource };
    });
}

function failureReason(status: number | undefined): string {
  if (status === 401 || status === 403) return 'no permission';
  if (status === 404) return 'not found';
  return status ? `error ${status}` : 'request failed';
}

/**
 * Builds the note shown above a topology that is missing some lists.
 *
 * @param failures - The lists that couldn't be read.
 * @param namespace - Namespace the lists were read from.
 * @returns The note, or an empty string when nothing failed.
 */
export function describeTopologyFailures(
  failures: TopologyLoadFailure[],
  namespace: string
): string {
  if (failures.length === 0) return '';
  const parts = failures.map(({ resource, status }) => `${resource} (${failureReason(status)})`);
  return `Couldn't read ${parts.join(', ')} in namespace ${namespace}, so the topology may be incomplete.`;
}
