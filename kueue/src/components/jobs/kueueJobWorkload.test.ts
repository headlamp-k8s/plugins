import { describe, expect, it } from 'vitest';
import { findOwnedWorkloads, hasPodWorkloads } from './kueueJobWorkload';

function workload(name: string, ownerUids: string[]) {
  return { name, metadata: { ownerReferences: ownerUids.map(uid => ({ uid })) } };
}

function names(items: { name: string }[]) {
  return items.map(item => item.name);
}

describe('hasPodWorkloads', () => {
  it('treats a Deployment and its ReplicaSets as having one Workload per Pod', () => {
    expect(hasPodWorkloads('Deployment')).toBe(true);
    expect(hasPodWorkloads('ReplicaSet')).toBe(true);
  });

  it('gives a StatefulSet and a LeaderWorkerSet their own Workloads', () => {
    expect(hasPodWorkloads('StatefulSet')).toBe(false);
    expect(hasPodWorkloads('LeaderWorkerSet')).toBe(false);
  });
});

describe('findOwnedWorkloads', () => {
  it('finds the Workload of a Pod whose job-uid is its parent', () => {
    const workloads = [workload('other', ['other-pod']), workload('pod-wl', ['pod-uid'])];
    expect(names(findOwnedWorkloads(workloads, 'pod-uid'))).toEqual(['pod-wl']);
  });

  it('finds a Workload shared by a pod group', () => {
    const workloads = [workload('group', ['pod-a', 'pod-b', 'pod-c'])];
    expect(names(findOwnedWorkloads(workloads, 'pod-b'))).toEqual(['group']);
  });

  it('finds the single Workload of a StatefulSet', () => {
    const workloads = [workload('sts-wl', ['sts-uid'])];
    expect(names(findOwnedWorkloads(workloads, 'sts-uid'))).toEqual(['sts-wl']);
  });

  it('finds every group Workload of a LeaderWorkerSet', () => {
    const workloads = [
      workload('lws-0', ['lws-uid']),
      workload('other', ['x']),
      workload('lws-1', ['lws-uid']),
    ];
    expect(names(findOwnedWorkloads(workloads, 'lws-uid'))).toEqual(['lws-0', 'lws-1']);
  });

  it('returns nothing when no Workload is owned by the resource', () => {
    expect(findOwnedWorkloads([workload('x', ['a'])], 'b')).toEqual([]);
    expect(findOwnedWorkloads([{ name: 'y', metadata: {} }], 'b')).toEqual([]);
  });
});
