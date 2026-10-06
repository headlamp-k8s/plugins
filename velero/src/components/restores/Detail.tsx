import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VeleroRestore } from '../../resources/velero';
import { getRestoreStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function RestoreDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VeleroRestore}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={restore => {
        if (!restore) {
          return [];
        }

        return [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getRestoreStatusColor(restore.phase)}>
                {restore.phase}
              </StatusLabel>
            ),
          },
          {
            name: 'Backup source',
            value: restore.backupName ? (
              <Link
                routeName={veleroRouteNames.backupDetail}
                params={{ namespace: restore.getNamespace(), name: restore.backupName }}
              >
                {restore.backupName}
              </Link>
            ) : (
              'N/A'
            ),
          },
          {
            name: 'Namespaces',
            value: restore.includedNamespacesDisplay,
          },
          {
            name: 'Restore PVs',
            value: restore.spec?.restorePVs === false ? 'False' : 'True',
          },
          {
            name: 'Progress',
            value: restore.progressDisplay,
          },
          {
            name: 'Errors',
            value: String(restore.errors),
          },
          {
            name: 'Warnings',
            value: String(restore.warnings),
          },
          {
            name: 'Started',
            value: restore.startTimestamp
              ? new Date(restore.startTimestamp).toLocaleString()
              : 'N/A',
          },
          {
            name: 'Completed',
            value: restore.completionTimestamp
              ? new Date(restore.completionTimestamp).toLocaleString()
              : 'N/A',
          },
        ];
      }}
    />
  );
}

/** Velero Restore detail page (Phase 2; fields inspired by reasonerjt prototype). */
export default function RestoreDetail() {
  return (
    <VeleroInstallCheck>
      <RestoreDetailContent />
    </VeleroInstallCheck>
  );
}
