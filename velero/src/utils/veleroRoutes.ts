/** Route names registered with Headlamp for the Velero plugin. */
export const veleroRouteNames = {
  schedulesList: 'velero-schedules-list',
  scheduleDetail: 'velero-schedule-detail',
  backupsList: 'velero-backups-list',
  backupDetail: 'velero-backup-detail',
  coverageGaps: 'velero-coverage-gaps',
} as const;

/** URL paths for Velero Phase 2 cluster-wide views. */
export const veleroRoutePaths = {
  schedulesList: '/velero/schedules',
  scheduleDetail: '/velero/schedules/:namespace/:name',
  backupsList: '/velero/backups',
  backupDetail: '/velero/backups/:namespace/:name',
  coverageGaps: '/velero/coverage-gaps',
} as const;
