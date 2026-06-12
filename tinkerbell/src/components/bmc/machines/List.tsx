import { PlaceholderPage } from '../../PlaceholderPage';

export function BmcMachineList() {
  return (
    <PlaceholderPage
      title="BMC Machines"
      description="This page will show BMC-managed physical machines."
      plannedItems={[
        'Name, namespace, and power state',
        'Connection and provider summary',
        'Condition and last update status',
        'Links to related BMC jobs and hardware',
      ]}
    />
  );
}
