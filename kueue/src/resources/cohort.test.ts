import { describe, expect, it } from 'vitest';
import { buildCohortTrees } from './cohort';

describe('Cohort tree builder', () => {
  it('groups ClusterQueues into Cohort trees correctly', () => {
    const mockClusterQueues = [
      { metadata: { name: 'cq-team-a' }, cohort: 'prod-cohort' },
      { metadata: { name: 'cq-team-b' }, cohort: 'prod-cohort' },
      { metadata: { name: 'cq-standalone' }, cohort: '-' },
    ];

    const trees = buildCohortTrees(mockClusterQueues as any);
    expect(trees.length).toBe(1);
    expect(trees[0].name).toBe('prod-cohort');
    expect(trees[0].members.length).toBe(2);
    expect(trees[0].members.map(m => m.name)).toEqual(['cq-team-a', 'cq-team-b']);
  });

  it('returns empty array when no ClusterQueues belong to a cohort', () => {
    const mockClusterQueues = [{ metadata: { name: 'cq-standalone' }, cohort: '-' }];
    expect(buildCohortTrees(mockClusterQueues as any)).toEqual([]);
  });
});
