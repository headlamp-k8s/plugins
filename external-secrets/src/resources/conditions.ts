export type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface Condition {
  type: string;
  status: ConditionStatus;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

/**
 * Returns the status of the condition with the given type, or undefined when
 * the condition is not present.
 */
export function getConditionStatus(
  conditions: Condition[] | undefined,
  type: string
): ConditionStatus | undefined {
  return conditions?.find(condition => condition.type === type)?.status;
}

/**
 * Returns true only when the condition with the given type is present and set
 * to 'True'. A missing condition, or a 'False'/'Unknown' status, is not ready.
 */
export function isConditionTrue(conditions: Condition[] | undefined, type: string): boolean {
  return getConditionStatus(conditions, type) === 'True';
}
