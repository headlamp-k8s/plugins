import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { BmcTask } from '../../../resources/bmcTask';
import { fallback, renderStatus } from '../../common/listHelpers';

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
      getValue: item => fallback(item.spec?.task?.type ?? item.spec?.task?.action),
    },
    {
      id: 'connection',
      label: 'Connection',
      getValue: item => fallback(item.spec?.connection ? 'Configured' : undefined),
    },
    {
      id: 'status',
      label: 'Status',
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
