import React from 'react';
import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroSchedule } from '../../resources/schedule';

export const VeleroScheduleList: React.FC = () => {
  const [schedules, error] = VeleroSchedule.useList();

  return (
    <SectionBox title="Velero Backup Schedules">
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (schedule: VeleroSchedule) => schedule.metadata.name,
          },
          {
            label: 'Namespace',
            getter: (schedule: VeleroSchedule) => schedule.metadata.namespace,
          },
          {
            label: 'Cron Schedule',
            getter: (schedule: VeleroSchedule) => <code>{schedule.cronSchedule}</code>,
          },
          {
            label: 'Paused',
            getter: (schedule: VeleroSchedule) => (schedule.isPaused ? 'Yes' : 'No'),
          },
          {
            label: 'Last Backup',
            getter: (schedule: VeleroSchedule) => schedule.lastBackupTimestamp || 'Never',
          },
          {
            label: 'Age',
            getter: (schedule: VeleroSchedule) => schedule.getAge(),
          },
        ]}
        data={schedules}
        errorMessage={error ? error.toString() : undefined}
      />
    </SectionBox>
  );
};

export default VeleroScheduleList;
