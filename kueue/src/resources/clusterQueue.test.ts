import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
  },
}));

import { ClusterQueue } from './clusterQueue';

describe('ClusterQueue KubeObject', () => {
  it('correctly extracts spec and status properties', () => {
    const rawCQ = {
      metadata: { name: 'test-cq' },
      spec: {
        cohort: 'test-cohort',
        queueingStrategy: 'BestEffort' as const,
        resourceGroups: [
          {
            coveredResources: ['cpu'],
            flavors: [
              {
                name: 'default',
                resources: [{ name: 'cpu', nominalQuota: '10' }],
              },
            ],
          },
        ],
      },
      status: {
        pendingWorkloads: 5,
        admittedWorkloads: 2,
        conditions: [
          {
            type: 'Active',
            status: 'True' as const,
          },
        ],
      },
    };

    const cq = new ClusterQueue(rawCQ as any);

    expect(cq.cohort).toBe('test-cohort');
    expect(cq.queueingStrategy).toBe('BestEffort');
    expect(cq.pendingWorkloads).toBe(5);
    expect(cq.admittedWorkloads).toBe(2);
    expect(cq.isActive).toBe(true);
    expect(cq.statusMessage).toBe('Active');
    expect(cq.resourceGroups).toHaveLength(1);
    expect(cq.resourceGroups[0].coveredResources).toEqual(['cpu']);
  });

  it('handles default empty values gracefully', () => {
    const cq = new ClusterQueue({ metadata: { name: 'empty-cq' } } as any);

    expect(cq.cohort).toBe('-');
    expect(cq.queueingStrategy).toBe('Strict');
    expect(cq.pendingWorkloads).toBe(0);
    expect(cq.admittedWorkloads).toBe(0);
    expect(cq.isActive).toBe(false);
    expect(cq.statusMessage).toBe('Unknown');
    expect(cq.resourceGroups).toEqual([]);
  });

  it('renders inactive status message with reason', () => {
    const rawCQ = {
      metadata: { name: 'inactive-cq' },
      status: {
        conditions: [
          {
            type: 'Active',
            status: 'False' as const,
            reason: 'FlavorNotFound',
          },
        ],
      },
    };
    const cq = new ClusterQueue(rawCQ as any);

    expect(cq.isActive).toBe(false);
    expect(cq.statusMessage).toBe('Inactive (FlavorNotFound)');
  });
});
