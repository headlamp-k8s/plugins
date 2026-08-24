import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Open a ResourceFlavor's details in a side panel instead of navigating away. */
export function openResourceFlavorActivity(name: string, cluster?: string) {
  Activity.launch({
    id: `kueue-resourceflavor-${cluster ?? ''}-${name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:cube-outline" />,
    title: name,
    cluster,
    content: <ResourceFlavorDetail name={name} />,
  });
}

export default function ResourceFlavorDetail(props: { name?: string }) {
  const { name: nameParam } = useParams<{ name: string }>();
  const name = props.name ?? nameParam;

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
