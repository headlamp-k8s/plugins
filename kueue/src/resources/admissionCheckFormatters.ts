import type { AdmissionCheckParametersReference } from './admissionCheck';
import type { KueueCondition } from './clusterQueue';

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
