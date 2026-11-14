import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ResourceFlavorDetail(props: { name?: string; cluster?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={ResourceFlavor}
      resourceLabel="ResourceFlavors"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={ResourceFlavor}
        name={name}
        cluster={cluster}
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
