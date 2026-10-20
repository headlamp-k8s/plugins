import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import type { ReactElement } from 'react';
import {
  VeleroDataDownload,
  VeleroDataUpload,
  VeleroPodVolumeBackup,
  VeleroPodVolumeRestore,
} from '../../resources/datamovement';
import { formatByteProgress } from '../../utils/bytes';
import { getBackupStatusColor } from '../../utils/status';

/** Renders PVB + CSI DataUpload tables for a Backup (hidden when empty / CRD missing). */
export function BackupDataMovementSections({
  pvbs,
  uploads,
}: {
  pvbs: VeleroPodVolumeBackup[] | null;
  uploads: VeleroDataUpload[] | null;
}): ReactElement[] {
  const sections: ReactElement[] = [];

  if (pvbs && pvbs.length > 0) {
    sections.push(
      <SectionBox title="Pod Volume Backups (Data Movement)" key="backup-pvbs">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          File-system / uploader volume backups linked to this Backup.
        </Typography>
        <SimpleTable
          columns={[
            { label: 'Pod', getter: (row: VeleroPodVolumeBackup) => row.podName },
            { label: 'Volume', getter: (row: VeleroPodVolumeBackup) => row.volume },
            {
              label: 'Phase',
              getter: (row: VeleroPodVolumeBackup) => (
                <StatusLabel status={getBackupStatusColor(row.phase)}>{row.phase}</StatusLabel>
              ),
            },
            {
              label: 'Progress',
              getter: (row: VeleroPodVolumeBackup) =>
                formatByteProgress(row.progress?.bytesDone, row.progress?.totalBytes),
            },
            { label: 'Message', getter: (row: VeleroPodVolumeBackup) => row.message || 'N/A' },
          ]}
          data={pvbs}
        />
      </SectionBox>
    );
  }

  if (uploads && uploads.length > 0) {
    sections.push(
      <SectionBox title="CSI Data Uploads (Data Movement)" key="backup-uploads">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          CSI datamover uploads for this Backup.
        </Typography>
        <SimpleTable
          columns={[
            { label: 'Source Volume', getter: (row: VeleroDataUpload) => row.sourceVolume },
            { label: 'Snapshot Type', getter: (row: VeleroDataUpload) => row.snapshotType },
            {
              label: 'Storage Location',
              getter: (row: VeleroDataUpload) => row.backupStorageLocation,
            },
            {
              label: 'Phase',
              getter: (row: VeleroDataUpload) => (
                <StatusLabel status={getBackupStatusColor(row.phase)}>{row.phase}</StatusLabel>
              ),
            },
            {
              label: 'Progress',
              getter: (row: VeleroDataUpload) =>
                formatByteProgress(row.progress?.bytesDone, row.progress?.totalBytes),
            },
            { label: 'Message', getter: (row: VeleroDataUpload) => row.message || 'N/A' },
          ]}
          data={uploads}
        />
      </SectionBox>
    );
  }

  return sections;
}

/** Renders PVR + CSI DataDownload tables for a Restore. */
export function RestoreDataMovementSections({
  pvrs,
  downloads,
}: {
  pvrs: VeleroPodVolumeRestore[] | null;
  downloads: VeleroDataDownload[] | null;
}): ReactElement[] {
  const sections: ReactElement[] = [];

  if (pvrs && pvrs.length > 0) {
    sections.push(
      <SectionBox title="Pod Volume Restores (Data Movement)" key="restore-pvrs">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          File-system / uploader volume restores linked to this Restore.
        </Typography>
        <SimpleTable
          columns={[
            { label: 'Pod', getter: (row: VeleroPodVolumeRestore) => row.podName },
            { label: 'Volume', getter: (row: VeleroPodVolumeRestore) => row.volume },
            {
              label: 'Phase',
              getter: (row: VeleroPodVolumeRestore) => (
                <StatusLabel status={getBackupStatusColor(row.phase)}>{row.phase}</StatusLabel>
              ),
            },
            {
              label: 'Progress',
              getter: (row: VeleroPodVolumeRestore) =>
                formatByteProgress(row.progress?.bytesDone, row.progress?.totalBytes),
            },
            { label: 'Message', getter: (row: VeleroPodVolumeRestore) => row.message || 'N/A' },
          ]}
          data={pvrs}
        />
      </SectionBox>
    );
  }

  if (downloads && downloads.length > 0) {
    sections.push(
      <SectionBox title="CSI Data Downloads (Data Movement)" key="restore-downloads">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          CSI datamover downloads for this Restore.
        </Typography>
        <SimpleTable
          columns={[
            { label: 'Target Volume', getter: (row: VeleroDataDownload) => row.targetVolume },
            {
              label: 'Storage Location',
              getter: (row: VeleroDataDownload) => row.backupStorageLocation,
            },
            {
              label: 'Phase',
              getter: (row: VeleroDataDownload) => (
                <StatusLabel status={getBackupStatusColor(row.phase)}>{row.phase}</StatusLabel>
              ),
            },
            {
              label: 'Progress',
              getter: (row: VeleroDataDownload) =>
                formatByteProgress(row.progress?.bytesDone, row.progress?.totalBytes),
            },
            { label: 'Message', getter: (row: VeleroDataDownload) => row.message || 'N/A' },
          ]}
          data={downloads}
        />
      </SectionBox>
    );
  }

  return sections;
}
