import React from 'react';
import { useParams } from 'react-router-dom';
import { MainInfoSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VeleroSchedule } from '../../resources/schedule';

export const VeleroScheduleDetail: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [schedule, error] = VeleroSchedule.useGet(name, namespace);

  if (!schedule) {
    return <div>Loading...</div>;
  }

  return (
    <MainInfoSection
      resource={schedule}
      title={`Schedule: ${schedule.metadata.name}`}
      extraInfo={[
        {
          name: 'Cron Expression',
          value: schedule.cronSchedule,
        },
        {
          name: 'Paused',
          value: schedule.isPaused ? 'Yes' : 'No',
        },
        {
          name: 'Last Backup',
          value: schedule.lastBackupTimestamp || 'Never',
        },
      ]}
    />
  );
};

export default VeleroScheduleDetail;
