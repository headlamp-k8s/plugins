import { VolcanoQueue } from '../resources/queue';
import { getParentQueue } from './volcanoRelationships';

function queue(cluster: string, name: string, parent?: string) {
  return { cluster, metadata: { name }, spec: { parent } } as unknown as VolcanoQueue;
}

describe('getParentQueue', () => {
  it('finds the parent queue in the same cluster as the queue', () => {
    const rootA = queue('cluster-a', 'root');
    const rootB = queue('cluster-b', 'root');
    const queues = [rootA, rootB];

    expect(getParentQueue(queue('cluster-a', 'default', 'root'), queues)).toBe(rootA);
    expect(getParentQueue(queue('cluster-b', 'default', 'root'), queues)).toBe(rootB);
  });

  it('returns null when the parent is only in another cluster', () => {
    const queues = [queue('cluster-a', 'root')];

    expect(getParentQueue(queue('cluster-b', 'default', 'root'), queues)).toBeNull();
  });

  it('returns null for a queue without a parent', () => {
    expect(getParentQueue(queue('cluster-a', 'root'), [queue('cluster-a', 'root')])).toBeNull();
  });
});
