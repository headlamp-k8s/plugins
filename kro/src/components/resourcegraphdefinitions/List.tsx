import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import KroInstallGuard from '../common/KroInstallGuard';
import { KroStateLabel } from './common';

/**
 * Sidebar list page for ResourceGraphDefinitions: name, generated
 * kind/apiVersion, state, and age, live via watches. Wrapped in the
 * install guard so kro-less clusters get an install pointer.
 *
 * @returns The RGD list view.
 */
export default function ResourceGraphDefinitionList() {
  return (
    <KroInstallGuard>
      <ResourceListView
        title="Resource Graph Definitions"
        resourceClass={ResourceGraphDefinition}
        columns={[
          'name',
          {
            id: 'kind',
            label: 'Kind',
            getValue: (rgd: ResourceGraphDefinition) => rgd.generatedKind,
          },
          {
            id: 'apiVersion',
            label: 'API Version',
            getValue: (rgd: ResourceGraphDefinition) => rgd.generatedApiVersion,
          },
          {
            id: 'state',
            label: 'State',
            getValue: (rgd: ResourceGraphDefinition) => rgd.state,
            render: (rgd: ResourceGraphDefinition) => <KroStateLabel state={rgd.state} />,
          },
          'age',
        ]}
      />
    </KroInstallGuard>
  );
}
