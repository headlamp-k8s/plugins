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

  it('creates placeholder nodes for implicit parent Cohorts and groups siblings under it', () => {
    const mockCohorts = [
      { metadata: { name: 'child-a' }, spec: { parentName: 'implicit-parent' } },
      { metadata: { name: 'child-b' }, spec: { parentName: 'implicit-parent' } },
    ];
    const mockClusterQueues = [
      { metadata: { name: 'cq-a' }, cohortName: 'child-a' },
      { metadata: { name: 'cq-b' }, cohortName: 'child-b' },
    ];

    const trees = buildCohortTrees(mockClusterQueues as any, mockCohorts as any);
    expect(trees.length).toBe(1);
    expect(trees[0].name).toBe('implicit-parent');
    expect(trees[0].members).toEqual([]);
    expect(trees[0].children?.length).toBe(2);
    expect(trees[0].children!.map(c => c.name)).toEqual(['child-a', 'child-b']);
    expect(trees[0].children![0].members.map(m => m.name)).toEqual(['cq-a']);
    expect(trees[0].children![1].members.map(m => m.name)).toEqual(['cq-b']);
  });

  it('detects cyclic Cohorts, includes them with isCycle flag, and preserves descendants', () => {
    const mockCohorts = [
      { metadata: { name: 'cohort-a' }, spec: { parentName: 'cohort-b' } },
      { metadata: { name: 'cohort-b' }, spec: { parentName: 'cohort-a' } },
      { metadata: { name: 'cohort-c' }, spec: { parentName: 'cohort-b' } },
    ];
    const mockClusterQueues = [
      { metadata: { name: 'cq-a' }, cohortName: 'cohort-a' },
      { metadata: { name: 'cq-b' }, cohortName: 'cohort-b' },
      { metadata: { name: 'cq-c' }, cohortName: 'cohort-c' },
    ];

    const trees = buildCohortTrees(mockClusterQueues as any, mockCohorts as any);
    expect(trees.length).toBe(1);
    const root = trees[0];
    expect(root.name).toBe('cohort-a');
    expect(root.isCycle).toBe(true);
    expect(root.members.map(m => m.name)).toEqual(['cq-a']);

    expect(root.children?.length).toBe(1);
    const childB = root.children![0];
    expect(childB.name).toBe('cohort-b');
    expect(childB.isCycle).toBe(true);
    expect(childB.members.map(m => m.name)).toEqual(['cq-b']);

    expect(childB.children?.length).toBe(1);
    const childC = childB.children![0];
    expect(childC.name).toBe('cohort-c');
    expect(childC.isCycle).toBeUndefined();
    expect(childC.members.map(m => m.name)).toEqual(['cq-c']);
  });
});
