import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import VeleroOverview from './components/overview/VeleroOverview';
import VeleroBackupList from './components/backup/List';
import VeleroBackupDetail from './components/backup/Detail';
import VeleroRestoreList from './components/restore/List';
import VeleroRestoreDetail from './components/restore/Detail';
import VeleroScheduleList from './components/schedule/List';
import VeleroScheduleDetail from './components/schedule/Detail';
import VeleroStorageLocationsList from './components/storage/BSLList';
import { veleroRouteNames, veleroRoutePaths } from './utils/veleroRoutes';

// Sidebar entries registration
registerSidebarEntry({
  parent: null,
  name: 'velero',
  label: 'Velero',
  icon: 'mdi:cloud-upload-outline',
  url: veleroRoutePaths.overview,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-overview',
  label: 'Overview',
  url: veleroRoutePaths.overview,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-backups',
  label: 'Backups',
  url: veleroRoutePaths.backupsList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-restores',
  label: 'Restores',
  url: veleroRoutePaths.restoresList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-schedules',
  label: 'Schedules',
  url: veleroRoutePaths.schedulesList,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-storage-locations',
  label: 'Storage Locations',
  url: veleroRoutePaths.storageLocationsList,
});

// Route registrations
registerRoute({
  path: veleroRoutePaths.overview,
  sidebar: 'velero-overview',
  name: veleroRouteNames.overview,
  exact: true,
  component: () => <VeleroOverview />,
});

registerRoute({
  path: veleroRoutePaths.backupsList,
  sidebar: 'velero-backups',
  name: veleroRouteNames.backupsList,
  exact: true,
  component: () => <VeleroBackupList />,
});

registerRoute({
  path: veleroRoutePaths.backupDetail,
  sidebar: 'velero-backups',
  name: veleroRouteNames.backupDetail,
  exact: true,
  component: () => <VeleroBackupDetail />,
});

registerRoute({
  path: veleroRoutePaths.restoresList,
  sidebar: 'velero-restores',
  name: veleroRouteNames.restoresList,
  exact: true,
  component: () => <VeleroRestoreList />,
});

registerRoute({
  path: veleroRoutePaths.restoreDetail,
  sidebar: 'velero-restores',
  name: veleroRouteNames.restoreDetail,
  exact: true,
  component: () => <VeleroRestoreDetail />,
});

registerRoute({
  path: veleroRoutePaths.schedulesList,
  sidebar: 'velero-schedules',
  name: veleroRouteNames.schedulesList,
  exact: true,
  component: () => <VeleroScheduleList />,
});

registerRoute({
  path: veleroRoutePaths.scheduleDetail,
  sidebar: 'velero-schedules',
  name: veleroRouteNames.scheduleDetail,
  exact: true,
  component: () => <VeleroScheduleDetail />,
});

registerRoute({
  path: veleroRoutePaths.storageLocationsList,
  sidebar: 'velero-storage-locations',
  name: veleroRouteNames.storageLocationsList,
  exact: true,
  component: () => <VeleroStorageLocationsList />,
});
