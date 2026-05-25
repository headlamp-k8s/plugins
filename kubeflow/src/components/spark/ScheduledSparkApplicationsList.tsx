import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { HoverInfoLabel, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import cronstrue from 'cronstrue/i18n';
import React from 'react';
import { ScheduledSparkApplicationClass } from '../../resources/sparkApplication';
import { ScheduledSparkApplicationStatusBadge } from '../common/ScheduledSparkApplicationStatusBadge';
import { SectionPage } from '../common/SectionPage';

/**
 * List view for ScheduledSparkApplications.
 * Displays a table of scheduled spark jobs with human-readable cron schedules.
 */
export function ScheduledSparkApplicationsList() {
  const { i18n } = useTranslation();

  return (
    <SectionPage title="Scheduled Spark Applications" apiPath="/apis/sparkoperator.k8s.io/v1beta2">
      <ResourceListView
        title="Scheduled Spark Applications"
        resourceClass={ScheduledSparkApplicationClass}
        columns={[
          'name',
          'namespace',
          {
            id: 'schedule',
            label: 'Schedule',
            getValue: (item: ScheduledSparkApplicationClass) => item.schedule || '-',
            render: (item: ScheduledSparkApplicationClass) => {
              const schedule = item.schedule;
              if (!schedule) return '-';
              let described = '';
              try {
                described = cronstrue.toString(schedule, { locale: i18n.language });
              } catch (e) {
                console.debug(`Could not describe cron "${schedule}":`, e);
              }
              return <HoverInfoLabel label={schedule} hoverInfo={described} />;
            },
          },
          {
            id: 'concurrency',
            label: 'Concurrency',
            getValue: (item: ScheduledSparkApplicationClass) => item.concurrencyPolicy || '-',
          },
          {
            id: 'template-type',
            label: 'Template Type',
            getValue: (item: ScheduledSparkApplicationClass) => item.template.type || '-',
          },
          {
            id: 'last-run',
            label: 'Last Run',
            getValue: (item: ScheduledSparkApplicationClass) =>
              item.lastRunName || item.lastRun || '-',
          },
          {
            id: 'next-run',
            label: 'Next Run',
            getValue: (item: ScheduledSparkApplicationClass) => item.nextRun || '-',
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: ScheduledSparkApplicationClass) =>
              item.scheduleState || (item.suspend ? 'Suspended' : 'Scheduled'),
            render: (item: ScheduledSparkApplicationClass) => (
              <ScheduledSparkApplicationStatusBadge scheduledSparkApplication={item} />
            ),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
