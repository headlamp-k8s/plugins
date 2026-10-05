import { describe, expect, it } from 'vitest';
import {
  getChildCohorts,
  getCohortClusterQueues,
  groupChildCohortsByParent,
  groupClusterQueuesByCohort,
} from './cohortRelations';

describe('Cohort relationship helpers', () => {
  it('handles undefined related-resource lists', () => {
    expect(getChildCohorts(undefined, 'default')).toEqual([]);
    expect(getCohortClusterQueues(undefined, 'default')).toEqual([]);
  });

  it('handles empty related-resource lists', () => {
    expect(getChildCohorts([], 'default')).toEqual([]);
    expect(getCohortClusterQueues([], 'default')).toEqual([]);
  });

  it('matches exact child Cohorts', () => {
    const child = { spec: { parentName: 'default' } };

    expect(getChildCohorts([child], 'default')).toEqual([child]);
  });

  it('excludes Cohorts with a different parent', () => {
    expect(
      getChildCohorts(
        [{ spec: { parentName: 'default' } }, { spec: { parentName: 'other' } }],
        'default'
      )
    ).toHaveLength(1);
  });

  it('matches exact ClusterQueue Cohorts', () => {
    const clusterQueue = { spec: { cohortName: 'default' } };

    expect(getCohortClusterQueues([clusterQueue], 'default')).toEqual([clusterQueue]);
  });

  it('excludes ClusterQueues without cohortName', () => {
    expect(
      getCohortClusterQueues([{ spec: { cohortName: 'default' } }, { spec: {} }], 'default')
    ).toHaveLength(1);
  });

  it('groups child Cohorts by parentName', () => {
    const childA = { spec: { parentName: 'default' } };
    const childB = { spec: { parentName: 'default' } };
    const root = { spec: {} };

    const groups = groupChildCohortsByParent([childA, childB, root]);

    expect(groups.get('default')).toEqual([childA, childB]);
    expect(groups.has('')).toBe(false);
  });

  it('groups ClusterQueues by cohortName', () => {
    const clusterQueueA = { spec: { cohortName: 'default' } };
    const clusterQueueB = { spec: { cohortName: 'default' } };
    const standaloneClusterQueue = { spec: {} };

    const groups = groupClusterQueuesByCohort([
      clusterQueueA,
      clusterQueueB,
      standaloneClusterQueue,
    ]);

    expect(groups.get('default')).toEqual([clusterQueueA, clusterQueueB]);
    expect(groups.has('')).toBe(false);
  });
});
