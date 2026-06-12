import { PlaceholderPage } from '../PlaceholderPage';

export function CrdList() {
  return (
    <PlaceholderPage
      title="Tinkerbell CRDs"
      description="This page will show which Tinkerbell v0.23.0 CRDs are available in the connected cluster."
      plannedItems={[
        'Core CRDs: Hardware, Templates, Workflows, and WorkflowRuleSets',
        'BMC CRDs: Machines, Jobs, and Tasks',
        'Installed version and API group summary',
        'Missing CRD guidance for local testing',
      ]}
    />
  );
}
