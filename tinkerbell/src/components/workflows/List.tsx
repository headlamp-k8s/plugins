import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { normalizeState } from '../../resources/common';
import { Workflow, WorkflowTaskStatus } from '../../resources/workflow';
import { countLabel, fallback, renderStatus } from '../common/listHelpers';

/**
 * Gets a user-facing workflow state from the current v0.23.0 status shape.
 *
 * @param item - Workflow resource to inspect.
 * @returns Normalized workflow state.
 */
function getWorkflowState(item: Workflow): string {
  return normalizeState(item.status?.state ?? item.status?.currentState?.state);
}

/**
 * Gets the best currently relevant action name for a workflow.
 *
 * @param item - Workflow resource to inspect.
 * @returns Current action while running, or fallback for non-running workflows.
 */
function getCurrentAction(item: Workflow): string {
  if (getWorkflowState(item) !== 'Running') {
    return fallback(undefined);
  }

  return fallback(item.status?.currentState?.actionName);
}

/**
 * Gets a task count label using workflow status tasks.
 *
 * @param tasks - Workflow task status entries.
 * @returns Count label for workflow tasks.
 */
function getTaskCount(tasks: WorkflowTaskStatus[] | undefined) {
  return countLabel(tasks?.length, 'task');
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
