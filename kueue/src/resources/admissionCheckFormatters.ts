import type { AdmissionCheckParametersReference } from './admissionCheck';
import type { KueueCondition } from './clusterQueue';
import type { AdmissionChecksStrategyLike } from './clusterQueueFormatters';
import type { AdmissionCheckState } from './workload';

/** Minimal AdmissionCheck condition shape needed to summarize its readiness. */
export type AdmissionCheckConditionLike = Pick<
  KueueCondition,
  'type' | 'status' | 'reason' | 'message'
>;

/** Render the controller-specific parameters reference, if any. */
export function renderParametersReference(parameters?: AdmissionCheckParametersReference) {
  if (!parameters) {
    return '-';
  }

  const group = parameters.apiGroup ? `${parameters.apiGroup}/` : '';

  return `${group}${parameters.kind}/${parameters.name}`;
}

/** Render the user-facing AdmissionCheck status from its Active condition. */
export function renderAdmissionCheckStatus(activeCondition?: AdmissionCheckConditionLike) {
  if (!activeCondition) {
    return 'Unknown';
  }

  if (activeCondition.status === 'True') {
    return 'Active';
  }

  if (activeCondition.status === 'False') {
    return 'Inactive';
  }

  return 'Unknown';
}

/** Find the rule that adds an AdmissionCheck to a ClusterQueue, if any. */
export function findAdmissionCheckRule(
  strategy: AdmissionChecksStrategyLike | undefined,
  checkName: string
) {
  return strategy?.admissionChecks?.find(check => check.name === checkName);
}

/** Render the flavors an AdmissionCheck runs on; no flavors means all of them. */
export function renderAdmissionCheckFlavors(onFlavors?: string[]) {
  return onFlavors?.length ? onFlavors.join(', ') : 'All flavors';
}

/** Find a Workload's state for an AdmissionCheck when that check is not Ready yet. */
export function findUnreadyAdmissionCheckState(
  admissionChecks: AdmissionCheckState[] = [],
  checkName: string
) {
  return admissionChecks.find(check => check.name === checkName && check.state !== 'Ready');
}
