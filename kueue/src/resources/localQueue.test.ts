import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
  },
}));

import { LocalQueue } from './localQueue';

describe('LocalQueue KubeObject', () => {
  it('correctly extracts properties', () => {
    const rawLQ = {
      metadata: { name: 'test-lq', namespace: 'default' },
      spec: {
        clusterQueue: 'test-cq',
      },
      status: {
        pendingWorkloads: 3,
        admittedWorkloads: 1,
        conditions: [
          {
            type: 'Active',
            status: 'True' as const,
          },
        ],
      },
    };

    const lq = new LocalQueue(rawLQ as any);

    expect(lq.clusterQueue).toBe('test-cq');
    expect(lq.pendingWorkloads).toBe(3);
    expect(lq.admittedWorkloads).toBe(1);
    expect(lq.isActive).toBe(true);
    expect(lq.statusMessage).toBe('Active');
  });

  it('handles default empty values gracefully', () => {
    const lq = new LocalQueue({ metadata: { name: 'empty-lq' } } as any);

    expect(lq.clusterQueue).toBe('-');
    expect(lq.pendingWorkloads).toBe(0);
    expect(lq.admittedWorkloads).toBe(0);
    expect(lq.isActive).toBe(false);
    expect(lq.statusMessage).toBe('Unknown');
  });
});
