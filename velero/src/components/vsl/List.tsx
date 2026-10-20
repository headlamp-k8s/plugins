import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { VeleroVolumeSnapshotLocation } from '../../resources/storage';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function VslListContent() {
  const veleroNamespace = useVeleroNamespace();
  const [locations, error] = VeleroVolumeSnapshotLocation.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Volume Snapshot Locations"
      data={locations}
      errorMessage={error?.message}
      enableRowActions={false}
      enableRowSelection={false}
      filterFunction={veleroListFilterFunction}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
      }}
      columns={[
        // Use built-in name/namespace/age so column layout matches BSL and other lists.
        'name',
        'namespace',
        {
          id: 'provider',
          label: 'Provider',
          getValue: (item: VeleroVolumeSnapshotLocation) => item.provider,
        },
        // No Status: Velero usually does not set status.phase on VSL.
        'age',
      ]}
    />
  );
}

/** Phase 3: VSL list (CSI / volume snapshot config). */
export default function VslList() {
  return (
    <VeleroInstallCheck>
      <VslListContent />
    </VeleroInstallCheck>
  );
}
