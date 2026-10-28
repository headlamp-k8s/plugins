/** Route names registered with Headlamp for the Velero plugin. */
export const veleroRouteNames = {
  schedulesList: 'velero-schedules-list',
  scheduleDetail: 'velero-schedule-detail',
  backupsList: 'velero-backups-list',
  backupDetail: 'velero-backup-detail',
  restoresList: 'velero-restores-list',
  restoreDetail: 'velero-restore-detail',
  bslList: 'velero-bsl-list',
  bslDetail: 'velero-bsl-detail',
  vslList: 'velero-vsl-list',
  vslDetail: 'velero-vsl-detail',
  backupRepositoriesList: 'velero-backuprepositories-list',
  backupRepositoryDetail: 'velero-backuprepository-detail',
} as const;

/** URL paths for Velero Phase 2/3 cluster-wide views. */
export const veleroRoutePaths = {
  schedulesList: '/velero/schedules',
  scheduleDetail: '/velero/schedules/:namespace/:name',
  backupsList: '/velero/backups',
  backupDetail: '/velero/backups/:namespace/:name',
  restoresList: '/velero/restores',
  restoreDetail: '/velero/restores/:namespace/:name',
  bslList: '/velero/backupstoragelocations',
  bslDetail: '/velero/backupstoragelocations/:namespace/:name',
  vslList: '/velero/volumesnapshotlocations',
  vslDetail: '/velero/volumesnapshotlocations/:namespace/:name',
  backupRepositoriesList: '/velero/backuprepositories',
  backupRepositoryDetail: '/velero/backuprepositories/:namespace/:name',
} as const;
