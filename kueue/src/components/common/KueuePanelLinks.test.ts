import { describe, expect, it, vi } from 'vitest';
import { getRoutePath, matchKueueDetailPath } from './KueuePanelLinks';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ Activity: { launch: vi.fn() } }));
vi.mock('../admissionchecks/Detail', () => ({ default: () => null }));
vi.mock('../clusterqueues/Detail', () => ({ default: () => null }));
vi.mock('../cohorts/Detail', () => ({ default: () => null }));
vi.mock('../localqueues/Detail', () => ({ default: () => null }));
vi.mock('../resourceflavors/Detail', () => ({ default: () => null }));
vi.mock('../workloads/Detail', () => ({ default: () => null }));
vi.mock('../../map/kueueMapSource', () => ({ kueueIconName: 'icon' }));

describe('matchKueueDetailPath', () => {
  it('matches namespaced Kueue detail routes', () => {
    expect(matchKueueDetailPath('/c/main/kueue/workloads/team-a/job-a-1234')).toMatchObject({
      kind: 'Workload',
      cluster: 'main',
      namespace: 'team-a',
      name: 'job-a-1234',
    });
  });

  it('matches cluster-scoped Kueue detail routes', () => {
    expect(matchKueueDetailPath('/c/main/kueue/clusterqueues/strict')).toMatchObject({
      kind: 'ClusterQueue',
      cluster: 'main',
      name: 'strict',
    });
  });

  it('uses the first cluster when several are selected', () => {
    expect(matchKueueDetailPath('/c/other+main/kueue/workloads/team-a/job-a')).toMatchObject({
      cluster: 'other',
      name: 'job-a',
    });
  });

  it('ignores list pages and other routes', () => {
    expect(matchKueueDetailPath('/c/main/kueue/workloads')).toBeNull();
    expect(matchKueueDetailPath('/c/main/jobs/team-a/job-a')).toBeNull();
  });
});

describe('getRoutePath', () => {
  it('reads the route from the hash in the desktop app', () => {
    const url = new URL('file:///opt/headlamp/index.html#/c/main/kueue/workloads/team-a/job-a');
    expect(getRoutePath(url, '')).toBe('/c/main/kueue/workloads/team-a/job-a');
  });

  it('drops the base URL', () => {
    const url = new URL('https://example.com/headlamp/c/main/kueue/workloads/team-a/job-a');
    expect(getRoutePath(url, '/headlamp')).toBe('/c/main/kueue/workloads/team-a/job-a');
  });

  it('keeps the pathname when served at the root', () => {
    const url = new URL('https://example.com/c/main/kueue/clusterqueues/strict');
    expect(getRoutePath(url, '')).toBe('/c/main/kueue/clusterqueues/strict');
  });
});
