import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VeleroBackup } from '../../resources/velero';
import { getBackupStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BackupDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VeleroBackup}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={backup => {
        if (!backup) {
          return [];
        }

        return [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getBackupStatusColor(backup.phase)}>{backup.phase}</StatusLabel>
            ),
          },
          {
            name: 'Triggered by',
            value: backup.scheduleName ? (
              <Link
                routeName={veleroRouteNames.scheduleDetail}
                params={{ namespace: backup.getNamespace(), name: backup.scheduleName }}
              >
                {backup.scheduleName}
              </Link>
            ) : (
              'Manual'
            ),
          },
          {
            name: 'Namespaces',
            value: backup.includedNamespacesDisplay,
          },
          {
            name: 'Started',
            value: backup.startTimestamp ? new Date(backup.startTimestamp).toLocaleString() : 'N/A',
          },
          {
            name: 'Completed',
            value: backup.completionTimestamp
              ? new Date(backup.completionTimestamp).toLocaleString()
              : 'N/A',
          },
        ];
      }}
    />
  );
}

/** Velero Backup detail page (Phase 2). */
export default function BackupDetail() {
  return (
    <VeleroInstallCheck>
      <BackupDetailContent />
    </VeleroInstallCheck>
  );
}
