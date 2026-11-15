import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { VeleroBackupStorageLocation } from '../../resources/storage';
import { getStorageStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BslListContent() {
  const veleroNamespace = useVeleroNamespace();
  const [locations, error] = VeleroBackupStorageLocation.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Backup Storage Locations"
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
        'name',
        'namespace',
        {
          id: 'provider',
          label: 'Provider',
          getValue: (item: VeleroBackupStorageLocation) => item.provider,
        },
        {
          id: 'bucket',
          label: 'Bucket',
          getValue: (item: VeleroBackupStorageLocation) => item.bucket,
          render: (item: VeleroBackupStorageLocation) => (
            <Link
              routeName={veleroRouteNames.bslDetail}
              params={{ namespace: item.getNamespace(), name: item.getName() }}
              activeCluster={item.cluster}
            >
              {item.bucket}
            </Link>
          ),
        },
        {
          id: 'accessMode',
          label: 'Access mode',
          getValue: (item: VeleroBackupStorageLocation) => item.accessMode,
        },
        {
          id: 'phase',
          label: 'Status',
          getValue: (item: VeleroBackupStorageLocation) => item.phase,
          render: (item: VeleroBackupStorageLocation) => (
            <StatusLabel status={getStorageStatusColor(item.phase)}>{item.phase}</StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}

/** Phase 3: BSL list (where backups are stored). */
export default function BslList() {
  return (
    <VeleroInstallCheck>
      <BslListContent />
    </VeleroInstallCheck>
  );
}
