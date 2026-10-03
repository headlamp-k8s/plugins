import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { formatNextScheduledRun } from '../../cron';
import { getLatestBackupForSchedule } from '../../coverage';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { backups } = useVeleroData();

  return (
    <ResourceListView
      title="Velero Schedules"
      resourceClass={VeleroSchedule}
      filterFunction={(schedule: VeleroSchedule) => schedule.getNamespace() === veleroNamespace}
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
          getValue: (schedule: VeleroSchedule) => (schedule.paused ? 'Paused' : 'Active'),
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
            schedule.paused ? 'N/A (paused)' : formatNextScheduledRun(schedule.cronSchedule),
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
