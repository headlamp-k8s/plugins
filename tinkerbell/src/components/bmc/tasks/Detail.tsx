import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcTask } from '../../../resources/bmcTask';
import { fallback, renderRecordSection, renderUnknownValue } from '../../common/detailHelpers';

/**
 * Renders the Tinkerbell BMC Task detail view.
 *
 * @returns BMC Task detail page with operation, connection, and timing.
 */
export function BmcTaskDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={BmcTask}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              {
                name: 'Operation',
                value: fallback(item.spec?.task?.type ?? item.spec?.task?.action),
              },
              {
                name: 'Connection',
                value: fallback(item.spec?.connection ? 'Configured' : undefined),
              },
              { name: 'Started', value: fallback(item.status?.startTime) },
              { name: 'Completed', value: fallback(item.status?.completionTime) },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.bmc-task-operation',
                section: (
                  <SectionBox title="Task">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Operation',
                          value: fallback(item.spec?.task?.type ?? item.spec?.task?.action),
                        },
                        { name: 'Task Data', value: renderUnknownValue(item.spec?.task) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-task-connection',
                section: renderRecordSection('Connection', item.spec?.connection),
              },
              {
                id: 'tinkerbell.bmc-task-timing',
                section: (
                  <SectionBox title="Timing">
                    <NameValueTable
                      rows={[
                        { name: 'Started', value: fallback(item.status?.startTime) },
                        { name: 'Completed', value: fallback(item.status?.completionTime) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-task-conditions',
                section: <ConditionsSection resource={item.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
