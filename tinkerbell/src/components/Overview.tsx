import { PlaceholderPage } from './PlaceholderPage';

/**
 * Renders the Tinkerbell overview placeholder page.
 */
export function TinkerbellOverview() {
  return (
    <PlaceholderPage
      title="Tinkerbell Overview"
      description="This page will summarize bare metal provisioning health across Tinkerbell resources."
      plannedItems={[
        'Hardware totals and state summary',
        'Workflow status summary',
        'Template count and parse status summary',
        'Recent provisioning workflows',
      ]}
    />
  );
}
