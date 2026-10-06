/** Maps a Velero Backup or Restore phase to a Headlamp StatusLabel tone. */
export function getBackupStatusColor(phase: string): string {
  switch (phase) {
    case 'Completed':
    case 'Active':
      return 'success';
    case 'Failed':
    case 'PartiallyFailed':
    case 'FailedValidation':
      return 'error';
    case 'InProgress':
    case 'New':
    case 'Deleting':
    case 'Paused':
      return 'warning';
    default:
      return '';
  }
}

/** Alias for Restore phases (same Velero phase vocabulary as Backup). */
export const getRestoreStatusColor = getBackupStatusColor;

/** StatusLabel tone for Schedule statusDisplay (Active / Paused / FailedValidation). */
export const getScheduleStatusColor = getBackupStatusColor;
