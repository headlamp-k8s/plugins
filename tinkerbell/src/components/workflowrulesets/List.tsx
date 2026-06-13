import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';
import { countLabel, fallback } from '../common/listHelpers';

export function WorkflowRuleSetList() {
  const columns: (ColumnType | ResourceTableColumn<WorkflowRuleSet>)[] = [
    'name',
    'namespace',
    {
      id: 'rules',
      label: 'Rules',
      getValue: item => countLabel(item.spec?.rules?.length, 'rule'),
    },
    {
      id: 'workflow',
      label: 'Workflow',
      getValue: item => fallback(item.spec?.workflow ? 'Configured' : undefined),
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
