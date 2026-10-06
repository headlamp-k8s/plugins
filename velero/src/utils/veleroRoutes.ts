/** Route names registered with Headlamp for the Velero plugin. */
export const veleroRouteNames = {
  schedulesList: 'velero-schedules-list',
  scheduleDetail: 'velero-schedule-detail',
  backupsList: 'velero-backups-list',
  backupDetail: 'velero-backup-detail',
  restoresList: 'velero-restores-list',
  restoreDetail: 'velero-restore-detail',
} as const;

/** URL paths for Velero Phase 2 cluster-wide views. */
export const veleroRoutePaths = {
  schedulesList: '/velero/schedules',
  scheduleDetail: '/velero/schedules/:namespace/:name',
  backupsList: '/velero/backups',
  backupDetail: '/velero/backups/:namespace/:name',
  restoresList: '/velero/restores',
  restoreDetail: '/velero/restores/:namespace/:name',
} as const;
