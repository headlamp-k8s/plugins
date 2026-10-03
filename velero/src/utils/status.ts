/** Maps a Velero Backup phase to a Headlamp StatusLabel tone. */
export function getBackupStatusColor(phase: string): string {
  switch (phase) {
    case 'Completed':
      return 'success';
    case 'Failed':
    case 'PartiallyFailed':
    case 'FailedValidation':
      return 'error';
    case 'InProgress':
    case 'New':
    case 'Deleting':
      return 'warning';
    default:
      return '';
  }
}
