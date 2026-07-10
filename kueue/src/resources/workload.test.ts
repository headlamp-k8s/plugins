import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
  },
}));

import { Workload } from './workload';

describe('Workload KubeObject', () => {
  it('correctly extracts properties', () => {
    const rawWorkload = {
      metadata: { name: 'test-wl', namespace: 'default' },
      spec: {
        active: true,
        queueName: 'test-lq',
        priority: 100,
        priorityClassName: 'high-priority',
        podSets: [
          {
            count: 2,
            name: 'main',
            template: {
              spec: {
                containers: [{ name: 'web', image: 'nginx' }],
              },
            },
          },
        ],
      },
      status: {
        conditions: [
          {
            type: 'Admitted',
            status: 'True' as const,
          },
        ],
        admission: {
          clusterQueue: 'test-cq',
          podSetFlavors: [
            {
              name: 'main',
              flavors: { cpu: 'default' },
            },
          ],
        },
      },
    };

    const wl = new Workload(rawWorkload as any);

    expect(wl.queueName).toBe('test-lq');
    expect(wl.priority).toBe(100);
    expect(wl.priorityClassName).toBe('high-priority');
    expect(wl.isActive).toBe(true);
    expect(wl.statusMessage).toBe('Admitted');
    expect(wl.podSets).toHaveLength(1);
    expect(wl.admission?.clusterQueue).toBe('test-cq');
  });

  it('handles default empty values gracefully', () => {
    const wl = new Workload({ metadata: { name: 'empty-wl' } } as any);

    expect(wl.queueName).toBe('-');
    expect(wl.priority).toBe(0);
    expect(wl.priorityClassName).toBe('-');
    expect(wl.isActive).toBe(true); // defaults to true
    expect(wl.statusMessage).toBe('Pending');
    expect(wl.podSets).toEqual([]);
    expect(wl.admission).toBeUndefined();
  });

  it('returns Finished status message when Finished condition is True', () => {
    const rawWorkload = {
      metadata: { name: 'finished-wl' },
      status: {
        conditions: [
          { type: 'Admitted', status: 'True' as const },
          { type: 'Finished', status: 'True' as const },
        ],
      },
    };
    const wl = new Workload(rawWorkload as any);
    expect(wl.statusMessage).toBe('Finished');
  });

  it('returns Evicted status message when Evicted condition is True', () => {
    const rawWorkload = {
      metadata: { name: 'evicted-wl' },
      status: {
        conditions: [{ type: 'Evicted', status: 'True' as const, reason: 'Preempted' }],
      },
    };
    const wl = new Workload(rawWorkload as any);
    expect(wl.statusMessage).toBe('Evicted (Preempted)');
  });
});
