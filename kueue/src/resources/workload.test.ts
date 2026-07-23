import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import {
  getWorkloadDetailRouteParams,
  renderAdmissionSummary,
  renderAdmittedStatus,
  renderBoolean,
  renderFinishedStatus,
  renderPodSetsSummary,
  renderPriority,
  renderQueueName,
  renderWorkloadStatus,
} from './workloadFormatters';

describe('Workload formatters', () => {
  it('formats queue, priority, and active values', () => {
    expect(renderQueueName('team-a')).toBe('team-a');
    expect(renderQueueName()).toBe('-');
    expect(renderPriority(0)).toBe(0);
    expect(renderPriority(10)).toBe(10);
    expect(renderPriority()).toBe('-');
    expect(renderBoolean(true)).toBe('Yes');
    expect(renderBoolean(false)).toBe('No');
    expect(renderBoolean()).toBe('-');
  });

  it('derives admitted and finished values from admission and conditions', () => {
    expect(renderAdmittedStatus({ clusterQueue: 'team-a-cq' })).toBe('Yes');
    expect(renderAdmittedStatus(undefined, [{ type: 'Admitted', status: 'True' }])).toBe('Yes');
    expect(renderAdmittedStatus(undefined, [{ type: 'Admitted', status: 'False' }])).toBe('No');
    expect(renderAdmittedStatus()).toBe('Unknown');

    expect(renderFinishedStatus([{ type: 'Finished', status: 'True' }])).toBe('Yes');
    expect(renderFinishedStatus([{ type: 'Finished', status: 'False' }])).toBe('No');
    expect(renderFinishedStatus()).toBe('Unknown');
  });

  it('derives a readable status from known Kueue Workload conditions', () => {
    expect(renderWorkloadStatus([], false)).toBe('Deactivated');
    expect(renderWorkloadStatus([{ type: 'Finished', status: 'True' }], true)).toBe('Finished');
    expect(renderWorkloadStatus([{ type: 'Evicted', status: 'True' }], true)).toBe('Evicted');
    expect(
      renderWorkloadStatus(
        [
          { type: 'Admitted', status: 'True' },
          { type: 'PodsReady', status: 'True' },
        ],
        true
      )
    ).toBe('Running');
    expect(renderWorkloadStatus([{ type: 'Admitted', status: 'True' }], true)).toBe('Admitted');
    expect(renderWorkloadStatus([{ type: 'Admitted', status: 'False' }], true)).toBe('Pending');
    expect(renderWorkloadStatus()).toBe('Unknown');
  });

  it('summarizes podSets and admission without raw object output', () => {
    expect(renderPodSetsSummary([])).toBe('-');
    expect(
      renderPodSetsSummary([
        { name: 'main', count: 3 },
        { name: 'worker', count: 0 },
      ])
    ).toBe('main (3), worker (0)');
    expect(renderAdmissionSummary()).toBe('-');
    expect(
      renderAdmissionSummary({
        clusterQueue: 'team-a-cq',
        podSetAssignments: [{ name: 'main', flavors: { cpu: 'default', memory: 'default' } }],
      })
    ).toBe('ClusterQueue team-a-cq; default; 1 pod set assignment');
  });

  it('builds namespaced detail route params', () => {
    expect(kueueRoutePaths.workloadDetail).toBe('/kueue/workloads/:namespace/:name');
    expect(getWorkloadDetailRouteParams('team-a', 'sample-job')).toEqual({
      namespace: 'team-a',
      name: 'sample-job',
    });
  });

  it('handles missing spec and status values without crashing', () => {
    expect(renderQueueName(undefined)).toBe('-');
    expect(renderPriority(undefined)).toBe('-');
    expect(renderBoolean(undefined)).toBe('-');
    expect(renderPodSetsSummary()).toBe('-');
    expect(renderAdmissionSummary(undefined)).toBe('-');
    expect(renderAdmittedStatus(undefined, undefined)).toBe('Unknown');
    expect(renderFinishedStatus(undefined)).toBe('Unknown');
    expect(renderWorkloadStatus(undefined, undefined, undefined)).toBe('Unknown');
  });
});
