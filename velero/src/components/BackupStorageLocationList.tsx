import { DateLabel, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { BackupStorageLocation } from '../resources/backupStorageLocation';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Lists the BackupStorageLocations (velero.io/v1) Velero writes backups to.
 *
 * The name is plain text for now because there is no detail view for storage
 * locations yet.
 */
export function BackupStorageLocationList() {
  return (
    <ResourceListView
      title="Backup Storage Locations"
      resourceClass={BackupStorageLocation}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: location => location.metadata.name ?? '',
        },
        'namespace',
        {
          id: 'provider',
          label: 'Provider',
          getValue: location => location.spec.provider ?? '-',
        },
        {
          id: 'bucket',
          label: 'Bucket/Prefix',
          getValue: location => location.bucketPath,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: location => location.phase ?? '',
          render: location => <PhaseLabel phase={location.phase} />,
        },
        {
          id: 'lastSynced',
          label: 'Last Synced',
          getValue: location => location.status.lastSyncedTime ?? '',
          render: location =>
            location.status.lastSyncedTime ? (
              <DateLabel date={location.status.lastSyncedTime} format="mini" />
            ) : null,
        },
      ]}
    />
  );
}
