import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as MuiLink } from '@mui/material';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { openResourceFlavorActivity } from './Detail';

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
            render: (resourceFlavor: ResourceFlavor) => (
              <MuiLink
                component="button"
                sx={{ textAlign: 'left' }}
                onClick={() =>
                  openResourceFlavorActivity(resourceFlavor.metadata.name, resourceFlavor.cluster)
                }
              >
                {resourceFlavor.metadata.name}
              </MuiLink>
            ),
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
