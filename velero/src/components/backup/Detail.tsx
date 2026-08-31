import React from 'react';
import { useParams } from 'react-router-dom';
import { MainInfoSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroBackup } from '../../resources/backup';
import { VeleroStatusBadge } from '../common/VeleroStatusBadge';

export const VeleroBackupDetail: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [backup, error] = VeleroBackup.useGet(name, namespace);

  if (!backup) {
    return <div>Loading...</div>;
  }

  return (
    <MainInfoSection
      resource={backup}
      title={`Backup: ${backup.metadata.name}`}
      extraInfo={[
        {
          name: 'Status',
          value: <VeleroStatusBadge status={backup.phase} />,
        },
        {
          name: 'Storage Location',
          value: backup.storageLocation,
        },
        {
          name: 'TTL',
          value: backup.ttl,
        },
        {
          name: 'Expiration',
          value: backup.expiration || 'N/A',
        },
        {
          name: 'Included Namespaces',
          value: backup.includedNamespaces.join(', '),
        },
        {
          name: 'Errors / Warnings',
          value: `${backup.errorsCount} errors, ${backup.warningsCount} warnings`,
        },
      ]}
    />
  );
};

export default VeleroBackupDetail;
