import { describe, expect, it } from 'vitest';
import { buildCohortTrees } from './cohortRelations';

describe('Cohort tree builder', () => {
  it('groups ClusterQueues into Cohort trees correctly', () => {
    const mockClusterQueues = [
      { metadata: { name: 'cq-team-a' }, cohortName: 'prod-cohort' },
      { metadata: { name: 'cq-team-b' }, cohortName: 'prod-cohort' },
      { metadata: { name: 'cq-standalone' }, cohortName: '-' },
    ];

    const trees = buildCohortTrees(mockClusterQueues as any);
    expect(trees.length).toBe(1);
    expect(trees[0].name).toBe('prod-cohort');
    expect(trees[0].members.length).toBe(2);
    expect(trees[0].members.map(m => m.name)).toEqual(['cq-team-a', 'cq-team-b']);
  });

  it('supports mocks with cohort property directly', () => {
    const mockClusterQueues = [
      { name: 'cq-1', cohort: 'team-cohort' },
      { name: 'cq-2', cohort: 'team-cohort' },
    ];
    const trees = buildCohortTrees(mockClusterQueues as any);
    expect(trees.length).toBe(1);
    expect(trees[0].name).toBe('team-cohort');
    expect(trees[0].members.length).toBe(2);
  });

  it('builds hierarchical parent-child Cohort trees', () => {
    const mockCohorts = [
      { metadata: { name: 'root-cohort' }, spec: {} },
      { metadata: { name: 'child-cohort' }, spec: { parentName: 'root-cohort' } },
    ];
    const mockClusterQueues = [
      { metadata: { name: 'cq-root' }, cohortName: 'root-cohort' },
      { metadata: { name: 'cq-child' }, cohortName: 'child-cohort' },
    ];

    const trees = buildCohortTrees(mockClusterQueues as any, mockCohorts as any);
    expect(trees.length).toBe(1);
    expect(trees[0].name).toBe('root-cohort');
    expect(trees[0].members.map(m => m.name)).toEqual(['cq-root']);
    expect(trees[0].children?.length).toBe(1);
    expect(trees[0].children![0].name).toBe('child-cohort');
    expect(trees[0].children![0].members.map(m => m.name)).toEqual(['cq-child']);
  });

  it('returns empty array when no ClusterQueues belong to a cohort and no cohorts exist', () => {
    const mockClusterQueues = [{ metadata: { name: 'cq-standalone' }, cohortName: '-' }];
    expect(buildCohortTrees(mockClusterQueues as any)).toEqual([]);
  });
});
