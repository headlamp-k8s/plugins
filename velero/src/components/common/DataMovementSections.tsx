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
import { getDataMovementStatusColor } from '../../utils/status';

type ErrorWithStatus = Error & { status?: number };

/**
 * True when the list failed because the CRD is not installed (optional Phase 3).
 * Prefer structured HTTP status: only 404 means missing CRD. Other statuses
 * (e.g. 403) must surface as real errors — never match bare "404" in message
 * text (SA names like `viewer-404` would false-positive).
 */
export function isMissingCrdError(error: Error | null | undefined): boolean {
  if (!error) {
    return false;
  }
  const status = (error as ErrorWithStatus).status;
  if (typeof status === 'number') {
    return status === 404;
  }
  if (!error.message) {
    return false;
  }
  const msg = error.message.toLowerCase();
  // Message fallback only when no status field (some clients omit it).
  return (
    msg.includes('the server could not find the requested resource') ||
    msg.includes('could not find the requested resource') ||
    /\bstatus(?:\s+code)?\s*:?\s*404\b/.test(msg) ||
    /\bhttp\s*404\b/.test(msg)
  );
}

function QueryErrorNotice({ title, error }: { title: string; error: Error }) {
  return (
    <SectionBox title={title} key={`${title}-error`}>
      <Typography variant="body2" color="error">
        Failed to load {title.toLowerCase()}: {error.message}
      </Typography>
    </SectionBox>
  );
}

/** Renders PVB + CSI DataUpload tables for a Backup (hidden when empty / CRD missing). */
export function BackupDataMovementSections({
  pvbs,
  uploads,
  pvbsError,
  uploadsError,
}: {
  pvbs: VeleroPodVolumeBackup[] | null;
  uploads: VeleroDataUpload[] | null;
  pvbsError?: Error | null;
  uploadsError?: Error | null;
}): ReactElement[] {
  const sections: ReactElement[] = [];

  if (pvbsError && !isMissingCrdError(pvbsError)) {
    sections.push(
      <QueryErrorNotice
        title="Pod Volume Backups (Data Movement)"
        error={pvbsError}
        key="pvb-err"
      />
    );
  } else if (pvbs && pvbs.length > 0) {
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
                <StatusLabel status={getDataMovementStatusColor(row.phase)}>
                  {row.phase}
                </StatusLabel>
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

  if (uploadsError && !isMissingCrdError(uploadsError)) {
    sections.push(
      <QueryErrorNotice
        title="CSI Data Uploads (Data Movement)"
        error={uploadsError}
        key="upload-err"
      />
    );
  } else if (uploads && uploads.length > 0) {
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
                <StatusLabel status={getDataMovementStatusColor(row.phase)}>
                  {row.phase}
                </StatusLabel>
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
  pvrsError,
  downloadsError,
}: {
  pvrs: VeleroPodVolumeRestore[] | null;
  downloads: VeleroDataDownload[] | null;
  pvrsError?: Error | null;
  downloadsError?: Error | null;
}): ReactElement[] {
  const sections: ReactElement[] = [];

  if (pvrsError && !isMissingCrdError(pvrsError)) {
    sections.push(
      <QueryErrorNotice
        title="Pod Volume Restores (Data Movement)"
        error={pvrsError}
        key="pvr-err"
      />
    );
  } else if (pvrs && pvrs.length > 0) {
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
                <StatusLabel status={getDataMovementStatusColor(row.phase)}>
                  {row.phase}
                </StatusLabel>
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

  if (downloadsError && !isMissingCrdError(downloadsError)) {
    sections.push(
      <QueryErrorNotice
        title="CSI Data Downloads (Data Movement)"
        error={downloadsError}
        key="download-err"
      />
    );
  } else if (downloads && downloads.length > 0) {
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
                <StatusLabel status={getDataMovementStatusColor(row.phase)}>
                  {row.phase}
                </StatusLabel>
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
