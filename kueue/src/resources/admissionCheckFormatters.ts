import type { KueueCondition } from './clusterQueue';

export interface AdmissionCheckParametersRef {
  apiGroup?: string;
  kind?: string;
  name?: string;
}

/** Render a controller name or dash if empty. */
export function renderControllerName(controllerName?: string): string {
  return controllerName?.trim() ? controllerName : '-';
}

/** Render the retry delay with units (supports minutes and seconds). */
export function renderRetryDelay(
  retryDelayMinutes?: number,
  retryDelaySeconds?: number
): string {
  if (retryDelaySeconds !== undefined && retryDelaySeconds !== null) {
    return `${retryDelaySeconds}s`;
  }
  if (retryDelayMinutes !== undefined && retryDelayMinutes !== null) {
    return `${retryDelayMinutes}m`;
  }
  return '-';
}

/** Render a human-readable parameters reference string. */
export function renderParametersRef(parameters?: AdmissionCheckParametersRef | null): string {
  if (!parameters || !parameters.name) {
    return '-';
  }
  const kind = parameters.kind || 'Resource';
  const group = parameters.apiGroup ? `${parameters.apiGroup}/` : '';
  return `${group}${kind}: ${parameters.name}`;
}

/** Render admission check status from active conditions. */
export function renderAdmissionCheckStatus(conditions?: KueueCondition[]): string {
  if (!conditions || conditions.length === 0) {
    return 'Unknown';
  }

  const activeCondition = conditions.find(c => c.type === 'Active');
  if (activeCondition) {
    return activeCondition.status === 'True' ? 'Active' : 'Inactive';
  }

  const readyCondition = conditions.find(c => c.type === 'Ready');
  if (readyCondition) {
    return readyCondition.status === 'True' ? 'Ready' : 'Not Ready';
  }

  return conditions[0].type || 'Unknown';
}
