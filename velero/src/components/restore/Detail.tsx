import React from 'react';
import { useParams } from 'react-router-dom';
import { MainInfoSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroRestore } from '../../resources/restore';
import { VeleroStatusBadge } from '../common/VeleroStatusBadge';

export const VeleroRestoreDetail: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [restore, error] = VeleroRestore.useGet(name, namespace);

  if (!restore) {
    return <div>Loading...</div>;
  }

  return (
    <MainInfoSection
      resource={restore}
      title={`Restore: ${restore.metadata.name}`}
      extraInfo={[
        {
          name: 'Source Backup',
          value: restore.backupName,
        },
        {
          name: 'Status',
          value: <VeleroStatusBadge status={restore.phase} />,
        },
        {
          name: 'Errors / Warnings',
          value: `${restore.errorsCount} errors, ${restore.warningsCount} warnings`,
        },
      ]}
    />
  );
};

export default VeleroRestoreDetail;
