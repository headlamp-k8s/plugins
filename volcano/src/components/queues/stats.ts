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
  // Queue names such as `constructor` are valid, so the map has no prototype to collide with.
  const stats: Record<string, QueuePodGroupStats> = Object.create(null);

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

/**
 * Builds queue counters for each cluster separately. With several clusters selected, queues
 * with the same name, such as `default`, exist in each of them and must not share counters.
 *
 * @param podGroups PodGroups to aggregate, possibly from several clusters.
 * @returns Queue counters keyed by cluster name, then by queue name.
 */
export function getQueuePodGroupStatsByCluster(
  podGroups: VolcanoPodGroup[] | null | undefined
): Record<string, Record<string, QueuePodGroupStats>> {
  // Cluster names are arbitrary strings, so neither map may inherit keys like `constructor`.
  const podGroupsByCluster: Record<string, VolcanoPodGroup[]> = Object.create(null);
  for (const podGroup of podGroups ?? []) {
    (podGroupsByCluster[podGroup.cluster] ??= []).push(podGroup);
  }

  const stats: Record<string, Record<string, QueuePodGroupStats>> = Object.create(null);
  for (const [cluster, clusterPodGroups] of Object.entries(podGroupsByCluster)) {
    stats[cluster] = getQueuePodGroupStats(clusterPodGroups);
  }
  return stats;
}
