export const veleroRoutePaths = {
  overview: '/velero',
  backupsList: '/velero/backups',
  backupDetail: '/velero/backups/:namespace/:name',
  restoresList: '/velero/restores',
  restoreDetail: '/velero/restores/:namespace/:name',
  schedulesList: '/velero/schedules',
  scheduleDetail: '/velero/schedules/:namespace/:name',
  storageLocationsList: '/velero/storage-locations',
  storageLocationDetail: '/velero/storage-locations/:namespace/:name',
};

export const veleroRouteNames = {
  overview: 'velero-overview',
  backupsList: 'velero-backups-list',
  backupDetail: 'velero-backup-detail',
  restoresList: 'velero-restores-list',
  restoreDetail: 'velero-restore-detail',
  schedulesList: 'velero-schedules-list',
  scheduleDetail: 'velero-schedule-detail',
  storageLocationsList: 'velero-storage-locations-list',
  storageLocationDetail: 'velero-storage-location-detail',
};
