import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { BmcJob } from '../../../resources/bmcJob';
import { countLabel, fallback, renderStatus } from '../../common/listHelpers';

/**
 * Renders the Tinkerbell BMC Job list view.
 */
export function BmcJobList() {
  const columns: (ColumnType | ResourceTableColumn<BmcJob>)[] = [
    'name',
    'namespace',
    {
      id: 'machine',
      label: 'Machine',
      getValue: item => fallback(item.spec?.machineRef?.name),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      getValue: item => countLabel(item.spec?.tasks?.length, 'task'),
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
      title="BMC Jobs"
      resourceClass={BmcJob}
      columns={columns}
      reflectInURL="tinkerbell-bmc-jobs"
      id="tinkerbell-bmc-jobs"
    />
  );
}
