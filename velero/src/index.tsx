// Velero plugin for Headlamp - LFX Mentorship 2026 Term 3

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { BackupDetail } from './components/BackupDetail';
import { BackupList } from './components/BackupList';
import { BackupStorageLocationList } from './components/BackupStorageLocationList';
import { RestoreDetail } from './components/RestoreDetail';
import { RestoreList } from './components/RestoreList';
import { ScheduleDetail } from './components/ScheduleDetail';
import { ScheduleList } from './components/ScheduleList';
import { VolumeSnapshotLocationList } from './components/VolumeSnapshotLocationList';

// Top level Velero entry in the sidebar. It opens the backups list.
registerSidebarEntry({
  parent: null,
  name: 'velero',
  label: 'Velero',
  icon: 'mdi:backup-restore',
  url: '/velero/backups',
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-backups',
  label: 'Backups',
  url: '/velero/backups',
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-restores',
  label: 'Restores',
  url: '/velero/restores',
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-schedules',
  label: 'Schedules',
  url: '/velero/schedules',
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-storage-locations',
  label: 'Storage Locations',
  url: '/velero/storage-locations',
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-snapshot-locations',
  label: 'Snapshot Locations',
  url: '/velero/snapshot-locations',
});

// Backups
registerRoute({
  path: '/velero/backups',
  sidebar: 'velero-backups',
  name: 'veleroBackups',
  exact: true,
  component: () => <BackupList />,
});

registerRoute({
  path: '/velero/backups/:namespace/:name',
  sidebar: 'velero-backups',
  name: 'veleroBackupDetail',
  exact: true,
  component: () => <BackupDetail />,
});

// Restores
registerRoute({
  path: '/velero/restores',
  sidebar: 'velero-restores',
  name: 'veleroRestores',
  exact: true,
  component: () => <RestoreList />,
});

registerRoute({
  path: '/velero/restores/:namespace/:name',
  sidebar: 'velero-restores',
  name: 'veleroRestoreDetail',
  exact: true,
  component: () => <RestoreDetail />,
});

// Schedules
registerRoute({
  path: '/velero/schedules',
  sidebar: 'velero-schedules',
  name: 'veleroSchedules',
  exact: true,
  component: () => <ScheduleList />,
});

registerRoute({
  path: '/velero/schedules/:namespace/:name',
  sidebar: 'velero-schedules',
  name: 'veleroScheduleDetail',
  exact: true,
  component: () => <ScheduleDetail />,
});

// Storage and snapshot locations only have list views for now.
registerRoute({
  path: '/velero/storage-locations',
  sidebar: 'velero-storage-locations',
  name: 'veleroBackupStorageLocations',
  exact: true,
  component: () => <BackupStorageLocationList />,
});

registerRoute({
  path: '/velero/snapshot-locations',
  sidebar: 'velero-snapshot-locations',
  name: 'veleroVolumeSnapshotLocations',
  exact: true,
  component: () => <VolumeSnapshotLocationList />,
});
