import { PlaceholderPage } from '../../PlaceholderPage';

export function BmcTaskList() {
  return (
    <PlaceholderPage
      title="BMC Tasks"
      description="This page will show direct BMC operations and their execution status."
      plannedItems={[
        'Name, namespace, task type, and age',
        'Start time, completion time, and condition summary',
        'Connection and operation details',
        'Raw spec and YAML access',
      ]}
    />
  );
}
