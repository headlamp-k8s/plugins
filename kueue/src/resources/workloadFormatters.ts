import type { KueueCondition } from './clusterQueue';
import type { PodSet } from './workload';

/** Minimal condition shape for workload lifecycle checks. */
export type WorkloadConditionLike = Pick<KueueCondition, 'type' | 'status' | 'reason' | 'message'>;

/** Format a compact summary string of pod sets (e.g., "main: 4, workers: 8"). */
export function renderPodSetsSummary(podSets?: PodSet[]): string {
  const sets = podSets || [];
  if (sets.length === 0) {
    return '-';
  }

  return sets.map(ps => `${ps.name}: ${ps.count}`).join(', ');
}

/** Format user-readable status label for a Workload from conditions. */
export function renderWorkloadStatus(conditions?: WorkloadConditionLike[]): 'Admitted' | 'Finished' | 'Evicted' | 'Pending' {
  const list = conditions || [];
  if (list.some(c => c.type === 'Finished' && c.status === 'True')) {
    return 'Finished';
  }
  if (list.some(c => c.type === 'Evicted' && c.status === 'True')) {
    return 'Evicted';
  }
  if (list.some(c => c.type === 'Admitted' && c.status === 'True')) {
    return 'Admitted';
  }
  return 'Pending';
}

/** Format route parameters for Workload detail page links. */
export function getWorkloadDetailRouteParams(namespace?: string, name?: string) {
  return {
    namespace: namespace || '',
    name: name || '',
  };
}
