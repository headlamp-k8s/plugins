import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { VeleroRestore } from '../../resources/velero';
import { getRestoreStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function RestoreSourceCell({ restore }: { restore: VeleroRestore }) {
  if (restore.backupName) {
    return (
      <Link
        routeName={veleroRouteNames.backupDetail}
        params={{ namespace: restore.getNamespace(), name: restore.backupName }}
      >
        {restore.backupName}
      </Link>
    );
  }
  if (restore.scheduleName) {
    return (
      <Link
        routeName={veleroRouteNames.scheduleDetail}
        params={{ namespace: restore.getNamespace(), name: restore.scheduleName }}
      >
        {`Schedule: ${restore.scheduleName}`}
      </Link>
    );
  }
  return <>N/A</>;
}

function RestoreListContent() {
  const veleroNamespace = useVeleroNamespace();
  // Pin fetch to the configured Velero namespace (ResourceListView types omit `namespaces`).
  const [restores, error] = VeleroRestore.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Velero Restores"
      data={restores}
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
          id: 'backup-source',
          label: 'Backup source',
          getValue: (restore: VeleroRestore) => restore.sourceDisplay,
          render: (restore: VeleroRestore) => <RestoreSourceCell restore={restore} />,
        },
        {
          id: 'phase',
          label: 'Status',
          getValue: (restore: VeleroRestore) => restore.phase,
          render: (restore: VeleroRestore) => (
            <StatusLabel status={getRestoreStatusColor(restore.phase)}>{restore.phase}</StatusLabel>
          ),
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (restore: VeleroRestore) => restore.includedNamespacesDisplay,
        },
        {
          id: 'errors',
          label: 'Errors',
          getValue: (restore: VeleroRestore) => restore.errors,
        },
        {
          id: 'warnings',
          label: 'Warnings',
          getValue: (restore: VeleroRestore) => restore.warnings,
        },
        {
          id: 'started',
          label: 'Started',
          getValue: (restore: VeleroRestore) => restore.startTimestamp ?? '',
          render: (restore: VeleroRestore) =>
            restore.startTimestamp ? new Date(restore.startTimestamp).toLocaleString() : 'N/A',
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Restore list (Phase 2; columns inspired by reasonerjt prototype). */
export default function RestoreList() {
  return (
    <VeleroInstallCheck>
      <RestoreListContent />
    </VeleroInstallCheck>
  );
}
