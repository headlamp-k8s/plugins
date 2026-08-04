import { DateLabel, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Backup } from '../resources/backup';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Lists all Velero Backups (velero.io/v1) in the cluster.
 *
 * ResourceListView does the fetching and the table rendering for us, we only
 * describe the columns we care about.
 */
export function BackupList() {
  return (
    <ResourceListView
      title="Velero Backups"
      resourceClass={Backup}
      columns={[
        'name',
        'namespace',
        {
          id: 'status',
          label: 'Status',
          getValue: backup => backup.phase ?? '',
          render: backup => <PhaseLabel phase={backup.phase} />,
        },
        {
          id: 'created',
          label: 'Created',
          getValue: backup => backup.metadata.creationTimestamp ?? '',
          render: backup =>
            backup.metadata.creationTimestamp ? (
              <DateLabel date={backup.metadata.creationTimestamp} format="mini" />
            ) : null,
        },
        {
          // Backups without a TTL never expire, so this can be empty.
          id: 'expiration',
          label: 'Expiration',
          getValue: backup => backup.expiration ?? '',
          render: backup =>
            backup.expiration ? <DateLabel date={backup.expiration} format="mini" /> : null,
        },
      ]}
    />
  );
}
