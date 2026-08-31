import type { KueueCondition } from './clusterQueue';

/** Minimal condition shape for MultiKueueCluster status rendering. */
export type MultiKueueConditionLike = Pick<KueueCondition, 'type' | 'status' | 'reason' | 'message'>;

/** Render user-readable connection status string. */
export function renderMultiKueueConnectionStatus(activeCondition?: MultiKueueConditionLike): 'Connected' | 'Disconnected' | 'Unknown' {
  if (!activeCondition) {
    return 'Unknown';
  }

  if (activeCondition.status === 'True') {
    return 'Connected';
  }

  if (activeCondition.status === 'False') {
    return 'Disconnected';
  }

  return 'Unknown';
}

/** Render route params for cluster detail links. */
export function getMultiKueueClusterDetailRouteParams(name?: string) {
  return {
    name: name || '',
  };
}
