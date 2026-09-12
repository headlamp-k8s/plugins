import React from 'react';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroRestore } from '../../resources/restore';
import { VeleroStatusBadge } from '../common/VeleroStatusBadge';

export const VeleroRestoreList: React.FC = () => {
  const [restores, error] = VeleroRestore.useList();

  return (
    <SectionBox title="Velero Restores">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (restore: VeleroRestore) => restore.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (restore: VeleroRestore) => restore.metadata.namespace,
          },
          {
            label: 'Source Backup',
            getter: (restore: VeleroRestore) => restore.backupName,
          },
          {
            label: 'Status',
            getter: (restore: VeleroRestore) => <VeleroStatusBadge status={restore.phase} />,
          },
          {
            label: 'Errors / Warnings',
            getter: (restore: VeleroRestore) => `${restore.errorsCount} / ${restore.warningsCount}`,
          },
          {
            label: 'Age',
            getter: (restore: VeleroRestore) => restore.getAge(),
          },
        ]}
        data={restores}
        errorMessage={error ? error.toString() : undefined}
      />
    </SectionBox>
  );
};

export default VeleroRestoreList;
