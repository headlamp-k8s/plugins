import type { KueueCondition } from './clusterQueue';

/** Minimal AdmissionCheck condition shape needed to summarize its Active state. */
export type AdmissionCheckConditionLike = Pick<KueueCondition, 'type' | 'status' | 'reason' | 'message'>;

/** Reference to the parameters object configuring an AdmissionCheck. */
export interface AdmissionCheckParametersLike {
  apiGroup?: string;
  kind?: string;
  name?: string;
}

/** Render the controller name that processes an AdmissionCheck. */
export function renderControllerName(controllerName?: string) {
  return controllerName || '-';
}

/** Render an AdmissionCheck's parameters reference as `kind/name (apiGroup)`. */
export function renderParameters(parameters?: AdmissionCheckParametersLike) {
  if (!parameters || !parameters.name) {
    return '-';
  }

  const kind = parameters.kind || 'Unknown';
  const apiGroup = parameters.apiGroup ? ` (${parameters.apiGroup})` : '';

  return `${kind}/${parameters.name}${apiGroup}`;
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