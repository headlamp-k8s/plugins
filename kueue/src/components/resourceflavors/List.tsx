import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { renderResourceFlavorLink } from '../common/KueueResourceLinks';

export default function ResourceFlavorList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={ResourceFlavor}
      resourceLabel="ResourceFlavors"
      verb="list"
    >
      <ResourceListView
        title="Kueue ResourceFlavors"
        resourceClass={ResourceFlavor}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.metadata.name,
            render: (resourceFlavor: ResourceFlavor) =>
              renderResourceFlavorLink(resourceFlavor.metadata.name, resourceFlavor.cluster),
          },
          {
            id: 'nodeLabels',
            label: 'Node Labels',
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.nodeLabelsDisplay,
          },
          {
            id: 'nodeTaints',
            label: 'Node Taints',
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.nodeTaintsDisplay,
          },
          {
            id: 'tolerations',
            label: 'Tolerations',
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.tolerationsDisplay,
          },
          {
            id: 'topology',
            label: 'Topology',
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.topologyName,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
