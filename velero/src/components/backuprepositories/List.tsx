import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { VeleroBackupRepository } from '../../resources/storage';
import { getStorageStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BackupRepositoryListContent() {
  const veleroNamespace = useVeleroNamespace();
  const [repos, error] = VeleroBackupRepository.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Backup Repositories"
      data={repos}
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
          id: 'type',
          label: 'Type',
          getValue: (item: VeleroBackupRepository) => item.repositoryType,
        },
        {
          id: 'volumeNamespace',
          label: 'Volume namespace',
          getValue: (item: VeleroBackupRepository) => item.volumeNamespace,
        },
        {
          id: 'bsl',
          label: 'Storage location',
          getValue: (item: VeleroBackupRepository) => item.backupStorageLocation,
          render: (item: VeleroBackupRepository) => (
            <Link
              routeName={veleroRouteNames.bslDetail}
              params={{
                namespace: item.getNamespace(),
                name: item.backupStorageLocation,
              }}
              activeCluster={item.cluster}
            >
              {item.backupStorageLocation}
            </Link>
          ),
        },
        {
          id: 'phase',
          label: 'Status',
          getValue: (item: VeleroBackupRepository) => item.phase,
          render: (item: VeleroBackupRepository) => (
            <StatusLabel status={getStorageStatusColor(item.phase)}>{item.phase}</StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}

/**
 * Phase 3: BackupRepository list (Daniel priority for CSI / datamover repos).
 * Empty or error when the CRD / repos are not present on the cluster.
 */
export default function BackupRepositoryList() {
  return (
    <VeleroInstallCheck>
      <BackupRepositoryListContent />
    </VeleroInstallCheck>
  );
}
