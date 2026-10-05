import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { BmcTask } from '../../../resources/bmcTask';
import { fallback, renderStatus } from '../../common/listHelpers';

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
 * Renders the Tinkerbell BMC Task list view.
 */
export function BmcTaskList() {
  const columns: (ColumnType | ResourceTableColumn<BmcTask>)[] = [
    'name',
    'namespace',
    {
      id: 'operation',
      label: 'Operation',
      getValue: item => getTaskOperation(item),
    },
    {
      id: 'status',
      label: 'Status',
      gridTemplate: 'max-content',
      getValue: item => fallback(item.status?.conditions?.at(-1)?.type),
      render: item => renderStatus(item.status?.conditions?.at(-1)?.type),
    },
    {
      id: 'started',
      label: 'Started',
      getValue: item => fallback(item.status?.startTime),
    },
    {
      id: 'completed',
      label: 'Completed',
      getValue: item => fallback(item.status?.completionTime),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="BMC Tasks"
      resourceClass={BmcTask}
      columns={columns}
      reflectInURL="tinkerbell-bmc-tasks"
      id="tinkerbell-bmc-tasks"
    />
  );
}
