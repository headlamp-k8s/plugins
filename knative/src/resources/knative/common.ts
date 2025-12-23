type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface Condition {
  type: string;
  status: ConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}
