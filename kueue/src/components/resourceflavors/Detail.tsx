import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ResourceFlavorDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={ResourceFlavor}
      resourceLabel="ResourceFlavors"
      verb="get"
    >
      <DetailsGrid
        resourceType={ResourceFlavor}
        name={name}
        withEvents
        extraInfo={resourceFlavor =>
          resourceFlavor
            ? [
                {
                  name: 'Node Labels',
                  value: resourceFlavor.nodeLabelsDisplay,
                },
                {
                  name: 'Node Taints',
                  value: resourceFlavor.nodeTaintsDisplay,
                },
                {
                  name: 'Tolerations',
                  value: resourceFlavor.tolerationsDisplay,
                },
                {
                  name: 'Topology',
                  value: resourceFlavor.topologyName,
                },
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
