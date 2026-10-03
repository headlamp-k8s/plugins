/** Velero label on Backup CRs created from a Schedule. */
export const VELERO_SCHEDULE_NAME_LABEL = 'velero.io/schedule-name';

/**
 * Sentinel selector that matches no Backup CRs.
 * Used while schedules are unknown/empty so coverage does not list every Backup.
 */
export const NO_MATCH_SCHEDULE_BACKUP_SELECTOR = `${VELERO_SCHEDULE_NAME_LABEL}=__headlamp_velero_no_schedules__`;

/**
 * Build a labelSelector that returns only Backups created by the given schedules.
 * Coverage and schedule views only need last-backup-per-schedule, not every Backup CR.
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
