import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcTask } from '../../../resources/bmcTask';
import { fallback, renderUnknownValue } from '../../common/detailHelpers';

/**
 * Gets the BMC operation name from the task data key.
 *
 * @param item - BMC Task resource to inspect.
 * @returns First task data key, or a fallback field if present.
 */
function getTaskOperation(item: BmcTask): string {
  const task = item.spec?.task;
  const taskKey = task ? Object.keys(task)[0] : undefined;

  return fallback(taskKey ?? task?.type ?? task?.action);
}

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
      extraInfo={item =>
        item
          ? [
              {
                name: 'Operation',
                value: getTaskOperation(item),
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
                          value: getTaskOperation(item),
                        },
                        { name: 'Task Data', value: renderUnknownValue(item.spec?.task) },
                      ]}
                    />
                  </SectionBox>
                ),
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
