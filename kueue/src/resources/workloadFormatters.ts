import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type {
  Admission,
  PodSet,
  ReclaimablePod,
  RequeueState,
  ResourceList,
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

/** Render whether Kueue has admitted a Workload. */
export function renderAdmittedStatus(
  admission?: Admission,
  conditions: WorkloadConditionLike[] = []
) {
  if (admission) {
    return 'Yes';
  }

  const admittedCondition = findWorkloadCondition(conditions, CONDITION_TYPES.admitted);

  if (!admittedCondition) {
    return 'Unknown';
  }

  if (admittedCondition.status === 'True') {
    return 'Yes';
  }

  if (admittedCondition.status === 'False') {
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

/** Render a readable Workload status from actual Kueue condition types. */
export function renderWorkloadStatus(
  conditions: WorkloadConditionLike[] = [],
  active?: boolean,
  admission?: Admission
) {
  if (active === false) {
    return 'Deactivated';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.finished)) {
    return 'Finished';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.evicted)) {
    return 'Evicted';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.preempted)) {
    return 'Evicted';
  }

  if (isConditionTrue(conditions, CONDITION_TYPES.deactivationTarget)) {
    return 'Deactivated';
  }

  if (admission || isConditionTrue(conditions, CONDITION_TYPES.admitted)) {
    return isConditionTrue(conditions, CONDITION_TYPES.podsReady) ? 'Running' : 'Admitted';
  }

  if (
    isConditionTrue(conditions, CONDITION_TYPES.quotaReserved) ||
    isConditionTrue(conditions, CONDITION_TYPES.requeued) ||
    conditions.some(
      condition => condition.type === CONDITION_TYPES.admitted && condition.status === 'False'
    )
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
