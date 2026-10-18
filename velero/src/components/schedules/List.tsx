import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useVeleroNamespace } from '../../config';
import { resolveEveryRunAnchor, scheduleBackupLookupKey } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { latestBackupBySchedule, loading: backupsLoading, error: backupsError } = useVeleroData();
  // Pin fetch to the configured Velero namespace (ResourceListView types omit `namespaces`).
  const [schedules, schedulesError] = VeleroSchedule.useList({ namespace: veleroNamespace });

  const errorMessage = schedulesError?.message ?? backupsError?.message;
  // Keep the table loading until related Backup data is ready so last-backup
  // columns never show a false "None" while Backups are still loading / errored.
  const tableData = backupsLoading || schedules === null ? null : schedules;

  return (
    <ResourceListView
      title="Velero Schedules"
      data={tableData}
      errorMessage={errorMessage}
      enableRowActions={false}
      enableRowSelection={false}
      filterFunction={veleroListFilterFunction}
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
          getValue: (schedule: VeleroSchedule) => {
            const last = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            );
            return schedule.isActivelyScheduling
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
          },
        },
        {
          id: 'last-backup',
          label: 'Last backup',
          getValue: (schedule: VeleroSchedule) =>
            latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.name ?? 'None',
          render: (schedule: VeleroSchedule) => {
            const last = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            );
            if (!last) {
              return 'None';
            }
            return (
              <Link
                routeName={veleroRouteNames.backupDetail}
                params={{ namespace: veleroNamespace, name: last.name }}
                activeCluster={schedule.cluster}
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
            latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.phase ?? 'N/A',
          render: (schedule: VeleroSchedule) => {
            const phase = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.phase;
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
