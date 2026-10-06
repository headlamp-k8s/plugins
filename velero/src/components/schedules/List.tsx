import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { getLatestBackupForSchedule } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { backups } = useVeleroData();
  // Pin fetch to the configured Velero namespace (ResourceListView types omit `namespaces`).
  const [schedules, error] = VeleroSchedule.useList({ namespace: veleroNamespace });

  return (
    <ResourceListView
      title="Velero Schedules"
      data={schedules}
      errorMessage={error?.message}
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
      }}
      columns={[
        'name',
        'namespace',
        {
          id: 'cron',
          label: 'Cron',
          getValue: (schedule: VeleroSchedule) => schedule.cronSchedule || 'N/A',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (schedule: VeleroSchedule) => schedule.statusDisplay,
          render: (schedule: VeleroSchedule) => (
            <StatusLabel status={getScheduleStatusColor(schedule.statusDisplay)}>
              {schedule.statusDisplay}
            </StatusLabel>
          ),
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (schedule: VeleroSchedule) => schedule.includedNamespacesDisplay,
        },
        {
          id: 'next-run',
          label: 'Next run',
          getValue: (schedule: VeleroSchedule) =>
            schedule.paused || schedule.isFailedValidation
              ? 'N/A'
              : formatNextScheduledRun(schedule.cronSchedule),
        },
        {
          id: 'last-backup',
          label: 'Last backup',
          getValue: (schedule: VeleroSchedule) =>
            getLatestBackupForSchedule(backups, schedule.getName())?.name ?? 'None',
          render: (schedule: VeleroSchedule) => {
            const last = getLatestBackupForSchedule(backups, schedule.getName());
            if (!last) {
              return 'None';
            }
            return (
              <Link
                routeName={veleroRouteNames.backupDetail}
                params={{ namespace: veleroNamespace, name: last.name }}
              >
                {last.name}
              </Link>
            );
          },
        },
        {
          id: 'last-status',
          label: 'Last status',
          getValue: (schedule: VeleroSchedule) =>
            getLatestBackupForSchedule(backups, schedule.getName())?.phase ?? 'N/A',
          render: (schedule: VeleroSchedule) => {
            const phase = getLatestBackupForSchedule(backups, schedule.getName())?.phase;
            if (!phase) {
              return 'N/A';
            }
            return <StatusLabel status={getBackupStatusColor(phase)}>{phase}</StatusLabel>;
          },
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Schedule list (Phase 2). */
export default function ScheduleList() {
  return (
    <VeleroInstallCheck>
      <ScheduleListContent />
    </VeleroInstallCheck>
  );
}
