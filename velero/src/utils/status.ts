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

/**
 * StatusLabel tone for datamover phases.
 *
 * PodVolumeBackup, PodVolumeRestore, DataUpload and DataDownload share one
 * phase vocabulary of their own — New, Accepted, Prepared, InProgress,
 * Canceling, Canceled, Completed, Failed — which is not the Backup/Restore
 * one, so they need their own mapping rather than widening that function.
 */
export function getDataMovementStatusColor(phase: string): string {
  switch (phase) {
    case 'Completed':
      return 'success';
    // Canceled is terminal and the data did not move, so it is surfaced like
    // a failure rather than left untoned.
    case 'Failed':
    case 'Canceled':
      return 'error';
    case 'New':
    case 'Accepted':
    case 'Prepared':
    case 'InProgress':
    case 'Canceling':
      return 'warning';
    default:
      return '';
  }
}

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
