import { HPAScalingPolicyType } from '../../resources/scaledobject';

/**
 * Formats an HPA scaling policy value for display. `Percent` policies are a
 * percentage of the current replicas; `Pods` policies are a number of pods.
 */
export function formatHPAPolicyValue(policy: {
  type: HPAScalingPolicyType;
  value: number;
}): string {
  return policy.type === 'Percent' ? `${policy.value}%` : `${policy.value}`;
}
