/** Maps a Velero Backup or Restore phase to a Headlamp StatusLabel tone. */
export function getBackupStatusColor(phase: string): string {
  switch (phase) {
    case 'Completed':
    case 'Active':
      return 'success';
    case 'Failed':
    case 'PartiallyFailed':
    case 'FailedValidation':
    case 'WaitingForPluginOperationsPartiallyFailed':
    case 'FinalizingPartiallyFailed':
      return 'error';
    case 'InProgress':
    case 'New':
    case 'Deleting':
    case 'Paused':
    case 'Queued':
    case 'ReadyToStart':
    case 'WaitingForPluginOperations':
    case 'Finalizing':
      return 'warning';
    default:
      return '';
  }
}

/** Alias for Restore phases (same Velero phase vocabulary as Backup). */
export const getRestoreStatusColor = getBackupStatusColor;

/** StatusLabel tone for BSL / VSL / BackupRepository phases. */
export function getStorageStatusColor(phase: string): string {
  switch (phase) {
    case 'Available':
    case 'Ready':
    case 'Completed':
      return 'success';
    case 'Unavailable':
    case 'Failed':
    case 'NotReady':
      return 'error';
    case 'New':
    case 'InProgress':
      return 'warning';
    case 'Unknown':
    default:
      return getBackupStatusColor(phase);
  }
}

/** StatusLabel tone for Schedule statusDisplay (Active / New / Paused / FailedValidation). */
export function getScheduleStatusColor(status: string): string {
  switch (status) {
    case 'Active':
    case 'Enabled':
      return 'success';
    case 'FailedValidation':
      return 'error';
    case 'Paused':
    case 'New':
      return 'warning';
    case 'Unknown':
    default:
      return getBackupStatusColor(status);
  }
}
