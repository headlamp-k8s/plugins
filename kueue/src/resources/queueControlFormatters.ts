import type { StopPolicy } from './clusterQueue';

export type StopPolicyColor = 'success' | 'warning' | 'error' | 'default';

/**
 * Returns a theme-friendly color representing the queue's maintenance state.
 */
export function getStopPolicyColor(stopPolicy?: StopPolicy | string): StopPolicyColor {
  switch (stopPolicy) {
    case 'HoldAndDrain':
      return 'error';
    case 'Hold':
      return 'warning';
    case 'None':
    case undefined:
    case '':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Returns a human-readable title for the StopPolicy state.
 */
export function getStopPolicyLabel(stopPolicy?: StopPolicy | string): string {
  switch (stopPolicy) {
    case 'HoldAndDrain':
      return 'Drain (HoldAndDrain)';
    case 'Hold':
      return 'Paused (Hold)';
    case 'None':
    case undefined:
    case '':
      return 'Active (None)';
    default:
      return stopPolicy;
  }
}

/**
 * Returns a detailed operational description explaining the impact of the policy.
 */
export function getStopPolicyDescription(stopPolicy?: StopPolicy | string): string {
  switch (stopPolicy) {
    case 'HoldAndDrain':
      return 'Queue is in Drain mode: new admissions are blocked and running workloads are evicted.';
    case 'Hold':
      return 'Queue is in Pause mode: new admissions are blocked. In-flight workloads continue running.';
    case 'None':
    case undefined:
    case '':
      return 'Queue is Active and admitting pending workloads normally.';
    default:
      return `Custom stop policy: ${stopPolicy}`;
  }
}

/**
 * Returns the target patch object for updating the queue's stop policy.
 */
export function createStopPolicyPatch(policy: StopPolicy) {
  return {
    spec: {
      stopPolicy: policy,
    },
  };
}
