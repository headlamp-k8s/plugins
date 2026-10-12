import React, { useState } from 'react';
import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroBackup } from '../../resources/backup';
import { VeleroRestore } from '../../resources/restore';
import { VeleroSchedule } from '../../resources/schedule';
import { VeleroBackupStorageLocation } from '../../resources/backupStorageLocation';
import { CreateBackupDialog } from '../backup/CreateBackupDialog';
import { CreateRestoreDialog } from '../restore/CreateRestoreDialog';

export const VeleroOverview: React.FC = () => {
  const [backups] = VeleroBackup.useList();
  const [restores] = VeleroRestore.useList();
  const [schedules] = VeleroSchedule.useList();
  const [bsls] = VeleroBackupStorageLocation.useList();

  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [createRestoreOpen, setCreateRestoreOpen] = useState(false);

  const totalBackups = backups?.length || 0;
  const completedBackups = backups?.filter((b) => (b.phase || '').toLowerCase() === 'completed').length || 0;
  const failedBackups = backups?.filter((b) => (b.phase || '').toLowerCase() === 'failed').length || 0;
  const totalSchedules = schedules?.length || 0;
  const activeBSLs = bsls?.filter((bsl) => (bsl.phase || '').toLowerCase() === 'available').length || 0;

  return (
    <SectionBox title="Velero Backup Management Overview">
      <Stack direction="row" spacing={2} marginBottom={3} justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={() => setCreateBackupOpen(true)}>
          Create Backup
        </Button>
        <Button variant="outlined" color="primary" onClick={() => setCreateRestoreOpen(true)}>
          Trigger Restore
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Backups
              </Typography>
              <Typography variant="h4">{totalBackups}</Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                {completedBackups} Completed, {failedBackups} Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Restores
              </Typography>
              <Typography variant="h4">{restores?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                Executed restores
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Schedules
              </Typography>
              <Typography variant="h4">{totalSchedules}</Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                Recurring backup jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Storage Locations
              </Typography>
              <Typography variant="h4">{bsls?.length || 0}</Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                {activeBSLs} Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CreateBackupDialog open={createBackupOpen} onClose={() => setCreateBackupOpen(false)} />
      <CreateRestoreDialog open={createRestoreOpen} onClose={() => setCreateRestoreOpen(false)} />
    </SectionBox>
  );
};

export default VeleroOverview;
