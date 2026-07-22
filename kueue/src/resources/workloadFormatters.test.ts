import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { PodSet, WorkloadConditionLike } from './workload';
import {
  findWorkloadCondition,
  getAdmissionFlavorNames,
  getWorkloadDetailRouteParams,
  renderAdmissionClusterQueue,
  renderAdmissionFlavors,
  renderAdmissionSummary,
  renderAdmittedStatus,
  renderBoolean,
  renderFinishedStatus,
  renderNumber,
  renderOwnerReferences,
  renderPodSetRequests,
  renderPodSetsSummary,
  renderPriority,
  renderPriorityClassName,
  renderQueueName,
  renderReclaimablePodsSummary,
  renderRequeueState,
  renderResourceList,
  renderStringMap,
  renderText,
  renderWorkloadStatus,
} from './workloadFormatters';

describe('Workload formatters', () => {
  it('formats scalar values with empty fallbacks while preserving explicit zeroes', () => {
    expect(renderText('team-a')).toBe('team-a');
    expect(renderText('')).toBe('-');
    expect(renderText(null)).toBe('-');
    expect(renderText(undefined)).toBe('-');

    expect(renderNumber(0)).toBe(0);
    expect(renderNumber(10)).toBe(10);
    expect(renderNumber(null)).toBe('-');
    expect(renderNumber(undefined)).toBe('-');

    expect(renderBoolean(true)).toBe('Yes');
    expect(renderBoolean(false)).toBe('No');
    expect(renderBoolean(null)).toBe('-');
    expect(renderBoolean(undefined)).toBe('-');
  });

  it('formats common Workload list values', () => {
    expect(renderQueueName('sample-local-queue')).toBe('sample-local-queue');
    expect(renderQueueName()).toBe('-');
    expect(renderPriority(0)).toBe(0);
    expect(renderPriority()).toBe('-');
    expect(renderPriorityClassName('high-priority')).toBe('high-priority');
    expect(renderPriorityClassName()).toBe('-');
  });

  it('finds Workload conditions by type', () => {
    const conditions: WorkloadConditionLike[] = [
      { type: 'QuotaReserved', status: 'True' },
      { type: 'Admitted', status: 'False', reason: 'Pending' },
    ];

    expect(findWorkloadCondition(conditions, 'Admitted')).toEqual({
      type: 'Admitted',
      status: 'False',
      reason: 'Pending',
    });
    expect(findWorkloadCondition(conditions, 'Finished')).toBeUndefined();
  });

  it('derives admitted and finished display values from admission and conditions', () => {
    expect(renderAdmittedStatus({ clusterQueue: 'sample-cluster-queue' })).toBe('Yes');
    expect(renderAdmittedStatus(undefined, [{ type: 'Admitted', status: 'True' }])).toBe('Yes');
    expect(renderAdmittedStatus(undefined, [{ type: 'Admitted', status: 'False' }])).toBe('No');
    expect(renderAdmittedStatus(undefined, [{ type: 'Admitted', status: 'Unknown' }])).toBe(
      'Unknown'
    );
    expect(renderAdmittedStatus()).toBe('Unknown');

    expect(renderFinishedStatus([{ type: 'Finished', status: 'True' }])).toBe('Yes');
    expect(renderFinishedStatus([{ type: 'Finished', status: 'False' }])).toBe('No');
    expect(renderFinishedStatus([{ type: 'Finished', status: 'Unknown' }])).toBe('Unknown');
    expect(renderFinishedStatus()).toBe('Unknown');
  });

  it('derives readable Workload status from Kueue condition types and reasons', () => {
    expect(renderWorkloadStatus([], false)).toBe('Deactivated');
    expect(renderWorkloadStatus([{ type: 'Finished', status: 'True' }], true)).toBe('Finished');
    expect(renderWorkloadStatus([{ type: 'Evicted', status: 'True' }], true)).toBe('Evicted');
    expect(
      renderWorkloadStatus([{ type: 'Evicted', status: 'True', reason: 'PodsReadyTimeout' }], true)
    ).toBe('PodsReadyTimeout');
    expect(renderWorkloadStatus([{ type: 'Preempted', status: 'True' }], true)).toBe('Preempted');
    expect(renderWorkloadStatus([{ type: 'DeactivationTarget', status: 'True' }], true)).toBe(
      'Deactivated'
    );
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
    expect(
      renderWorkloadStatus([], true, {
        clusterQueue: 'sample-cluster-queue',
      })
    ).toBe('Admitted');
    expect(renderWorkloadStatus([{ type: 'QuotaReserved', status: 'True' }], true)).toBe('Pending');
    expect(renderWorkloadStatus([{ type: 'Requeued', status: 'True' }], true)).toBe('Pending');
    expect(renderWorkloadStatus([{ type: 'Admitted', status: 'False' }], true)).toBe('Pending');
    expect(
      renderWorkloadStatus(
        [
          {
            type: 'QuotaReserved',
            status: 'False',
            reason: 'Inadmissible',
            message: "LocalQueue missing-local-queue doesn't exist",
          },
        ],
        true
      )
    ).toBe('Inadmissible');
    expect(
      renderWorkloadStatus([{ type: 'QuotaReserved', status: 'False', reason: 'Pending' }], true)
    ).toBe('Pending');
    expect(renderWorkloadStatus()).toBe('Unknown');
  });

  it('summarizes pod sets and pod set requests', () => {
    const podSet: PodSet = {
      name: 'main',
      count: 2,
      template: {
        spec: {
          initContainers: [
            {
              name: 'setup',
              resources: {
                requests: {
                  memory: '64Mi',
                },
              },
            },
          ],
          containers: [
            {
              name: 'worker',
              resources: {
                requests: {
                  cpu: '1',
                  memory: '128Mi',
                },
              },
            },
            {
              name: 'sidecar',
              resources: {},
            },
          ],
        },
      },
    };

    expect(renderPodSetsSummary()).toBe('-');
    expect(renderPodSetsSummary([{ count: 1 }, { name: 'worker', count: 0 }])).toBe(
      'main (1), worker (0)'
    );
    expect(renderPodSetsSummary([podSet])).toBe('main (2)');
    expect(renderPodSetRequests(podSet)).toBe('setup: memory=64Mi; worker: cpu=1, memory=128Mi');
    expect(renderPodSetRequests({ name: 'empty' })).toBe('-');
  });

  it('formats resource lists and string maps deterministically', () => {
    expect(renderResourceList()).toBe('-');
    expect(renderResourceList({ memory: '128Mi', cpu: '1' })).toBe('cpu=1, memory=128Mi');
    expect(renderStringMap()).toBe('-');
    expect(renderStringMap({ team: 'platform', app: 'trainer' })).toBe(
      'app=trainer, team=platform'
    );
  });

  it('formats admission cluster queue, flavor names, and admission summaries', () => {
    const admission = {
      clusterQueue: 'sample-cluster-queue',
      podSetAssignments: [
        {
          name: 'main',
          flavors: {
            cpu: 'default-flavor',
            memory: 'default-flavor',
          },
        },
        {
          name: 'worker',
          flavors: {
            'nvidia.com/gpu': 'gpu-flavor',
          },
        },
      ],
    };

    expect(renderAdmissionClusterQueue()).toBe('-');
    expect(renderAdmissionClusterQueue(admission)).toBe('sample-cluster-queue');
    expect(getAdmissionFlavorNames(admission)).toEqual(['default-flavor', 'gpu-flavor']);
    expect(renderAdmissionFlavors()).toBe('-');
    expect(renderAdmissionFlavors(admission)).toBe('default-flavor, gpu-flavor');
    expect(renderAdmissionSummary()).toBe('-');
    expect(renderAdmissionSummary(admission)).toBe(
      'ClusterQueue sample-cluster-queue; default-flavor, gpu-flavor; 2 pod set assignments'
    );
  });

  it('formats reclaimable pods, requeue state, and owner references', () => {
    const ownerReferences: KubeOwnerReference[] = [
      {
        apiVersion: 'batch/v1',
        blockOwnerDeletion: true,
        controller: true,
        kind: 'Job',
        name: 'sample-kueue-workload',
        uid: 'uid',
      },
    ];

    expect(renderReclaimablePodsSummary()).toBe('-');
    expect(
      renderReclaimablePodsSummary([
        { name: 'main', count: 1 },
        { name: 'worker', count: 0 },
      ])
    ).toBe('main: 1, worker: 0');
    expect(renderRequeueState()).toBe('-');
    expect(renderRequeueState({})).toBe('-');
    expect(renderRequeueState({ count: 0, requeueAt: '2026-07-27T10:00:00Z' })).toBe(
      'Count: 0; Requeue at: 2026-07-27T10:00:00Z'
    );
    expect(renderOwnerReferences()).toBe('-');
    expect(renderOwnerReferences(ownerReferences)).toBe('Job/sample-kueue-workload');
  });

  it('builds namespaced detail route params', () => {
    expect(kueueRoutePaths.workloadDetail).toBe('/kueue/workloads/:namespace/:name');
    expect(getWorkloadDetailRouteParams('default', 'sample-job')).toEqual({
      namespace: 'default',
      name: 'sample-job',
    });
    expect(getWorkloadDetailRouteParams(undefined, undefined)).toEqual({
      namespace: '',
      name: '',
    });
  });
});
