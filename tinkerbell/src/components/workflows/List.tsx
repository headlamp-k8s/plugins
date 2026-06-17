import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { normalizeState } from '../../resources/common';
import { Workflow } from '../../resources/workflow';
import {
  booleanLabel,
  countLabel,
  fallback,
  getFirstDefined,
  renderStatus,
} from '../common/listHelpers';

/**
 * Renders the Tinkerbell Workflow list view.
 */
export function WorkflowList() {
  const columns: (ColumnType | ResourceTableColumn<Workflow>)[] = [
    'name',
    'namespace',
    {
      id: 'status',
      label: 'Status',
      getValue: item =>
        normalizeState(getFirstDefined(item.status?.state, item.status?.currentState)),
      render: item =>
        renderStatus(
          normalizeState(getFirstDefined(item.status?.state, item.status?.currentState))
        ),
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
      id: 'disabled',
      label: 'Disabled',
      getValue: item => booleanLabel(item.spec?.disabled),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      getValue: item => countLabel(item.status?.tasks?.length, 'task'),
    },
    {
      id: 'lastAction',
      label: 'Last Action',
      getValue: item => {
        const actions = item.status?.tasks?.flatMap(task => task.actions ?? []) ?? [];
        return fallback(actions.at(-1)?.name ?? item.status?.currentState);
      },
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
