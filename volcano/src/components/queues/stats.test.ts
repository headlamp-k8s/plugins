import { VolcanoPodGroup } from '../../resources/podgroup';
import { getQueuePodGroupStatsByCluster } from './stats';

function podGroup(cluster: string, queue: string, phase: string) {
  return { cluster, queue, phase } as unknown as VolcanoPodGroup;
}

describe('getQueuePodGroupStatsByCluster', () => {
  it('counts a queue name that exists in several clusters separately per cluster', () => {
    const stats = getQueuePodGroupStatsByCluster([
      podGroup('cluster-a', 'default', 'Running'),
      podGroup('cluster-a', 'default', 'Pending'),
      podGroup('cluster-b', 'default', 'Running'),
      podGroup('cluster-b', 'team-q', 'Inqueue'),
    ]);

    expect(stats['cluster-a'].default).toEqual({
      inqueue: 0,
      pending: 1,
      running: 1,
      unknown: 0,
      completed: 0,
    });
    expect(stats['cluster-b'].default).toEqual({
      inqueue: 0,
      pending: 0,
      running: 1,
      unknown: 0,
      completed: 0,
    });
    expect(stats['cluster-a']['team-q']).toBeUndefined();
    expect(stats['cluster-b']['team-q'].inqueue).toBe(1);
  });

  it('treats cluster and queue names that match object prototype keys as ordinary names', () => {
    const stats = getQueuePodGroupStatsByCluster([
      podGroup('constructor', 'default', 'Running'),
      podGroup('__proto__', 'default', 'Pending'),
      podGroup('cluster-a', 'constructor', 'Inqueue'),
      podGroup('cluster-a', 'toString', 'Completed'),
    ]);

    expect(stats['constructor'].default.running).toBe(1);
    expect(stats['__proto__'].default.pending).toBe(1);
    expect(stats['cluster-a']['constructor'].inqueue).toBe(1);
    expect(stats['cluster-a']['toString'].completed).toBe(1);
    expect(stats['toString']).toBeUndefined();
  });

  it('returns no counters when there are no PodGroups', () => {
    expect(getQueuePodGroupStatsByCluster(null)).toEqual({});
    expect(getQueuePodGroupStatsByCluster([])).toEqual({});
  });
});
