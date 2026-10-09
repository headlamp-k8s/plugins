import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
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
export function findWorkloadCondition(conditions: WorkloadConditionLike[] = [], type: string) {
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
  Suspended: 'The LocalQueue or ClusterQueue is stopped by its stopPolicy.',
  PendingEvaluation: 'The Workload is queued but Kueue has not evaluated it yet.',
  WaitingForPodsReady: 'Kueue is waiting for other admitted Workloads to become ready first.',
  OnHold: 'The Workload is intentionally on hold.',
  AdmissionGated: 'An admission or preemption gate is blocking this Workload.',
};

const ADMITTED_REASONS: Record<string, string> = {
  UnsatisfiedAdmissionChecks:
    'Quota is reserved, but not every AdmissionCheck on the ClusterQueue has passed.',
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
  stage: 'Evicted' | 'Deactivated' | 'Not evaluated' | 'Waiting for quota' | 'Admission checks';
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
  active?: boolean
): WorkloadBlocker | null {
  if (isConditionTrue(conditions, CONDITION_TYPES.finished)) {
    return null;
  }

  const base = { pendingAdmissionChecks: [], requeueAt: requeueState?.requeueAt };

  const evicted = findWorkloadCondition(conditions, CONDITION_TYPES.evicted);

  if (active === false) {
    // A Rejected AdmissionCheck deactivates the Workload, so keep it and the eviction details.
    const evictedDetails = evicted?.status === 'True' ? evicted : undefined;
    return {
      ...base,
      stage: 'Deactivated',
      reason: evictedDetails?.reason,
      explanation: 'spec.active is false, so Kueue will not admit this Workload.',
      message: evictedDetails?.message,
      pendingAdmissionChecks: admissionChecks.filter(check => check.state === 'Rejected'),
    };
  }

  if (evicted?.status === 'True') {
    return {
      ...base,
      stage: 'Evicted',
      reason: evicted.reason,
      explanation: evicted.reason ? EVICTED_REASONS[evicted.reason] : undefined,
      message: evicted.message,
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

  return {
    ...base,
    stage: 'Admission checks',
    reason: admitted?.reason,
    // Kueue leaves Admitted unset while checks are pending, so fall back to that explanation.
    explanation: ADMITTED_REASONS[admitted?.reason || 'UnsatisfiedAdmissionChecks'],
    message: admitted?.message,
    pendingAdmissionChecks: admissionChecks.filter(check => check.state !== 'Ready'),
  };
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
