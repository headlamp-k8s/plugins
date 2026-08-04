import { DateLabel, Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Restore } from '../resources/restore';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Lists all Velero Restores (velero.io/v1). The backup a restore came from is
 * linked so you can jump straight to it.
 */
export function RestoreList() {
  return (
    <ResourceListView
      title="Velero Restores"
      resourceClass={Restore}
      columns={[
        'name',
        'namespace',
        {
          id: 'backupName',
          label: 'Backup Name',
          getValue: restore => restore.backupName ?? '',
          render: restore =>
            restore.backupName ? (
              <Link
                routeName="veleroBackupDetail"
                params={{ namespace: restore.metadata.namespace, name: restore.backupName }}
              >
                {restore.backupName}
              </Link>
            ) : (
              '-'
            ),
        },
        {
          id: 'status',
          label: 'Status',
          getValue: restore => restore.phase ?? '',
          render: restore => <PhaseLabel phase={restore.phase} />,
        },
        {
          id: 'created',
          label: 'Created',
          getValue: restore => restore.metadata.creationTimestamp ?? '',
          render: restore =>
            restore.metadata.creationTimestamp ? (
              <DateLabel date={restore.metadata.creationTimestamp} format="mini" />
            ) : null,
        },
      ]}
    />
  );
}
