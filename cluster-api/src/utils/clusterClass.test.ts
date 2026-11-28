import { describe, expect, it } from 'vitest';
import type { ClusterApiCluster } from '../resources/cluster';
import { getClusterClassNamespace } from './clusterClass';

/** A Cluster in namespace team-a with the given topology. */
function cluster(topology: object): ClusterApiCluster {
  return {
    apiVersion: 'cluster.x-k8s.io/v1beta2',
    kind: 'Cluster',
    metadata: { name: 'c1', namespace: 'team-a' },
    spec: { topology },
  } as unknown as ClusterApiCluster;
}

describe('getClusterClassNamespace', () => {
  it('uses classRef.namespace (v1beta2)', () => {
    const item = cluster({ classRef: { name: 'quick-start', namespace: 'shared' } });
    expect(getClusterClassNamespace(item)).toBe('shared');
  });

  it('uses classNamespace (v1beta1)', () => {
    const item = cluster({ class: 'quick-start', classNamespace: 'shared' });
    expect(getClusterClassNamespace(item)).toBe('shared');
  });

  it("defaults to the Cluster's namespace", () => {
    expect(getClusterClassNamespace(cluster({ classRef: { name: 'quick-start' } }))).toBe('team-a');
    expect(getClusterClassNamespace(cluster({ class: 'quick-start' }))).toBe('team-a');
  });
});
