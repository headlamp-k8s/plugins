import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { VolumeSnapshotLocation } from '../resources/volumeSnapshotLocation';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Lists the VolumeSnapshotLocations (velero.io/v1) used for volume snapshots.
 */
export function VolumeSnapshotLocationList() {
  return (
    <ResourceListView
      title="Volume Snapshot Locations"
      resourceClass={VolumeSnapshotLocation}
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
          id: 'status',
          label: 'Status',
          getValue: location => location.phase ?? '',
          render: location => <PhaseLabel phase={location.phase} />,
        },
      ]}
    />
  );
}
