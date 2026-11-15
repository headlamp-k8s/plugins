import { DetailsGrid, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VeleroBackupRepository } from '../../resources/storage';
import { getStorageStatusColor } from '../../utils/status';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BackupRepositoryDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VeleroBackupRepository}
      name={name}
      namespace={namespace}
      withEvents
      noDefaultActions
      extraInfo={item => {
        if (!item) {
          return [];
        }
        return [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getStorageStatusColor(item.phase)}>{item.phase}</StatusLabel>
            ),
          },
          { name: 'Repository type', value: item.repositoryType },
          { name: 'Volume namespace', value: item.volumeNamespace },
          { name: 'Storage location', value: item.backupStorageLocation },
          { name: 'Message', value: item.statusMessage || 'N/A' },
        ];
      }}
    />
  );
}

/** Phase 3: BackupRepository detail. */
export default function BackupRepositoryDetail() {
  return (
    <VeleroInstallCheck>
      <BackupRepositoryDetailContent />
    </VeleroInstallCheck>
  );
}
