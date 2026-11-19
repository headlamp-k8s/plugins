import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useParams } from 'react-router-dom';
import { VeleroDataUpload, VeleroPodVolumeBackup } from '../../resources/datamovement';
import { VeleroBackup } from '../../resources/velero';
import { getBackupStatusColor } from '../../utils/status';
import { backupNameLabelSelector } from '../../utils/veleroLabel';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { BackupDataMovementSections } from '../common/DataMovementSections';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function BackupDetailContent(props: { name?: string; namespace?: string; cluster?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const name = props.name ?? params.name;
  const namespace = props.namespace ?? params.namespace;
  const cluster = props.cluster || getCluster() || undefined;
  const labelSelector = name ? backupNameLabelSelector(name) : undefined;

  // CSI / datamover related objects (empty when CRDs are missing on the cluster).
  const [pvbs, pvbsError] = VeleroPodVolumeBackup.useList({
    namespace,
    cluster,
    labelSelector,
  });
  const [uploads, uploadsError] = VeleroDataUpload.useList({
    namespace,
    cluster,
    labelSelector,
  });

  return (
    <DetailsGrid
      resourceType={VeleroBackup}
      name={name}
      namespace={namespace}
      cluster={cluster}
      withEvents
      noDefaultActions
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
                activeCluster={backup.cluster}
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
            name: 'Storage location',
            value: backup.storageLocation ? (
              <Link
                routeName={veleroRouteNames.bslDetail}
                params={{ namespace: backup.getNamespace(), name: backup.storageLocation }}
                activeCluster={backup.cluster}
              >
                {backup.storageLocation}
              </Link>
            ) : (
              'Velero default'
            ),
          },
          ...(backup.failureReason
            ? [{ name: 'Failure reason', value: backup.failureReason }]
            : []),
          ...(backup.validationErrors.length > 0
            ? [{ name: 'Validation errors', value: backup.validationErrors.join('; ') }]
            : []),
          ...(backup.errors > 0 || backup.warnings > 0
            ? [
                { name: 'Errors', value: String(backup.errors) },
                { name: 'Warnings', value: String(backup.warnings) },
              ]
            : []),
          ...(backup.conditionsDisplay
            ? [{ name: 'Conditions', value: backup.conditionsDisplay }]
            : []),
          {
            name: 'Started',
            value: backup.startTimestamp ? new Date(backup.startTimestamp).toLocaleString() : 'N/A',
          },
          {
            name: 'Completion Time',
            value: backup.completionTimestamp
              ? new Date(backup.completionTimestamp).toLocaleString()
              : 'N/A',
          },
        ];
      }}
      extraSections={() => {
        const movement = BackupDataMovementSections({
          pvbs,
          uploads,
          pvbsError,
          uploadsError,
        });
        return movement.map((section, index) => ({
          id: `velero-backup-datamovement-${index}`,
          section,
        }));
      }}
    />
  );
}

/** Velero Backup detail — Phase 2 fields + Phase 3 CSI/datamover sections. */
export default function BackupDetail(props: {
  name?: string;
  namespace?: string;
  cluster?: string;
}) {
  return (
    <VeleroInstallCheck cluster={props.cluster}>
      <BackupDetailContent {...props} />
    </VeleroInstallCheck>
  );
}
