import { PlaceholderPage } from '../PlaceholderPage';

export function WorkflowList() {
  return (
    <PlaceholderPage
      title="Workflows"
      description="This page will show provisioning runs that connect hardware to templates."
      plannedItems={[
        'Workflow state and completion summary',
        'Linked hardware and template references',
        'Current or last action',
        'Failure and timeout visibility',
      ]}
    />
  );
}
