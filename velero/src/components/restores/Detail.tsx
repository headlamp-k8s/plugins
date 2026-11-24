import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { VeleroDataDownload, VeleroPodVolumeRestore } from '../../resources/datamovement';
import { VeleroRestore } from '../../resources/velero';
import { getRestoreStatusColor } from '../../utils/status';
import { restoreNameLabelSelector } from '../../utils/veleroLabel';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { RestoreDataMovementSections } from '../common/DataMovementSections';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function RestoreDetailContent(props: { name?: string; namespace?: string; cluster?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const name = props.name ?? params.name;
  const namespace = props.namespace ?? params.namespace;
  const cluster = props.cluster || getCluster() || undefined;
  const labelSelector = name ? restoreNameLabelSelector(name) : undefined;

  const [pvrs, pvrsError] = VeleroPodVolumeRestore.useList({
    namespace,
    cluster,
    labelSelector,
  });
  const [downloads, downloadsError] = VeleroDataDownload.useList({
    namespace,
    cluster,
    labelSelector,
  });

  return (
    <DetailsGrid
      resourceType={VeleroRestore}
      name={name}
      namespace={namespace}
      cluster={cluster}
      withEvents
      noDefaultActions
      extraInfo={restore => {
        if (!restore) {
          return [];
        }

        let sourceValue: ReactNode = 'N/A';
        if (restore.backupName) {
          sourceValue = (
            <Link
              routeName={veleroRouteNames.backupDetail}
              params={{ namespace: restore.getNamespace(), name: restore.backupName }}
              activeCluster={restore.cluster}
            >
              {restore.backupName}
            </Link>
          );
        } else if (restore.scheduleName) {
          sourceValue = (
            <Link
              routeName={veleroRouteNames.scheduleDetail}
              params={{ namespace: restore.getNamespace(), name: restore.scheduleName }}
              activeCluster={restore.cluster}
            >
              {`Schedule: ${restore.scheduleName}`}
            </Link>
          );
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
            value: sourceValue,
          },
          {
            name: 'Namespaces',
            value: restore.includedNamespacesDisplay,
          },
          {
            name: 'Restore PVs',
            value: restore.restorePVsDisplay,
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
          ...(restore.failureReason
            ? [{ name: 'Failure reason', value: restore.failureReason }]
            : []),
          ...(restore.validationErrors.length > 0
            ? [{ name: 'Validation errors', value: restore.validationErrors.join('; ') }]
            : []),
          ...(restore.conditionsDisplay
            ? [{ name: 'Conditions', value: restore.conditionsDisplay }]
            : []),
          {
            name: 'Started',
            value: restore.startTimestamp
              ? new Date(restore.startTimestamp).toLocaleString()
              : 'N/A',
          },
          {
            name: 'Completion Time',
            value: restore.completionTimestamp
              ? new Date(restore.completionTimestamp).toLocaleString()
              : 'N/A',
          },
        ];
      }}
      extraSections={() => {
        const movement = RestoreDataMovementSections({
          pvrs,
          downloads,
          pvrsError,
          downloadsError,
        });
        return movement.map((section, index) => ({
          id: `velero-restore-datamovement-${index}`,
          section,
        }));
      }}
    />
  );
}

/** Velero Restore detail — Phase 2 fields + Phase 3 CSI/datamover sections. */
export default function RestoreDetail(props: {
  name?: string;
  namespace?: string;
  cluster?: string;
}) {
  return (
    <VeleroInstallCheck cluster={props.cluster}>
      <RestoreDetailContent {...props} />
    </VeleroInstallCheck>
  );
}
