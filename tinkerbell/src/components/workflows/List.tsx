import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Workflow, WorkflowTaskStatus } from '../../resources/workflow';
import { fallback, renderStatus } from '../common/listHelpers';
import { getCurrentAction, getCurrentTask, getWorkflowState } from './helpers';

/**
 * Gets a task count label using workflow status tasks.
 *
 * @param tasks - Workflow task status entries.
 * @returns Count label for workflow tasks.
 */
function getTaskCount(tasks: WorkflowTaskStatus[] | undefined) {
  return fallback(tasks?.length);
}

/**
 * Renders the Tinkerbell Workflow list view.
 *
 * @returns Workflow list view with live provisioning summary columns.
 */
export function WorkflowList() {
  const columns: (ColumnType | ResourceTableColumn<Workflow>)[] = [
    'name',
    'namespace',
    {
      id: 'status',
      label: 'Status',
      getValue: item => getWorkflowState(item),
      render: item => renderStatus(getWorkflowState(item)),
    },
    {
      id: 'hardware',
      label: 'Hardware',
      getValue: item => fallback(item.spec?.hardwareRef),
    },
    {
      id: 'template',
      label: 'Template',
      getValue: item => fallback(item.spec?.templateRef),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      getValue: item => getTaskCount(item.status?.tasks),
    },
    {
      id: 'currentTask',
      label: 'Current Task',
      getValue: item => getCurrentTask(item),
    },
    {
      id: 'lastAction',
      label: 'Current Action',
      getValue: item => getCurrentAction(item),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="Workflows"
      resourceClass={Workflow}
      columns={columns}
      reflectInURL="tinkerbell-workflows"
      id="tinkerbell-workflows"
    />
  );
}
