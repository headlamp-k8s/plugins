import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { KueueCondition } from './clusterQueue';
import type {
  Admission,
  AdmissionCheckState,
  PodSet,
  ReclaimablePod,
  RequeueState,
  ResourceList,
  TopologyAssignment,
  TopologyAssignmentSliceLevelValues,
  TopologyAssignmentSlicePodCounts,
  WorkloadConditionLike,
} from './workload';

const CONDITION_TYPES = {
  admitted: 'Admitted',
  quotaReserved: 'QuotaReserved',
  finished: 'Finished',
  podsReady: 'PodsReady',
  evicted: 'Evicted',
  preempted: 'Preempted',
  requeued: 'Requeued',
  deactivationTarget: 'DeactivationTarget',
} as const;

/** Render text values with the plugin's standard empty-value fallback. */
export function renderText(value?: string | null) {
  return value || '-';
}

/** Render a numeric value while preserving explicit zero values. */
export function renderNumber(value?: number | null) {
  return value ?? '-';
}

/** Render a boolean as a short user-facing value. */
export function renderBoolean(value?: boolean | null) {
  if (value === undefined || value === null) {
    return '-';
  }

  return value ? 'Yes' : 'No';
}

/** Render Workload priority while preserving priority 0. */
export function renderPriority(priority?: number | null) {
  return renderNumber(priority);
}

/** Render the LocalQueue name referenced by a Workload. */
export function renderQueueName(queueName?: string) {
  return renderText(queueName);
}

/** Render the current priority class reference name for a Workload. */
export function renderPriorityClassName(priorityClassName?: string) {
  return renderText(priorityClassName);
}

/** Find a named Workload condition from status.conditions. */
export function findWorkloadCondition<T extends WorkloadConditionLike>(
  conditions: T[] = [],
  type: string
) {
  return conditions.find(condition => condition.type === type);
}

/**
 * Render whether Kueue has admitted a Workload. status.admission is set on quota
 * reservation, before admission checks pass, so only the Admitted condition counts.
 * Kueue does not add that condition until it admits, so a missing one means No.
 */
export function renderAdmittedStatus(conditions: WorkloadConditionLike[] = []) {
  const status = findWorkloadCondition(conditions, CONDITION_TYPES.admitted)?.status;

  if (status === 'True') {
    return 'Yes';
  }

  if (status === undefined || status === 'False') {
    return 'No';
  }

  return 'Unknown';
}

/** Render whether the workload's associated job finished. */
export function renderFinishedStatus(conditions: WorkloadConditionLike[] = []) {
  const finishedCondition = findWorkloadCondition(conditions, CONDITION_TYPES.finished);

  if (!finishedCondition) {
    return 'Unknown';
  }

  if (finishedCondition.status === 'True') {
    return 'Yes';
  }

  if (finishedCondition.status === 'False') {
    return 'No';
  }

  return 'Unknown';
}

/** Render a readable Workload status from Kueue condition types and reasons. */
export function renderWorkloadStatus(conditions: WorkloadConditionLike[] = [], active?: boolean) {
  if (active === false) {
    return 'Deactivated';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.finished)) {
    return 'Finished';
  }

  const evictedCondition = findWorkloadCondition(conditions, CONDITION_TYPES.evicted);
  if (evictedCondition?.status === 'True') {
    return evictedCondition.reason || 'Evicted';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.preempted)) {
    return 'Preempted';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.deactivationTarget)) {
    return 'Deactivated';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.admitted)) {
    return isConditionTrue(conditions, CONDITION_TYPES.podsReady) ? 'Running' : 'Admitted';
  }

  const quotaReservedCondition = findWorkloadCondition(conditions, CONDITION_TYPES.quotaReserved);
  if (quotaReservedCondition?.status === 'False') {
    return quotaReservedCondition.reason || 'Pending';
  }

  const admittedCondition = findWorkloadCondition(conditions, CONDITION_TYPES.admitted);
  if (admittedCondition?.status === 'False') {
    return admittedCondition.reason || 'Pending';
  }

  if (
    quotaReservedCondition?.status === 'True' ||
    isConditionTrue(conditions, CONDITION_TYPES.requeued)
  ) {
    return 'Pending';
  }

  return 'Unknown';
}

/** Render a compact summary of Workload podSets for list cells. */
export function renderPodSetsSummary(podSets: PodSet[] = []) {
  if (podSets.length === 0) {
    return '-';
  }

  return podSets.map(podSet => `${podSet.name || 'main'} (${podSet.count ?? 1})`).join(', ');
}

/** Render all requests from a PodSet's containers as readable text. */
export function renderPodSetRequests(podSet: PodSet) {
  const containers = [
    ...(podSet.template?.spec?.initContainers || []),
    ...(podSet.template?.spec?.containers || []),
  ];
  const requests = containers
    .map(container => {
      const resourceRequests = renderResourceList(container.resources?.requests);

      if (resourceRequests === '-') {
        return undefined;
      }

      return `${container.name}: ${resourceRequests}`;
    })
    .filter((value): value is string => !!value);

  return requests.length > 0 ? requests.join('; ') : '-';
}

/** Render a Kubernetes ResourceList as comma-separated resource quantities. */
export function renderResourceList(resources?: ResourceList) {
  const entries = Object.entries(resources || {}).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return '-';
  }

  return entries
    .sort(([resourceA], [resourceB]) => resourceA.localeCompare(resourceB))
    .map(([resource, value]) => `${resource}=${value}`)
    .join(', ');
}

/** Render Kubernetes labels or annotations as compact key-value text. */
export function renderStringMap(values?: Record<string, string>) {
  const entries = Object.entries(values || {});

  if (entries.length === 0) {
    return '-';
  }

  return entries
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

/** Render assigned ClusterQueue from Workload admission. */
export function renderAdmissionClusterQueue(admission?: Admission) {
  return renderText(admission?.clusterQueue);
}

/** Render unique ResourceFlavor names assigned by Workload admission. */
export function renderAdmissionFlavors(admission?: Admission) {
  const flavors = getAdmissionFlavorNames(admission);

  return flavors.length > 0 ? flavors.join(', ') : '-';
}

/** Return unique ResourceFlavor names assigned by Workload admission. */
export function getAdmissionFlavorNames(admission?: Admission) {
  const flavors =
    admission?.podSetAssignments?.flatMap(assignment => Object.values(assignment.flavors || {})) ||
    [];

  return Array.from(new Set(flavors)).filter(Boolean).sort();
}

/** Render a concise admission assignment summary. */
export function renderAdmissionSummary(admission?: Admission) {
  if (!admission) {
    return '-';
  }

  const clusterQueue = renderAdmissionClusterQueue(admission);
  const flavors = renderAdmissionFlavors(admission);
  const assignments = admission.podSetAssignments?.length || 0;
  const assignmentLabel = assignments === 1 ? 'pod set assignment' : 'pod set assignments';

  return `ClusterQueue ${clusterQueue}; ${flavors}; ${assignments} ${assignmentLabel}`;
}

/** Render reclaimable pod counts for a Workload. */
export function renderReclaimablePodsSummary(reclaimablePods: ReclaimablePod[] = []) {
  if (reclaimablePods.length === 0) {
    return '-';
  }

  return reclaimablePods
    .map(reclaimablePod => `${reclaimablePod.name}: ${reclaimablePod.count}`)
    .join(', ');
}

/** Maximum number of topology domains rendered before summarising the rest. */
const MAX_TOPOLOGY_DOMAINS = 20;

/** Resolve one domain's value for a slice level, without expanding the whole level. */
function getSliceLevelValue(level: TopologyAssignmentSliceLevelValues, domainIndex: number) {
  if (level.universal !== undefined) {
    return level.universal;
  }

  const individual = level.individual;
  const root = individual?.roots?.[domainIndex];

  return root === undefined ? '-' : `${individual?.prefix ?? ''}${root}${individual?.suffix ?? ''}`;
}

/** Resolve one domain's pod count for a slice, without expanding the whole list. */
function getSlicePodCount(podCounts: TopologyAssignmentSlicePodCounts | undefined, index: number) {
  return podCounts?.universal ?? podCounts?.individual?.[index] ?? '-';
}

/** Render one domain as "values (count)". */
function renderTopologyDomain(values: string[], count: number | string) {
  return `${values.length === 0 ? '-' : values.join('/')} (${count})`;
}

/**
 * Render a Workload pod set assignment's topology placement, from either the v1beta2 slices
 * or the v1beta1 domains shape. A slice's domainCount can be huge while the object stays tiny
 * (universal values), so only the first MAX_TOPOLOGY_DOMAINS domains are resolved.
 */
export function renderTopologyAssignment(topologyAssignment?: TopologyAssignment) {
  if (!topologyAssignment) {
    return '-';
  }

  const rendered: string[] = [];
  let total = 0;

  for (const slice of topologyAssignment.slices ?? []) {
    const domainCount = Math.max(slice.domainCount ?? 0, 0);
    total += domainCount;

    for (let i = 0; i < domainCount && rendered.length < MAX_TOPOLOGY_DOMAINS; i++) {
      const values = (slice.valuesPerLevel ?? []).map(level => getSliceLevelValue(level, i));
      rendered.push(renderTopologyDomain(values, getSlicePodCount(slice.podCounts, i)));
    }
  }

  for (const domain of topologyAssignment.domains ?? []) {
    total++;

    if (rendered.length < MAX_TOPOLOGY_DOMAINS) {
      rendered.push(renderTopologyDomain(domain.values ?? [], domain.count ?? '-'));
    }
  }

  if (rendered.length === 0) {
    return '-';
  }

  const omitted = total - rendered.length;
  const domains = rendered.join(', ') + (omitted > 0 ? `, +${omitted} more` : '');
  const levels = (topologyAssignment.levels ?? []).join(' > ');

  return levels ? `${levels}: ${domains}` : domains;
}

/** Render requeue state as count and next requeue time. */
export function renderRequeueState(requeueState?: RequeueState) {
  if (!requeueState) {
    return '-';
  }

  const values = [
    requeueState.count !== undefined ? `Count: ${requeueState.count}` : undefined,
    requeueState.requeueAt ? `Requeue at: ${requeueState.requeueAt}` : undefined,
  ].filter(Boolean);

  return values.length > 0 ? values.join('; ') : '-';
}

/** Render owner references without dumping raw objects. */
export function renderOwnerReferences(ownerReferences: KubeOwnerReference[] = []) {
  if (ownerReferences.length === 0) {
    return '-';
  }

  return ownerReferences.map(reference => `${reference.kind}/${reference.name}`).join(', ');
}

const WAITING_FOR_PODS_READY =
  'Kueue is waiting for other admitted Workloads to become ready first.';

const QUOTA_RESERVED_REASONS: Record<string, string> = {
  Pending: 'Kueue has not reserved quota for this Workload yet.',
  WaitingForQuota: 'There is not enough unused quota in the ClusterQueue or its Cohort right now.',
  ExceedsMaxQuota:
    'The Workload requests more than the ClusterQueue could ever provide, even with borrowing.',
  NoMatchingFlavor:
    "No ResourceFlavor in the ClusterQueue matches this Workload's node selectors or tolerations.",
  TopologyPlacementFailed: "The Workload's topology request cannot be satisfied.",
  WaitingForPreemptedWorkloads:
    'Kueue preempted other Workloads to make room and is waiting for them to release quota.',
  Misconfigured:
    'Kueue cannot admit this Workload because required queue or Workload configuration is missing, invalid, or inactive.',
  Inadmissible:
    'Kueue considers this Workload inadmissible because required configuration is missing, invalid, or inactive.',
  Suspended: 'The LocalQueue or ClusterQueue is stopped or otherwise inactive.',
  PendingEvaluation: 'The Workload is queued but Kueue has not evaluated it yet.',
  WaitingForPodsReady: WAITING_FOR_PODS_READY,
  // Reported instead of WaitingForPodsReady while UnadmittedWorkloadsObservability is off.
  Waiting: WAITING_FOR_PODS_READY,
  OnHold: 'The Workload is intentionally on hold.',
  AdmissionGated: 'An admission or preemption gate is blocking this Workload.',
};

const UNSATISFIED_CHECKS =
  'Quota is reserved, but not every AdmissionCheck on the ClusterQueue has passed.';

const ADMITTED_REASONS: Record<string, string> = {
  UnsatisfiedAdmissionChecks: UNSATISFIED_CHECKS,
  // Reported instead of UnsatisfiedAdmissionChecks while UnadmittedWorkloadsObservability is off.
  UnsatisfiedChecks: UNSATISFIED_CHECKS,
  PendingDelayedTopologyRequests:
    'Quota is reserved, and Kueue is still computing the delayed topology assignment.',
};

const EVICTED_REASONS: Record<string, string> = {
  Preempted: 'A higher-priority Workload or quota reclamation preempted this Workload.',
  PodsReadyTimeout: 'The pods did not become ready within the waitForPodsReady timeout.',
  AdmissionCheck: 'An AdmissionCheck asked Kueue to evict this Workload.',
  ClusterQueueStopped: 'The ClusterQueue was stopped.',
  LocalQueueStopped: 'The LocalQueue was stopped.',
  Deactivated: 'The Workload was deactivated (spec.active is false).',
  InactiveWorkload: 'The Workload was deactivated (spec.active is false).',
  NodeFailures: 'Nodes running the Workload failed.',
  MaximumExecutionTimeExceeded: 'The Workload ran longer than its maximum execution time.',
};

/** What is currently stopping a Workload from being admitted, derived from its status. */
export interface WorkloadBlocker {
  /** Short stage label. */
  stage:
    | 'Evicted'
    | 'Deactivated'
    | 'Not evaluated'
    | 'Waiting for quota'
    | 'Admission checks'
    | 'Topology assignment';
  /** Condition reason reported by Kueue. */
  reason?: string;
  /** Plain-English meaning of the reason, when known. */
  explanation?: string;
  /** Kueue's own condition message. */
  message?: string;
  /** Admission checks that are not Ready yet. */
  pendingAdmissionChecks: AdmissionCheckState[];
  /** When Kueue will requeue the Workload after a backoff. */
  requeueAt?: string;
}

/**
 * Explain why a Workload is not admitted, or return null when nothing is blocking it.
 * A missing QuotaReserved condition means Kueue has not looked at the Workload yet,
 * which is different from QuotaReserved=False where Kueue looked and refused.
 */
export function getWorkloadBlocker(
  conditions: WorkloadConditionLike[] = [],
  admissionChecks: AdmissionCheckState[] = [],
  requeueState?: RequeueState,
  active?: boolean,
  admission?: Admission
): WorkloadBlocker | null {
  if (isConditionTrue(conditions, CONDITION_TYPES.finished)) {
    return null;
  }

  const base = { pendingAdmissionChecks: [], requeueAt: requeueState?.requeueAt };

  const evicted = findWorkloadCondition(conditions, CONDITION_TYPES.evicted);

  const deactivationTarget = findWorkloadCondition(conditions, CONDITION_TYPES.deactivationTarget);

  // Kueue sets DeactivationTarget first and only later patches spec.active to false.
  if (active === false || deactivationTarget?.status === 'True') {
    const details = evicted?.status === 'True' ? evicted : deactivationTarget;
    const byAdmissionCheck =
      details?.reason === 'AdmissionCheck' || details?.reason === 'DeactivatedDueToAdmissionCheck';
    return {
      ...base,
      stage: 'Deactivated',
      reason: details?.reason,
      explanation:
        active === false
          ? 'spec.active is false, so Kueue will not admit this Workload.'
          : 'Kueue is deactivating this Workload and will set spec.active to false.',
      message: details?.message,
      // Eviction resets every check to Pending, so a Rejected one is no longer marked as such.
      pendingAdmissionChecks: byAdmissionCheck
        ? admissionChecks.filter(check => check.state !== 'Ready')
        : [],
    };
  }

  if (evicted?.status === 'True') {
    return {
      ...base,
      stage: 'Evicted',
      reason: evicted.reason,
      explanation: evicted.reason ? EVICTED_REASONS[evicted.reason] : undefined,
      message: evicted.message,
      // A check moving to Retry evicts the Workload, so show which checks are still not Ready.
      pendingAdmissionChecks:
        evicted.reason === 'AdmissionCheck'
          ? admissionChecks.filter(check => check.state !== 'Ready')
          : [],
    };
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.admitted)) {
    return null;
  }

  const quotaReserved = findWorkloadCondition(conditions, CONDITION_TYPES.quotaReserved);

  if (!quotaReserved) {
    return {
      ...base,
      stage: 'Not evaluated',
      explanation:
        'Kueue has not tried to reserve quota for this Workload yet, so it has not been refused. ' +
        'It is usually queued behind other Workloads.',
    };
  }

  if (quotaReserved.status !== 'True') {
    return {
      ...base,
      stage: quotaReserved.reason === 'PendingEvaluation' ? 'Not evaluated' : 'Waiting for quota',
      reason: quotaReserved.reason,
      explanation: quotaReserved.reason ? QUOTA_RESERVED_REASONS[quotaReserved.reason] : undefined,
      message: quotaReserved.message,
    };
  }

  const admitted = findWorkloadCondition(conditions, CONDITION_TYPES.admitted);
  const pendingAdmissionChecks = admissionChecks.filter(check => check.state !== 'Ready');
  // With UnadmittedWorkloadsObservability off, Kueue leaves Admitted unset, so read the assignments.
  const topologyPending = admission?.podSetAssignments?.some(
    assignment => !assignment.topologyAssignment && assignment.delayedTopologyRequest === 'Pending'
  );

  if (
    admitted?.reason === 'PendingDelayedTopologyRequests' ||
    (topologyPending && pendingAdmissionChecks.length === 0)
  ) {
    return {
      ...base,
      stage: 'Topology assignment',
      reason: admitted?.reason,
      explanation: ADMITTED_REASONS.PendingDelayedTopologyRequests,
      message: admitted?.message,
    };
  }

  return {
    ...base,
    stage: 'Admission checks',
    reason: admitted?.reason,
    // Kueue leaves Admitted unset while checks are pending, so fall back to that explanation.
    explanation: ADMITTED_REASONS[admitted?.reason || 'UnsatisfiedAdmissionChecks'],
    message: admitted?.message,
    pendingAdmissionChecks,
  };
}

/** One stage of a Workload's lifecycle, as drawn on the detail page timeline. */
export interface WorkloadTimelineStep {
  /** Stage name. */
  label: string;
  /**
   * done: reached; failed: finished with a failure; current: what the Workload waits on now;
   * deactivated: the stage it would wait on, but it is deactivated so Kueue will not admit it;
   * skipped: never reached before the Workload finished; untracked: Kueue reports no PodsReady
   * condition, so readiness is unknown; pending: not reached yet.
   */
  state: 'done' | 'failed' | 'current' | 'deactivated' | 'skipped' | 'untracked' | 'pending';
  /** When the stage was reached. */
  time?: string;
  /** Milliseconds since `durationFrom`, or for the current stage, how long it has waited so far. */
  durationMs?: number;
  /** The stage, Evicted, or readiness loss that `durationMs` is measured from. */
  durationFrom?: string;
  /** Condition reason reported by Kueue. */
  reason?: string;
  /** Kueue's own condition message. */
  message?: string;
}

/** The lifecycle timeline of a Workload and its last eviction, if it is evicted now. */
export interface WorkloadTimeline {
  /** Created, QuotaReserved, Admitted, PodsReady and Finished, in order. */
  steps: WorkloadTimelineStep[];
  /** The Evicted condition while it is True. */
  eviction?: KueueCondition;
}

const TIMELINE_STAGES = [
  { type: CONDITION_TYPES.quotaReserved, label: 'Quota reserved' },
  { type: CONDITION_TYPES.admitted, label: 'Admitted' },
  { type: CONDITION_TYPES.podsReady, label: 'Pods ready' },
  { type: CONDITION_TYPES.finished, label: 'Finished' },
];

// Finished reasons that mean the Workload failed rather than succeeded.
const FAILED_FINISH_REASONS = ['Failed', 'FailedToStart'];

function elapsedMs(from?: string, to?: string | number) {
  if (!from || to === undefined) {
    return undefined;
  }

  const elapsed = new Date(to).getTime() - new Date(from).getTime();
  return Number.isNaN(elapsed) || elapsed < 0 ? undefined : elapsed;
}

/**
 * Build a Workload's lifecycle timeline from its conditions.
 * Kubernetes keeps only the latest transition of each condition, so a Workload that was
 * evicted and admitted again shows the times of its latest attempt, not the first one.
 */
export function getWorkloadTimeline(
  createdAt?: string,
  conditions: KueueCondition[] = [],
  active?: boolean,
  now: number = Date.now()
): WorkloadTimeline {
  const finished = isConditionTrue(conditions, CONDITION_TYPES.finished);
  // Kueue sets DeactivationTarget first and only later patches spec.active to false.
  const deactivated =
    active === false || isConditionTrue(conditions, CONDITION_TYPES.deactivationTarget);
  const evicted = findWorkloadCondition(conditions, CONDITION_TYPES.evicted);
  const eviction = evicted?.status === 'True' ? evicted : undefined;

  const steps: WorkloadTimelineStep[] = [{ label: 'Created', state: 'done', time: createdAt }];
  let previousTime = createdAt;
  let previousLabel = 'Created';
  let waiting = false;

  for (const { type, label } of TIMELINE_STAGES) {
    const condition = findWorkloadCondition(conditions, type);

    if (!waiting && condition?.status === 'True') {
      const time = condition.lastTransitionTime;
      steps.push({
        label,
        state:
          type === CONDITION_TYPES.finished && FAILED_FINISH_REASONS.includes(condition.reason)
            ? 'failed'
            : 'done',
        time,
        durationMs: elapsedMs(previousTime, time),
        durationFrom: previousLabel,
        reason: condition.reason,
        message: condition.message,
      });
      previousTime = time || previousTime;
      previousLabel = label;
    } else if (!waiting && type === CONDITION_TYPES.podsReady && !condition) {
      // Without a PodsReady condition readiness is unknown, so move on to Finished.
      steps.push({ label, state: 'untracked' });
    } else if (!waiting && condition?.reason === 'WaitForRecovery' && finished) {
      // The pods were ready before they failed; only the time they became ready is lost.
      steps.push({ label, state: 'done', reason: condition.reason, message: condition.message });
    } else if (finished) {
      steps.push({ label, state: type === CONDITION_TYPES.finished ? 'done' : 'skipped' });
    } else if (!waiting && deactivated) {
      waiting = true;
      steps.push({ label, state: 'deactivated' });
    } else if (!waiting) {
      waiting = true;
      let waitingSince = previousTime;
      let waitingFrom = previousLabel;
      // An eviction sends the Workload back to the queue, so it has waited since then.
      if (elapsedMs(waitingSince, eviction?.lastTransitionTime) !== undefined) {
        waitingSince = eviction?.lastTransitionTime;
        waitingFrom = 'Evicted';
      }
      // PodsReady turns False with WaitForRecovery when a ready Pod fails after admission.
      if (
        condition?.reason === 'WaitForRecovery' &&
        elapsedMs(waitingSince, condition.lastTransitionTime) !== undefined
      ) {
        waitingSince = condition.lastTransitionTime;
        waitingFrom = 'readiness loss';
      }
      steps.push({
        label,
        state: 'current',
        durationMs: elapsedMs(waitingSince, now),
        durationFrom: waitingFrom,
        reason: condition?.reason,
        message: condition?.message,
      });
    } else {
      steps.push({ label, state: 'pending' });
    }
  }

  return { steps, eviction };
}

/** Build route params for a namespaced Workload detail link. */
export function getWorkloadDetailRouteParams(namespace?: string, name?: string) {
  return {
    namespace: namespace || '',
    name: name || '',
  };
}

function isConditionTrue(conditions: WorkloadConditionLike[], type: string) {
  return findWorkloadCondition(conditions, type)?.status === 'True';
}
