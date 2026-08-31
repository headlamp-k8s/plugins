import React from 'react';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroBackupStorageLocation } from '../../resources/backupStorageLocation';
import { VeleroVolumeSnapshotLocation } from '../../resources/volumeSnapshotLocation';
import { VeleroStatusBadge } from '../common/VeleroStatusBadge';

export const VeleroStorageLocationsList: React.FC = () => {
  const [bsls, bslError] = VeleroBackupStorageLocation.useList();
  const [vsls, vslError] = VeleroVolumeSnapshotLocation.useList();

  return (
    <>
      <SectionBox title="Backup Storage Locations (BSL)">
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (bsl: VeleroBackupStorageLocation) => bsl.metadata.name,
            },
            {
              label: 'Provider',
              getter: (bsl: VeleroBackupStorageLocation) => bsl.provider,
            },
            {
              label: 'Bucket / Prefix',
              getter: (bsl: VeleroBackupStorageLocation) => bsl.bucket,
            },
            {
              label: 'Access Mode',
              getter: (bsl: VeleroBackupStorageLocation) => bsl.accessMode,
            },
            {
              label: 'Default',
              getter: (bsl: VeleroBackupStorageLocation) => (bsl.isDefault ? 'Yes' : 'No'),
            },
            {
              label: 'Phase',
              getter: (bsl: VeleroBackupStorageLocation) => <VeleroStatusBadge status={bsl.phase} />,
            },
          ]}
          data={bsls}
          errorMessage={bslError ? bslError.toString() : undefined}
        />
      </SectionBox>

      <SectionBox title="Volume Snapshot Locations (VSL)" style={{ marginTop: '24px' }}>
        <SimpleTable
          columns={[
            {
              label: 'Name',
              getter: (vsl: VeleroVolumeSnapshotLocation) => vsl.metadata.name,
            },
            {
              label: 'Provider',
              getter: (vsl: VeleroVolumeSnapshotLocation) => vsl.provider,
            },
            {
              label: 'Phase',
              getter: (vsl: VeleroVolumeSnapshotLocation) => <VeleroStatusBadge status={vsl.phase} />,
            },
          ]}
          data={vsls}
          errorMessage={vslError ? vslError.toString() : undefined}
        />
      </SectionBox>
    </>
  );
};

export default VeleroStorageLocationsList;
