import { DetailsGrid, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { VeleroVolumeSnapshotLocation } from '../../resources/storage';
import { getStorageStatusColor } from '../../utils/status';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function VslDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VeleroVolumeSnapshotLocation}
      name={name}
      namespace={namespace}
      withEvents
      noDefaultActions
      extraInfo={item => {
        if (!item) {
          return [];
        }
        const rows: { name: string; value: ReactNode }[] = [
          { name: 'Provider', value: item.provider },
          { name: 'Config', value: item.configDisplay },
        ];
        // Only show Status when Velero actually reported a phase.
        if (item.hasReportedPhase) {
          rows.unshift({
            name: 'Status',
            value: (
              <StatusLabel status={getStorageStatusColor(item.phase)}>{item.phase}</StatusLabel>
            ),
          });
        }
        return rows;
      }}
    />
  );
}

/** Phase 3: VSL detail. */
export default function VslDetail() {
  return (
    <VeleroInstallCheck>
      <VslDetailContent />
    </VeleroInstallCheck>
  );
}
