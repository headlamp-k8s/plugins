import {
  DateLabel,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { joinOrDash } from '../resources/common';
import { Schedule } from '../resources/schedule';
import { PhaseLabel } from './common/PhaseLabel';

/**
 * Detail view for a single Velero Schedule.
 *
 * The backup template is the same shape as a Backup spec, so the second
 * section shows the parts of it that are useful at a glance.
 */
export function ScheduleDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={Schedule}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={schedule =>
        schedule && [
          {
            name: 'Phase',
            value: <PhaseLabel phase={schedule.phase} />,
          },
          {
            name: 'Schedule',
            value: schedule.cronSchedule ?? '-',
          },
          {
            name: 'Paused',
            value: schedule.spec.paused ? 'Yes' : 'No',
          },
          {
            name: 'Last Backup',
            value: schedule.lastBackup ? <DateLabel date={schedule.lastBackup} /> : '-',
          },
          {
            name: 'Validation Errors',
            value: joinOrDash(schedule.status.validationErrors),
          },
        ]
      }
      extraSections={schedule =>
        schedule && [
          {
            id: 'velero-schedule-template',
            section: (
              <SectionBox title="Backup Template">
                <NameValueTable
                  rows={[
                    {
                      name: 'Storage Location',
                      value: schedule.spec.template?.storageLocation ?? '-',
                    },
                    {
                      name: 'TTL',
                      value: schedule.spec.template?.ttl ?? '-',
                    },
                    {
                      name: 'Included Namespaces',
                      value: joinOrDash(schedule.spec.template?.includedNamespaces),
                    },
                    {
                      name: 'Excluded Namespaces',
                      value: joinOrDash(schedule.spec.template?.excludedNamespaces),
                    },
                    {
                      name: 'Included Resources',
                      value: joinOrDash(schedule.spec.template?.includedResources),
                    },
                    {
                      name: 'Excluded Resources',
                      value: joinOrDash(schedule.spec.template?.excludedResources),
                    },
                    {
                      name: 'Snapshot Volumes',
                      value: schedule.spec.template?.snapshotVolumes ? 'Yes' : 'No',
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
        ]
      }
    />
  );
}
