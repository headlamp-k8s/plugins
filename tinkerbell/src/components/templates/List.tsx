import { PlaceholderPage } from '../PlaceholderPage';

export function TemplateList() {
  return (
    <PlaceholderPage
      title="Templates"
      description="This page will show Tinkerbell provisioning recipes."
      plannedItems={[
        'Template name and namespace',
        'Step and action counts',
        'Template data parse status',
        'Related workflow navigation',
      ]}
    />
  );
}
