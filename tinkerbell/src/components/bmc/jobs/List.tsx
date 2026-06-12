import { PlaceholderPage } from '../../PlaceholderPage';

export function BmcJobList() {
  return (
    <PlaceholderPage
      title="BMC Jobs"
      description="This page will show BMC jobs requested against physical machines."
      plannedItems={[
        'Name, namespace, target machine, and age',
        'Start time, completion time, and condition summary',
        'Task count and requested operation summary',
        'Links to related BMC machines and tasks',
      ]}
    />
  );
}
