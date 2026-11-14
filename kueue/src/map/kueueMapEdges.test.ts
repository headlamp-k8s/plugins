import { describe, expect, it } from 'vitest';
import { getOwnerEdges, getReferenceEdges, KueueMapObject } from './kueueMapEdges';

function object(
  uid: string,
  name: string,
  extra: Partial<KueueMapObject['metadata']> & { cluster?: string; target?: string[] } = {}
) {
  const { cluster = 'main', target = [], ...metadata } = extra;
  return { cluster, target, metadata: { uid, name, ...metadata } };
}

describe('getReferenceEdges', () => {
  it('links an object to the targets it names', () => {
    const clusterQueue = object('cq', 'team', { target: ['cpu', 'gpu', 'missing'] });
    const flavors = [object('cpu-uid', 'cpu'), object('gpu-uid', 'gpu')];

    expect(getReferenceEdges([clusterQueue], flavors, cq => cq.target)).toEqual([
      { id: 'cq-cpu-uid', source: 'cq', target: 'cpu-uid' },
      { id: 'cq-gpu-uid', source: 'cq', target: 'gpu-uid' },
    ]);
  });

  it('only matches targets in the same cluster', () => {
    const localQueue = object('lq', 'team', { target: ['shared'] });
    const clusterQueues = [object('other', 'shared', { cluster: 'other' })];

    expect(getReferenceEdges([localQueue], clusterQueues, lq => lq.target)).toEqual([]);
  });

  it('only matches targets in the same namespace when asked to', () => {
    const workload = object('wl', 'job-a', { namespace: 'a', target: ['user-queue'] });
    const localQueues = [
      object('lq-b', 'user-queue', { namespace: 'b' }),
      object('lq-a', 'user-queue', { namespace: 'a' }),
    ];

    expect(getReferenceEdges([workload], localQueues, wl => wl.target, true)).toEqual([
      { id: 'wl-lq-a', source: 'wl', target: 'lq-a' },
    ]);
  });
});

describe('getOwnerEdges', () => {
  it('links an object to each owner', () => {
    const workload = object('wl', 'job-a', { ownerReferences: [{ uid: 'job-uid' }] });

    expect(getOwnerEdges([workload, object('orphan', 'orphan')])).toEqual([
      { id: 'wl-job-uid', source: 'wl', target: 'job-uid' },
    ]);
  });
});
