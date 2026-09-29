import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ResourceFlavorDetail() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={ResourceFlavor}
      resourceLabel={t('ResourceFlavors')}
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
                  name: t('Node Labels'),
                  value: resourceFlavor.nodeLabelsDisplay,
                },
                {
                  name: t('Node Taints'),
                  value: resourceFlavor.nodeTaintsDisplay,
                },
                {
                  name: t('Tolerations'),
                  value: resourceFlavor.tolerationsDisplay,
                },
                {
                  name: t('Topology'),
                  value: resourceFlavor.topologyName,
                },
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
