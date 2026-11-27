import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition } from './clusterQueue';
import type { PodSet, WorkloadConditionLike } from './workload';
import {
  findWorkloadCondition,
  formatQuantity,
  getAdmissionFlavorNames,
  getQuotaFitRows,
  getWorkloadBlocker,
  getWorkloadDetailRouteParams,
  getWorkloadTimeline,
  parseQuantity,
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
  renderQueuePosition,
  renderReclaimablePodsSummary,
  renderRequeueState,
  renderResourceList,
  renderStringMap,
  renderText,
  renderTopologyAssignment,
  renderWorkloadStatus,
  resolveAccumulatedPastExecutionTimeSeconds,
  resolvePriorityClassName,
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

  it('resolves priority class name from either the v1beta2 or v1beta1 Workload shape', () => {
    expect(resolvePriorityClassName({ priorityClassRef: { name: 'high-priority' } })).toBe(
      'high-priority'
    );
    expect(resolvePriorityClassName({ priorityClassName: 'high-priority' })).toBe('high-priority');
    expect(
      resolvePriorityClassName({
        priorityClassRef: { name: 'v1beta2-priority' },
        priorityClassName: 'v1beta1-priority',
      })
    ).toBe('v1beta2-priority');
    expect(resolvePriorityClassName({})).toBeUndefined();
  });

  it('resolves accumulated past execution time from either the v1beta2 or v1beta1 Workload shape', () => {
    expect(
      resolveAccumulatedPastExecutionTimeSeconds({ accumulatedPastExecutionTimeSeconds: 120 })
    ).toBe(120);
    expect(
      resolveAccumulatedPastExecutionTimeSeconds({ accumulatedPastExexcutionTimeSeconds: 120 })
    ).toBe(120);
    expect(
      resolveAccumulatedPastExecutionTimeSeconds({ accumulatedPastExexcutionTimeSeconds: 0 })
    ).toBe(0);
    expect(
      resolveAccumulatedPastExecutionTimeSeconds({
        accumulatedPastExecutionTimeSeconds: 200,
        accumulatedPastExexcutionTimeSeconds: 100,
      })
    ).toBe(200);
    expect(resolveAccumulatedPastExecutionTimeSeconds({})).toBeUndefined();
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
    expect(renderFinishedStatus([{ type: 'Admitted', status: 'True' }])).toBe('No');
    expect(renderFinishedStatus()).toBe('No');
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
    expect(
      renderWorkloadStatus(
        [
          { type: 'Admitted', status: 'True' },
          { type: 'WaitingForReplacementPods', status: 'True' },
        ],
        true
      )
    ).toBe('Waiting for replacement pods');
    expect(
      renderWorkloadStatus(
        [
          { type: 'Admitted', status: 'True' },
          { type: 'PodsReady', status: 'True' },
          { type: 'WaitingForReplacementPods', status: 'True' },
        ],
        true
      )
    ).toBe('Running');
    expect(
      renderWorkloadStatus(
        [
          { type: 'Admitted', status: 'True' },
          { type: 'WaitingForReplacementPods', status: 'False' },
        ],
        true
      )
    ).toBe('Admitted');
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
      getWorkloadBlocker([condition('QuotaReserved', 'True'), condition('Admitted', 'False')], null)
        ?.pendingAdmissionChecks
    ).toEqual([]);
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

  describe('renderQueuePosition', () => {
    const items = [
      {
        metadata: { name: 'head', namespace: 'team-a' },
        positionInClusterQueue: 0,
        positionInLocalQueue: 0,
      },
      {
        metadata: { name: 'tail', namespace: 'team-a' },
        positionInClusterQueue: 2,
        positionInLocalQueue: 1,
      },
    ];

    it('reports one-based positions in both queues', () => {
      expect(renderQueuePosition(items, 'head', 'team-a')).toBe(
        '1 in its LocalQueue, 1 in its ClusterQueue'
      );
      expect(renderQueuePosition(items, 'tail', 'team-a')).toBe(
        '2 in its LocalQueue, 3 in its ClusterQueue'
      );
    });

    it('returns null when the Workload is not listed', () => {
      expect(renderQueuePosition(items, 'tail', 'team-b')).toBeNull();
      expect(renderQueuePosition(items, 'missing', 'team-a')).toBeNull();
      expect(renderQueuePosition(undefined, 'head', 'team-a')).toBeNull();
    });
  });

  describe('quota fit', () => {
    it('parses Kubernetes quantities', () => {
      expect(parseQuantity('500m')).toBe(0.5);
      expect(parseQuantity('2Gi')).toBe(2 * 2 ** 30);
      expect(parseQuantity('1k')).toBe(1000);
      expect(parseQuantity('1e3')).toBe(1000);
      expect(parseQuantity('1E')).toBe(1e18);
      expect(parseQuantity(4)).toBe(4);
      expect(parseQuantity('.5')).toBe(0.5);
      expect(parseQuantity('abc')).toBeNaN();
      expect(parseQuantity('1Xi')).toBeNaN();
    });

    it('formats amounts per resource', () => {
      expect(formatQuantity('memory', 128 * 2 ** 20)).toBe('128Mi');
      expect(formatQuantity('memory', 1.5 * 2 ** 30)).toBe('1.5Gi');
      expect(formatQuantity('memory', 0)).toBe('0');
      expect(formatQuantity('memory', 2 ** 30 + 2 ** 20)).toBe('1025Mi');
      expect(formatQuantity('memory', 1e9)).toBe('1G');
      expect(formatQuantity('memory', 2 ** 30 + 1)).toBe('1073741825');
      expect(formatQuantity('cpu', 0.2)).toBe('200m');
      expect(formatQuantity('cpu', 63)).toBe('63');
      expect(formatQuantity('cpu', 1.001)).toBe('1.001');
      expect(formatQuantity('nvidia.com/gpu', 2)).toBe('2');
    });

    const groups = [
      {
        coveredResources: ['cpu', 'memory'],
        flavors: [
          {
            name: 'default-flavor',
            resources: [
              { name: 'cpu', nominalQuota: '2' },
              { name: 'memory', nominalQuota: '2Gi' },
            ],
          },
          { name: 'spot', resources: [{ name: 'cpu', nominalQuota: '8' }] },
        ],
      },
    ];
    const reservation = [
      {
        name: 'default-flavor',
        resources: [
          { name: 'cpu', total: '1500m' },
          { name: 'memory', total: '3Gi' },
        ],
      },
    ];

    it('sums requests over PodSets and compares them with each flavor', () => {
      const requests = [
        { name: 'driver', resources: { cpu: '1', memory: '128Mi' } },
        { name: 'workers', resources: { cpu: '3' } },
      ];
      expect(getQuotaFitRows(requests, groups, reservation)).toEqual([
        {
          resource: 'cpu',
          flavor: 'default-flavor',
          requested: 4,
          quota: 2,
          free: 0.5,
          fits: false,
          aboveQuota: true,
        },
        {
          resource: 'cpu',
          flavor: 'spot',
          requested: 4,
          quota: 8,
          free: 8,
          fits: true,
          aboveQuota: false,
        },
        // Reserved above nominal (borrowing) leaves nothing free, not a negative amount.
        {
          resource: 'memory',
          flavor: 'default-flavor',
          requested: 128 * 2 ** 20,
          quota: 2 * 2 ** 30,
          free: 0,
          fits: false,
          aboveQuota: false,
        },
        {
          resource: 'memory',
          flavor: 'spot',
          requested: 128 * 2 ** 20,
          quota: 0,
          free: 0,
          fits: false,
          aboveQuota: true,
        },
      ]);
    });

    it('reports a resource no resource group covers', () => {
      expect(
        getQuotaFitRows([{ name: 'main', resources: { 'nvidia.com/gpu': '1' } }], groups)
      ).toEqual([
        {
          resource: 'nvidia.com/gpu',
          requested: 1,
          quota: 0,
          free: 0,
          fits: false,
          aboveQuota: true,
        },
      ]);
    });

    it('counts exact CPU fits as fitting despite floating point error', () => {
      const cpuGroups = [
        {
          coveredResources: ['cpu'],
          flavors: [{ name: 'f', resources: [{ name: 'cpu', nominalQuota: '300m' }] }],
        },
      ];
      // 300m nominal minus 200m reserved leaves 0.09999999999999998 in floating point.
      const [partlyUsed] = getQuotaFitRows(
        [{ name: 'main', resources: { cpu: '100m' } }],
        cpuGroups,
        [{ name: 'f', resources: [{ name: 'cpu', total: '200m' }] }]
      );
      expect(partlyUsed.fits).toBe(true);

      // 100m + 200m sums to 0.30000000000000004.
      const [summed] = getQuotaFitRows(
        [
          { name: 'a', resources: { cpu: '100m' } },
          { name: 'b', resources: { cpu: '200m' } },
        ],
        cpuGroups
      );
      expect(summed.fits).toBe(true);

      const [over] = getQuotaFitRows([{ name: 'main', resources: { cpu: '301m' } }], cpuGroups);
      expect(over.fits).toBe(false);
    });

    it('flags a request above the whole quota apart from one waiting for free quota', () => {
      const rows = getQuotaFitRows(
        [{ name: 'main', resources: { cpu: '800m', memory: '2Gi' } }],
        [
          {
            coveredResources: ['cpu', 'memory'],
            flavors: [
              {
                name: 'f',
                resources: [
                  { name: 'cpu', nominalQuota: '1500m' },
                  { name: 'memory', nominalQuota: '1Gi' },
                ],
              },
            ],
          },
        ],
        [
          {
            name: 'f',
            resources: [
              { name: 'cpu', total: '700m' },
              { name: 'memory', total: '128Mi' },
            ],
          },
        ]
      );
      // 1500m - 700m is 0.7999999999999999 in floating point, still an exact fit.
      expect(rows[0]).toMatchObject({ resource: 'cpu', fits: true, aboveQuota: false });
      expect(rows[1]).toMatchObject({ resource: 'memory', fits: false, aboveQuota: true });
    });

    it('returns nothing without requests', () => {
      expect(getQuotaFitRows(undefined, groups, reservation)).toEqual([]);
      expect(getQuotaFitRows(null, groups, reservation)).toEqual([]);
    });

    it('treats null resource groups and reservation as empty', () => {
      const cpuRequest = [{ name: 'main', resources: { cpu: '100m' } }];
      const cpuGroups = [
        {
          coveredResources: ['cpu'],
          flavors: [{ name: 'f', resources: [{ name: 'cpu', nominalQuota: '1' }] }],
        },
      ];
      expect(getQuotaFitRows(cpuRequest, cpuGroups, null)[0]).toMatchObject({
        free: 1,
        fits: true,
      });
      expect(getQuotaFitRows(cpuRequest, null)[0]).toMatchObject({ quota: 0, fits: false });
    });

    it('rounds nominal quota up like Kueue before comparing', () => {
      const quotaOf = (name: string, nominalQuota: string) => [
        { coveredResources: [name], flavors: [{ name: 'f', resources: [{ name, nominalQuota }] }] },
      ];

      // 1.1Gi is 1181116006.4 bytes, which Kueue rounds up to 1181116007.
      const memory = quotaOf('memory', '1.1Gi');
      const [exact] = getQuotaFitRows(
        [{ name: 'main', resources: { memory: '1181116007' } }],
        memory
      );
      expect(exact).toMatchObject({ quota: 1181116007, fits: true, aboveQuota: false });
      const [byteOver] = getQuotaFitRows(
        [{ name: 'main', resources: { memory: '1181116008' } }],
        memory
      );
      expect(byteOver).toMatchObject({ fits: false, aboveQuota: true });

      // A whole quota is kept as is, even at 1Pi where the tolerance reaches one byte.
      const [petabyte] = getQuotaFitRows(
        [{ name: 'main', resources: { storage: '1Pi' } }],
        quotaOf('storage', '1Pi')
      );
      expect(petabyte).toMatchObject({ quota: 2 ** 50, fits: true, aboveQuota: false });

      // 1Ti plus 1m rounds up to 1Ti plus a byte, though floating point drops the 1m.
      const [fraction] = getQuotaFitRows(
        [{ name: 'main', resources: { memory: '1099511627777' } }],
        quotaOf('memory', '1099511627776001m')
      );
      expect(fraction).toMatchObject({ quota: 2 ** 40 + 1, fits: true, aboveQuota: false });

      // CPU rounds up to whole millicores, so 100.5m allows 101m.
      const cpu = quotaOf('cpu', '100.5m');
      const [milli] = getQuotaFitRows([{ name: 'main', resources: { cpu: '101m' } }], cpu);
      expect(milli).toMatchObject({ fits: true, aboveQuota: false });
      const [milliOver] = getQuotaFitRows([{ name: 'main', resources: { cpu: '102m' } }], cpu);
      expect(milliOver.aboveQuota).toBe(true);

      // A quota already in whole millicores is unchanged by floating point error.
      const [whole] = getQuotaFitRows(
        [{ name: 'main', resources: { cpu: '1101m' } }],
        quotaOf('cpu', '1.1')
      );
      expect(whole).toMatchObject({ quota: 1.1, aboveQuota: true });
    });
  });
});
