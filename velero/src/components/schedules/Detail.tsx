import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { resolveEveryRunAnchor, scheduleBackupLookupKey } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  // Use the route namespace so related Backups match the Schedule being viewed.
  // useVeleroData also pins to the current cluster when a namespace override is set.
  const {
    latestBackupBySchedule,
    loading: backupsLoading,
    error: backupsError,
  } = useVeleroData(namespace);

  return (
    <DetailsGrid
      resourceType={VeleroSchedule}
      name={name}
      namespace={namespace}
      withEvents
      noDefaultActions
      extraInfo={schedule => {
        if (!schedule) {
          return [];
        }

        const last = latestBackupBySchedule.get(
          scheduleBackupLookupKey(schedule.cluster, schedule.getName())
        );
        const nextRun = schedule.isActivelyScheduling
          ? formatNextScheduledRun(
              schedule.cronSchedule,
              new Date(),
              resolveEveryRunAnchor({
                lastBackupTime: schedule.lastBackupTime,
                lastSkippedTime: schedule.lastSkippedTime,
                creationTimestamp: schedule.metadata.creationTimestamp,
                lastBackup: last,
              })
            )
          : 'N/A';

        let lastBackupValue: ReactNode;
        let lastStatusValue: ReactNode;
        if (backupsError) {
          lastBackupValue = `Unavailable (${backupsError.message})`;
          lastStatusValue = 'Unavailable';
        } else if (backupsLoading) {
          lastBackupValue = 'Loading…';
          lastStatusValue = 'Loading…';
        } else if (last) {
          lastBackupValue = (
            <Link
              routeName={veleroRouteNames.backupDetail}
              params={{ namespace: schedule.getNamespace(), name: last.name }}
              activeCluster={schedule.cluster}
            >
              {last.name}
            </Link>
          );
          lastStatusValue = (
            <StatusLabel status={getBackupStatusColor(last.phase ?? 'Unknown')}>
              {last.phase ?? 'Unknown'}
            </StatusLabel>
          );
        } else {
          lastBackupValue = 'None';
          lastStatusValue = 'N/A';
        }

        return [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getScheduleStatusColor(schedule.statusDisplay)}>
                {schedule.statusDisplay}
              </StatusLabel>
            ),
          },
          {
            name: 'Cron',
            value: schedule.cronSchedule || 'N/A',
          },
          {
            name: 'Next run',
            value: nextRun,
          },
          {
            name: 'Namespaces',
            value: schedule.includedNamespacesDisplay,
          },
          ...(schedule.validationErrors.length > 0
            ? [
                {
                  name: 'Validation errors',
                  value: schedule.validationErrors.join('; '),
                },
              ]
            : []),
          {
            name: 'Last backup',
            value: lastBackupValue,
          },
          {
            name: 'Last status',
            value: lastStatusValue,
          },
        ];
      }}
    />
  );
}

/** Velero Schedule detail page (Phase 2). */
export default function ScheduleDetail() {
  return (
    <VeleroInstallCheck>
      <ScheduleDetailContent />
    </VeleroInstallCheck>
  );
}
