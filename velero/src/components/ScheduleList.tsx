import { DateLabel, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Schedule } from '../resources/schedule';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Lists all Velero Schedules (velero.io/v1), which create backups on a cron
 * expression.
 */
export function ScheduleList() {
  return (
    <ResourceListView
      title="Velero Schedules"
      resourceClass={Schedule}
      columns={[
        'name',
        'namespace',
        {
          id: 'schedule',
          label: 'Schedule',
          getValue: schedule => schedule.cronSchedule ?? '-',
        },
        {
          id: 'lastBackup',
          label: 'Last Backup',
          getValue: schedule => schedule.lastBackup ?? '',
          render: schedule =>
            schedule.lastBackup ? <DateLabel date={schedule.lastBackup} format="mini" /> : null,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: schedule => schedule.phase ?? '',
          render: schedule => <PhaseLabel phase={schedule.phase} />,
        },
      ]}
    />
  );
}
