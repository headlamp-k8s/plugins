import { VolcanoPodGroup } from '../../resources/podgroup';

/**
 * Queue-level counters derived from PodGroup phases.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/podgroup/podgroup.go
 */
export interface QueuePodGroupStats {
  inqueue: number;
  pending: number;
  running: number;
  unknown: number;
  completed: number;
}

/**
 * Builds queue counters from PodGroups using the same phase bucketing as `vcctl queue get/list`.
 *
 * @param podGroups PodGroups to aggregate by queue.
 * @returns Queue counters keyed by queue name.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/get.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/queue/list.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/podgroup/podgroup.go
 */
export function getQueuePodGroupStats(
  podGroups: VolcanoPodGroup[] | null | undefined
): Record<string, QueuePodGroupStats> {
  const stats: Record<string, QueuePodGroupStats> = {};

  for (const podGroup of podGroups ?? []) {
    const queueName = podGroup.queue;
    if (!stats[queueName]) {
      stats[queueName] = {
        inqueue: 0,
        pending: 0,
        running: 0,
        unknown: 0,
        completed: 0,
      };
    }

    switch (podGroup.phase) {
      case 'Inqueue':
        stats[queueName].inqueue += 1;
        break;
      case 'Pending':
        stats[queueName].pending += 1;
        break;
      case 'Running':
        stats[queueName].running += 1;
        break;
      case 'Unknown':
        stats[queueName].unknown += 1;
        break;
      case 'Completed':
        stats[queueName].completed += 1;
        break;
    }
  }

  return stats;
}
