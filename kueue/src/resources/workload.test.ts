if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

import { describe, expect, it } from 'vitest';
import { Workload } from './workload';
import { getWorkloadDetailRouteParams, renderPodSetsSummary, renderWorkloadStatus } from './workloadFormatters';

describe('Workload resource and formatters', () => {
  it('formats podSets summary correctly', () => {
    const podSets = [
      { name: 'main', count: 2 },
      { name: 'workers', count: 8 },
    ];
    expect(renderPodSetsSummary(podSets)).toBe('main: 2, workers: 8');
    expect(renderPodSetsSummary([])).toBe('-');
    expect(renderPodSetsSummary(undefined)).toBe('-');
  });

  it('evaluates status label from conditions', () => {
    expect(renderWorkloadStatus([{ type: 'Finished', status: 'True' }])).toBe('Finished');
    expect(renderWorkloadStatus([{ type: 'Evicted', status: 'True' }])).toBe('Evicted');
    expect(renderWorkloadStatus([{ type: 'Admitted', status: 'True' }])).toBe('Admitted');
    expect(renderWorkloadStatus([])).toBe('Pending');
    expect(renderWorkloadStatus(undefined)).toBe('Pending');
  });

  it('correctly parses Workload KubeObject instances', () => {
    const rawWorkload = {
      apiVersion: 'kueue.x-k8s.io/v1beta2',
      kind: 'Workload',
      metadata: { name: 'test-wl', namespace: 'default' },
      spec: {
        queueName: 'user-queue',
        priority: 100,
        podSets: [{ name: 'main', count: 4 }],
      },
      status: {
        admission: {
          clusterQueue: 'cq-main',
        },
        conditions: [{ type: 'Admitted', status: 'True' }],
      },
    };

    const wl = new Workload(rawWorkload as any);
    expect(wl.queueName).toBe('user-queue');
    expect(wl.priority).toBe(100);
    expect(wl.clusterQueueName).toBe('cq-main');
    expect(wl.isAdmitted).toBe(true);
    expect(wl.isFinished).toBe(false);
    expect(wl.statusLabel).toBe('Admitted');
  });

  it('handles missing route parameters safely', () => {
    expect(getWorkloadDetailRouteParams('team-a', 'job-wl')).toEqual({
      namespace: 'team-a',
      name: 'job-wl',
    });
    expect(getWorkloadDetailRouteParams(undefined, undefined)).toEqual({
      namespace: '',
      name: '',
    });
  });
});
