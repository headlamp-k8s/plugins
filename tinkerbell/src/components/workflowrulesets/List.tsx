import { PlaceholderPage } from '../PlaceholderPage';

export function WorkflowRuleSetList() {
  return (
    <PlaceholderPage
      title="WorkflowRuleSets"
      description="This page will show Tinkerbell rules that automate workflow creation."
      plannedItems={[
        'Name, namespace, and age',
        'Rule count and workflow target summary',
        'Linked workflow configuration',
        'Raw spec and YAML access',
      ]}
    />
  );
}
