import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroBackup } from '../../resources/backup';
import { VeleroStatusBadge } from '../common/VeleroStatusBadge';
import { CreateBackupDialog } from './CreateBackupDialog';
import { CreateRestoreDialog } from '../restore/CreateRestoreDialog';

export const VeleroBackupList: React.FC = () => {
  const [backups, error] = VeleroBackup.useList();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupName, setSelectedBackupName] = useState('');

  const handleOpenRestore = (backupName: string) => {
    setSelectedBackupName(backupName);
    setRestoreDialogOpen(true);
  };

  return (
    <SectionBox title="Velero Backups">
      <Stack direction="row" justifyContent="flex-end" marginBottom={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Backup
        </Button>
      </Stack>

      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (backup: VeleroBackup) => (
              <Link routeName="velero-backup-detail" params={{ namespace: backup.metadata.namespace, name: backup.metadata.name }}>
                {backup.metadata.name}
              </Link>
            ),
          },
          {
            label: 'Namespace',
            getter: (backup: VeleroBackup) => backup.metadata.namespace,
          },
          {
            label: 'Status',
            getter: (backup: VeleroBackup) => <VeleroStatusBadge status={backup.phase} />,
          },
          {
            label: 'Storage Location',
            getter: (backup: VeleroBackup) => backup.storageLocation,
          },
          {
            label: 'Errors / Warnings',
            getter: (backup: VeleroBackup) => `${backup.errorsCount} / ${backup.warningsCount}`,
          },
          {
            label: 'Age',
            getter: (backup: VeleroBackup) => backup.getAge(),
          },
          {
            label: 'Actions',
            getter: (backup: VeleroBackup) => (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleOpenRestore(backup.metadata.name)}
              >
                Restore
              </Button>
            ),
          },
        ]}
        data={backups}
        errorMessage={error ? error.toString() : undefined}
      />

      <CreateBackupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <CreateRestoreDialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        defaultBackupName={selectedBackupName}
      />
    </SectionBox>
  );
};

export default VeleroBackupList;
