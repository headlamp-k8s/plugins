import { registerRoute,registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { BackupList } from './components/Backups/BackupList';

// Register the main Velero sidebar group
registerSidebarEntry({
  parent: null,
  name: 'velero',
  label: 'Velero',
  icon: 'mdi:backup-restore',
});

// Register the Backups route and its sidebar child entry
registerRoute({
  path: '/velero/backups',
  sidebar: 'velero-backups',
  name: 'velero-backups',
  exact: true,
  component: () => <BackupList />,
});

registerSidebarEntry({
  parent: 'velero',
  name: 'velero-backups',
  label: 'Backups',
  url: '/velero/backups',
});
