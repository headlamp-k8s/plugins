import { describe, expect, it } from 'vitest';
import { getChildCohorts, getCohortClusterQueues } from './cohortRelations';

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
});
