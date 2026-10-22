import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition } from './clusterQueue';
import type { PodSet, WorkloadConditionLike } from './workload';
import {
  findWorkloadCondition,
  getAdmissionFlavorNames,
  getWorkloadBlocker,
  getWorkloadDetailRouteParams,
  getWorkloadTimeline,
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
  renderTopologyAssignment,
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

  it('derives admitted and finished display values from conditions', () => {
    expect(renderAdmittedStatus([{ type: 'Admitted', status: 'True' }])).toBe('Yes');
    expect(renderAdmittedStatus([{ type: 'Admitted', status: 'False' }])).toBe('No');
    expect(renderAdmittedStatus([{ type: 'QuotaReserved', status: 'True' }])).toBe('No');
    expect(renderAdmittedStatus([{ type: 'Admitted', status: 'Unknown' }])).toBe('Unknown');
    expect(renderAdmittedStatus()).toBe('No');

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

  it('renders topology assignments without dumping raw nested objects', () => {
    expect(renderTopologyAssignment()).toBe('-');
    expect(renderTopologyAssignment({ levels: ['kubernetes.io/hostname'], slices: [] })).toBe('-');

    expect(
      renderTopologyAssignment({
        levels: ['cloud.provider.com/topology-block', 'kubernetes.io/hostname'],
        slices: [
          {
            domainCount: 2,
            valuesPerLevel: [
              { universal: 'block-1' },
              { individual: { roots: ['node-1', 'node-2'] } },
            ],
            podCounts: { individual: [2, 1] },
          },
        ],
      })
    ).toBe(
      'cloud.provider.com/topology-block > kubernetes.io/hostname: block-1/node-1 (2), block-1/node-2 (1)'
    );

    expect(
      renderTopologyAssignment({
        levels: ['kubernetes.io/hostname'],
        slices: [
          {
            domainCount: 3,
            valuesPerLevel: [{ individual: { prefix: 'node-', roots: ['1', '2', '3'] } }],
            podCounts: { universal: 1 },
          },
        ],
      })
    ).toBe('kubernetes.io/hostname: node-1 (1), node-2 (1), node-3 (1)');

    const huge = renderTopologyAssignment({
      levels: ['kubernetes.io/hostname'],
      slices: [
        {
          domainCount: 2_000_000_000,
          valuesPerLevel: [{ universal: 'node' }],
          podCounts: { universal: 1 },
        },
      ],
    });
    expect(huge.split(', ')).toHaveLength(21);
    expect(huge.endsWith(', +1999999980 more')).toBe(true);

    expect(
      renderTopologyAssignment({
        levels: ['cloud.provider.com/topology-block', 'kubernetes.io/hostname'],
        domains: [
          { values: ['block-1', 'node-1'], count: 2 },
          { values: ['block-1', 'node-2'], count: 1 },
        ],
      })
    ).toBe(
      'cloud.provider.com/topology-block > kubernetes.io/hostname: block-1/node-1 (2), block-1/node-2 (1)'
    );
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

  it('explains what is blocking a Workload from admission', () => {
    const condition = (
      type: string,
      status: WorkloadConditionLike['status'],
      reason?: string,
      message?: string
    ): WorkloadConditionLike => ({
      type,
      status,
      reason,
      message,
    });

    expect(getWorkloadBlocker([condition('Finished', 'True')])).toBeNull();
    expect(
      getWorkloadBlocker([condition('QuotaReserved', 'True'), condition('Admitted', 'True')])
    ).toBeNull();

    expect(getWorkloadBlocker([])?.stage).toBe('Not evaluated');
    expect(
      getWorkloadBlocker([condition('QuotaReserved', 'False', 'PendingEvaluation')])?.stage
    ).toBe('Not evaluated');
    expect(
      getWorkloadBlocker([condition('Evicted', 'True', 'Deactivated')], [], undefined, false)?.stage
    ).toBe('Deactivated');
    expect(
      getWorkloadBlocker(
        [condition('Evicted', 'True', 'DeactivatedDueToAdmissionCheck', 'check rejected')],
        [
          { name: 'ready-check', state: 'Ready' },
          { name: 'bad-check', state: 'Pending', message: 'Reset to Pending after eviction' },
        ],
        undefined,
        false
      )
    ).toMatchObject({
      stage: 'Deactivated',
      reason: 'DeactivatedDueToAdmissionCheck',
      message: 'check rejected',
      pendingAdmissionChecks: [
        { name: 'bad-check', state: 'Pending', message: 'Reset to Pending after eviction' },
      ],
    });
    expect(
      getWorkloadBlocker(
        [
          condition('Admitted', 'True'),
          condition('DeactivationTarget', 'True', 'AdmissionCheck', 'check rejected'),
        ],
        [{ name: 'bad-check', state: 'Rejected' }]
      )
    ).toMatchObject({
      stage: 'Deactivated',
      reason: 'AdmissionCheck',
      message: 'check rejected',
      pendingAdmissionChecks: [{ name: 'bad-check', state: 'Rejected' }],
    });

    expect(
      getWorkloadBlocker([
        condition('QuotaReserved', 'False', 'NoMatchingFlavor', 'no flavor fits'),
      ])
    ).toMatchObject({
      stage: 'Waiting for quota',
      reason: 'NoMatchingFlavor',
      message: 'no flavor fits',
      explanation: expect.stringContaining('ResourceFlavor'),
    });

    expect(
      getWorkloadBlocker([condition('QuotaReserved', 'False', 'SomethingNew')])?.explanation
    ).toBeUndefined();

    expect(
      getWorkloadBlocker(
        [condition('QuotaReserved', 'True')],
        [
          { name: 'ready-check', state: 'Ready' },
          { name: 'slow-check', state: 'Pending' },
        ]
      )
    ).toMatchObject({
      stage: 'Admission checks',
      explanation: expect.stringContaining('AdmissionCheck'),
      pendingAdmissionChecks: [{ name: 'slow-check', state: 'Pending' }],
    });

    expect(
      getWorkloadBlocker([
        condition('QuotaReserved', 'True'),
        condition('Admitted', 'False', 'UnsatisfiedChecks'),
      ])?.explanation
    ).toContain('AdmissionCheck');

    expect(
      getWorkloadBlocker([
        condition('QuotaReserved', 'True'),
        condition('Admitted', 'False', 'PendingDelayedTopologyRequests'),
      ])
    ).toMatchObject({
      stage: 'Topology assignment',
      explanation: expect.stringContaining('topology'),
      pendingAdmissionChecks: [],
    });

    const delayedAdmission = {
      clusterQueue: 'cq',
      podSetAssignments: [{ name: 'main', delayedTopologyRequest: 'Pending' as const }],
    };
    expect(
      getWorkloadBlocker(
        [condition('QuotaReserved', 'True')],
        [{ name: 'ready-check', state: 'Ready' }],
        undefined,
        undefined,
        delayedAdmission
      )?.stage
    ).toBe('Topology assignment');
    expect(
      getWorkloadBlocker(
        [condition('QuotaReserved', 'True')],
        [{ name: 'slow-check', state: 'Pending' }],
        undefined,
        undefined,
        delayedAdmission
      )?.stage
    ).toBe('Admission checks');

    expect(
      getWorkloadBlocker([condition('QuotaReserved', 'False', 'Waiting')])?.explanation
    ).toContain('ready');

    expect(
      getWorkloadBlocker(
        [
          condition('QuotaReserved', 'False', 'Pending'),
          condition('Evicted', 'True', 'PodsReadyTimeout', 'pods not ready'),
        ],
        [],
        { count: 2, requeueAt: '2026-09-29T10:00:00Z' }
      )
    ).toMatchObject({
      stage: 'Evicted',
      reason: 'PodsReadyTimeout',
      requeueAt: '2026-09-29T10:00:00Z',
    });

    expect(
      getWorkloadBlocker(
        [condition('QuotaReserved', 'True'), condition('Evicted', 'True', 'AdmissionCheck')],
        [
          { name: 'ready-check', state: 'Ready' },
          { name: 'retry-check', state: 'Retry' },
        ]
      )
    ).toMatchObject({
      stage: 'Evicted',
      pendingAdmissionChecks: [{ name: 'retry-check', state: 'Retry' }],
    });
  });

  describe('getWorkloadTimeline', () => {
    const created = '2026-09-29T05:00:00Z';
    const now = new Date('2026-09-29T06:00:00Z').getTime();
    const at = (
      type: string,
      status: KueueCondition['status'],
      lastTransitionTime: string,
      reason?: string
    ): KueueCondition => ({ type, status, lastTransitionTime, reason });
    const states = (conditions: KueueCondition[]) =>
      getWorkloadTimeline(created, conditions, undefined, now).steps.map(step => step.state);

    it('marks a Workload with no conditions as waiting for quota since creation', () => {
      const { steps, eviction } = getWorkloadTimeline(created, [], undefined, now);

      expect(steps.map(step => step.label)).toEqual([
        'Created',
        'Quota reserved',
        'Admitted',
        'Pods ready',
        'Finished',
      ]);
      expect(steps.map(step => step.state)).toEqual([
        'done',
        'current',
        'pending',
        'pending',
        'pending',
      ]);
      expect(steps[1].durationMs).toBe(60 * 60 * 1000);
      expect(eviction).toBeUndefined();
    });

    it('times each stage from the one before it', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:01:00Z'),
          at('PodsReady', 'True', '2026-09-29T05:03:00Z'),
          at('Finished', 'True', '2026-09-29T05:10:00Z', 'Succeeded'),
        ],
        undefined,
        now
      );

      expect(steps.map(step => step.state)).toEqual(['done', 'done', 'done', 'done', 'done']);
      expect(steps.map(step => step.durationMs)).toEqual([
        undefined,
        60 * 1000,
        0,
        2 * 60 * 1000,
        7 * 60 * 1000,
      ]);
    });

    it('waits on Admitted while admission checks are pending', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:30:00Z'),
          at('PodsReady', 'False', '2026-09-29T05:00:00Z', 'WaitForStart'),
        ],
        undefined,
        now
      );

      expect(steps.map(step => step.state)).toEqual([
        'done',
        'done',
        'current',
        'pending',
        'pending',
      ]);
      expect(steps[2].durationMs).toBe(30 * 60 * 1000);
      expect(steps[2].durationFrom).toBe('Quota reserved');
    });

    it('marks a failed Workload and the stages it never reached', () => {
      expect(
        states([
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:01:00Z'),
          at('PodsReady', 'False', '2026-09-29T05:01:00Z', 'WaitForStart'),
          at('Finished', 'True', '2026-09-29T05:02:00Z', 'Failed'),
        ])
      ).toEqual(['done', 'done', 'done', 'skipped', 'failed']);
    });

    it('marks a Workload that failed to start as failed', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:01:00Z'),
          at('PodsReady', 'False', '2026-09-29T05:01:00Z', 'WaitForStart'),
          at('Finished', 'True', '2026-09-29T05:02:00Z', 'FailedToStart'),
        ],
        undefined,
        now
      );

      expect(steps[4]).toMatchObject({ state: 'failed', reason: 'FailedToStart' });
    });

    it('moves on to Finished when Kueue reports no PodsReady condition', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:30:00Z'),
        ],
        undefined,
        now
      );

      expect(steps.map(step => step.state)).toEqual([
        'done',
        'done',
        'done',
        'untracked',
        'current',
      ]);
      expect(steps[4]).toMatchObject({ durationMs: 30 * 60 * 1000, durationFrom: 'Admitted' });
    });

    it('keeps Pods ready reached when a recovering Workload then fails', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:01:00Z'),
          at('PodsReady', 'False', '2026-09-29T05:40:00Z', 'WaitForRecovery'),
          at('Finished', 'True', '2026-09-29T05:50:00Z', 'Failed'),
        ],
        undefined,
        now
      );

      expect(steps.map(step => step.state)).toEqual(['done', 'done', 'done', 'done', 'failed']);
      expect(steps[3].time).toBeUndefined();
      expect(steps[4]).toMatchObject({ durationMs: 49 * 60 * 1000, durationFrom: 'Admitted' });
    });

    it('counts the wait from the eviction once the Workload is back in the queue', () => {
      const { steps, eviction } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'False', '2026-09-29T05:45:00Z', 'Pending'),
          at('Evicted', 'True', '2026-09-29T05:45:00Z', 'PodsReadyTimeout'),
          at('Admitted', 'False', '2026-09-29T05:45:00Z', 'NoReservation'),
        ],
        undefined,
        now
      );

      expect(steps[1]).toMatchObject({
        state: 'current',
        reason: 'Pending',
        durationMs: 15 * 60 * 1000,
        durationFrom: 'Evicted',
      });
      expect(eviction?.reason).toBe('PodsReadyTimeout');
    });

    it('counts a recovery wait from when the Pods lost readiness', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [
          at('QuotaReserved', 'True', '2026-09-29T05:01:00Z'),
          at('Admitted', 'True', '2026-09-29T05:01:00Z'),
          at('PodsReady', 'False', '2026-09-29T05:59:00Z', 'WaitForRecovery'),
        ],
        undefined,
        now
      );

      expect(steps[3]).toMatchObject({
        state: 'current',
        reason: 'WaitForRecovery',
        durationMs: 60 * 1000,
        durationFrom: 'readiness loss',
      });
    });

    it('ignores durations that would run backwards', () => {
      const { steps } = getWorkloadTimeline(
        created,
        [at('QuotaReserved', 'True', '2026-09-29T04:00:00Z')],
        undefined,
        now
      );

      expect(steps[1].durationMs).toBeUndefined();
    });

    it('marks the stage a deactivated Workload stopped at instead of waiting on it', () => {
      const conditions = [at('QuotaReserved', 'True', '2026-09-29T05:01:00Z')];

      const { steps } = getWorkloadTimeline(created, conditions, false, now);
      expect(steps.map(step => step.state)).toEqual([
        'done',
        'done',
        'deactivated',
        'pending',
        'pending',
      ]);
      expect(steps[2].durationMs).toBeUndefined();

      expect(
        getWorkloadTimeline(
          created,
          [...conditions, at('DeactivationTarget', 'True', '2026-09-29T05:30:00Z')],
          true,
          now
        ).steps[2].state
      ).toBe('deactivated');
    });
  });
});
