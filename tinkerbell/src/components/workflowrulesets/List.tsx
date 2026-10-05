import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';
import { fallback } from '../common/listHelpers';

/**
 * Gets the template reference from WorkflowRuleSet workflow config.
 *
 * @param item - WorkflowRuleSet resource to inspect.
 * @returns Template reference/name when present.
 */
function getTemplateRef(item: WorkflowRuleSet): string {
  const workflow = item.spec?.workflow;
  const template = workflow?.template ?? workflow?.templateRef ?? workflow?.ref;

  if (typeof template === 'string') {
    return fallback(template);
  }

  return fallback(template?.ref ?? template?.name ?? workflow?.templateName);
}

/**
 * Renders the Tinkerbell WorkflowRuleSet list view.
 */
export function WorkflowRuleSetList() {
  const columns: (ColumnType | ResourceTableColumn<WorkflowRuleSet>)[] = [
    'name',
    'namespace',
    {
      id: 'rules',
      label: 'Rules',
      getValue: item => fallback(item.spec?.rules?.length),
    },
    {
      id: 'template',
      label: 'Template',
      getValue: item => getTemplateRef(item),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="WorkflowRuleSets"
      resourceClass={WorkflowRuleSet}
      columns={columns}
      reflectInURL="tinkerbell-workflow-rulesets"
      id="tinkerbell-workflow-rulesets"
    />
  );
}
