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
    case '-':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Returns a human-readable title for the StopPolicy state, optionally localized.
 */
export function getStopPolicyLabel(
  stopPolicy?: StopPolicy | string,
  t?: (key: string) => string
): string {
  switch (stopPolicy) {
    case 'HoldAndDrain':
      return t ? t('Drain (HoldAndDrain)') : 'Drain (HoldAndDrain)';
    case 'Hold':
      return t ? t('Paused (Hold)') : 'Paused (Hold)';
    case 'None':
    case undefined:
    case '':
    case '-':
      return t ? t('No maintenance stop policy (None)') : 'No maintenance stop policy (None)';
    default:
      return stopPolicy;
  }
}

/**
 * Returns a detailed operational description explaining the impact of the policy, optionally localized.
 */
export function getStopPolicyDescription(
  stopPolicy?: StopPolicy | string,
  t?: (key: string, options?: Record<string, any>) => string
): string {
  switch (stopPolicy) {
    case 'HoldAndDrain':
      return t
        ? t(
            'Queue is in Drain mode: new admissions are blocked, admitted workloads are evicted, and reservations for Reserving workloads are cancelled.'
          )
        : 'Queue is in Drain mode: new admissions are blocked, admitted workloads are evicted, and reservations for Reserving workloads are cancelled.';
    case 'Hold':
      return t
        ? t(
            'Queue is in Pause mode: new admissions are blocked, reservations for Reserving workloads are cancelled, and in-flight workloads continue running.'
          )
        : 'Queue is in Pause mode: new admissions are blocked, reservations for Reserving workloads are cancelled, and in-flight workloads continue running.';
    case 'None':
    case undefined:
    case '':
    case '-':
      return t
        ? t('No maintenance stop policy is applied to this queue.')
        : 'No maintenance stop policy is applied to this queue.';
    default:
      return t
        ? t('Custom stop policy: {{policy}}', { policy: stopPolicy })
        : `Custom stop policy: ${stopPolicy}`;
  }
}

/**
 * Returns the target patch object for updating the queue's stop policy.
 */
export function createStopPolicyPatch(stopPolicy: StopPolicy) {
  return {
    spec: {
      stopPolicy,
    },
  };
}
