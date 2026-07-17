import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { KroStateLabel } from './common';

export default function ResourceGraphDefinitionList() {
  return (
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
  );
}
