import type { KueueCondition } from './clusterQueue';

/** Minimal LocalQueue condition shape needed to summarize queue readiness. */
export type LocalQueueConditionLike = Pick<
  KueueCondition,
  'type' | 'status' | 'reason' | 'message'
>;

/** Render the ClusterQueue reference for LocalQueue list and detail views. */
export function renderClusterQueueName(clusterQueue?: string) {
  return clusterQueue || '-';
}

/** Render the LocalQueue stop policy, falling back when the API omits the field. */
export function renderStopPolicy(stopPolicy?: string) {
  return stopPolicy || '-';
}

/** Render a workload count while preserving explicit zero values. */
export function renderWorkloadCount(count?: number) {
  return count ?? 0;
}

/** Render the user-facing LocalQueue status from its Active condition. */
export function renderLocalQueueStatus(activeCondition?: LocalQueueConditionLike) {
  if (!activeCondition) {
    return 'Unknown';
  }

  if (activeCondition.status === 'True') {
    return 'Active';
  }

  if (activeCondition.status === 'False') {
    return 'Inactive';
  }

  return 'Unknown';
}

/** Build route params for a namespaced LocalQueue detail link. */
export function getLocalQueueDetailRouteParams(namespace?: string, name?: string) {
  return {
    namespace: namespace || '',
    name: name || '',
  };
}
