import { PlaceholderPage } from '../PlaceholderPage';

export function HardwareList() {
  return (
    <PlaceholderPage
      title="Hardware"
      description="This page will show physical machines registered with Tinkerbell."
      plannedItems={[
        'Name, namespace, and hardware status',
        'Agent ID, MAC address, hostname, and IP summary',
        'PXE/netboot availability',
        'Related workflow navigation',
      ]}
    />
  );
}
