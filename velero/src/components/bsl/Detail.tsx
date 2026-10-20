import { DetailsGrid, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VeleroBackupStorageLocation } from '../../resources/storage';
import { getStorageStatusColor } from '../../utils/status';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BslDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VeleroBackupStorageLocation}
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
          { name: 'Provider', value: item.provider },
          { name: 'Bucket', value: item.bucket },
          { name: 'Prefix', value: item.prefix || 'N/A' },
          { name: 'Access mode', value: item.accessMode },
          {
            name: 'Last validated',
            value: item.lastValidationTime
              ? new Date(item.lastValidationTime).toLocaleString()
              : 'N/A',
          },
          { name: 'Message', value: item.statusMessage || 'N/A' },
        ];
      }}
    />
  );
}

/** Phase 3: BSL detail. */
export default function BslDetail() {
  return (
    <VeleroInstallCheck>
      <BslDetailContent />
    </VeleroInstallCheck>
  );
}
