import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { VeleroBackup } from '../../resources/velero';
import { getBackupStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BackupListContent() {
  const veleroNamespace = useVeleroNamespace();
  // Pin fetch to the configured Velero namespace (ResourceListView types omit `namespaces`).
  const [backups, error] = VeleroBackup.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Velero Backups"
      data={backups}
      errorMessage={error?.message}
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
      }}
      columns={[
        'name',
        'namespace',
        {
          id: 'phase',
          label: 'Status',
          getValue: (backup: VeleroBackup) => backup.phase,
          render: (backup: VeleroBackup) => (
            <StatusLabel status={getBackupStatusColor(backup.phase)}>{backup.phase}</StatusLabel>
          ),
        },
        {
          id: 'triggered-by',
          label: 'Triggered by',
          getValue: (backup: VeleroBackup) => backup.triggeredByDisplay,
          render: (backup: VeleroBackup) => {
            if (!backup.scheduleName) {
              return 'Manual';
            }
            return (
              <Link
                routeName={veleroRouteNames.scheduleDetail}
                params={{ namespace: backup.getNamespace(), name: backup.scheduleName }}
              >
                {backup.scheduleName}
              </Link>
            );
          },
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (backup: VeleroBackup) => backup.includedNamespacesDisplay,
        },
        {
          id: 'started',
          label: 'Started',
          getValue: (backup: VeleroBackup) => backup.startTimestamp ?? '',
          render: (backup: VeleroBackup) =>
            backup.startTimestamp ? new Date(backup.startTimestamp).toLocaleString() : 'N/A',
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Backup list (Phase 2). */
export default function BackupList() {
  return (
    <VeleroInstallCheck>
      <BackupListContent />
    </VeleroInstallCheck>
  );
}
