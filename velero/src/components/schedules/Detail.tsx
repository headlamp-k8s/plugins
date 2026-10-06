import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { getLatestBackupForSchedule } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const { backups } = useVeleroData();

  return (
    <DetailsGrid
      resourceType={VeleroSchedule}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={schedule => {
        if (!schedule) {
          return [];
        }

        const last = getLatestBackupForSchedule(backups, schedule.getName());
        const nextRun =
          schedule.paused || schedule.isFailedValidation
            ? 'N/A'
            : formatNextScheduledRun(schedule.cronSchedule);

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
            value: last ? (
              <Link
                routeName={veleroRouteNames.backupDetail}
                params={{ namespace: schedule.getNamespace(), name: last.name }}
              >
                {last.name}
              </Link>
            ) : (
              'None'
            ),
          },
          {
            name: 'Last status',
            value: last ? (
              <StatusLabel status={getBackupStatusColor(last.phase ?? 'Unknown')}>
                {last.phase ?? 'Unknown'}
              </StatusLabel>
            ) : (
              'N/A'
            ),
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
