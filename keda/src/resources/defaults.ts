/**
 * Defaults that KEDA and Kubernetes apply when a field is not set.
 *
 * These helpers use `??` rather than `||` so that an explicit 0, which is a
 * valid value for all of these fields, is shown as 0 and not as the default.
 *
 * This module has no Headlamp imports so it can be unit tested on its own.
 */

/** Kubernetes Job default for spec.backoffLimit. */
export const DEFAULT_JOB_BACKOFF_LIMIT = 6;

/** KEDA default for ScaledJob successfulJobsHistoryLimit and failedJobsHistoryLimit. */
export const DEFAULT_JOBS_HISTORY_LIMIT = 100;

/** KEDA default for ScaledObject cooldownPeriod, in seconds. */
export const DEFAULT_COOLDOWN_PERIOD = 300;

export function jobBackoffLimitOrDefault(backoffLimit?: number): number {
  return backoffLimit ?? DEFAULT_JOB_BACKOFF_LIMIT;
}

export function jobsHistoryLimitOrDefault(historyLimit?: number): number {
  return historyLimit ?? DEFAULT_JOBS_HISTORY_LIMIT;
}

export function cooldownPeriodOrDefault(cooldownPeriod?: number): number {
  return cooldownPeriod ?? DEFAULT_COOLDOWN_PERIOD;
}
