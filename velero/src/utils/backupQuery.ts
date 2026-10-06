/** Velero label on Backup CRs created from a Schedule. */
export const VELERO_SCHEDULE_NAME_LABEL = 'velero.io/schedule-name';

/**
 * Guaranteed no-match selector using two contradictory equality requirements.
 * Used while schedules are unknown/empty so coverage does not list every Backup.
 * Values are valid Kubernetes label tokens (must start/end alphanumeric).
 */
export const NO_MATCH_SCHEDULE_BACKUP_SELECTOR = `${VELERO_SCHEDULE_NAME_LABEL}=headlamp-none-a,${VELERO_SCHEDULE_NAME_LABEL}=headlamp-none-b`;

/**
 * Build a labelSelector that returns only Backups created by the given schedules.
 * Coverage and schedule views filter to schedule-owned Backups (not manual ones),
 * then keep the latest Backup per schedule client-side. This still may transfer
 * full history for those schedules when TTLs are long.
 */
export function buildScheduleBackupLabelSelector(scheduleNames: string[]): string {
  const names = [...new Set(scheduleNames.filter(Boolean))].sort();
  if (names.length === 0) {
    return NO_MATCH_SCHEDULE_BACKUP_SELECTOR;
  }

  const values = names.map(quoteLabelValue);
  return `${VELERO_SCHEDULE_NAME_LABEL} in (${values.join(',')})`;
}

/** Quote a label value when it is not a plain Kubernetes label token. */
function quoteLabelValue(value: string): string {
  if (/^[A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?$/.test(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
