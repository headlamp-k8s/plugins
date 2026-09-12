import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceFlavor } from '../../resources/resourceFlavor';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ResourceFlavorList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={ResourceFlavor}
      resourceLabel={t('ResourceFlavors')}
      verb="list"
    >
      <ResourceListView
        title={t('ResourceFlavors')}
        resourceClass={ResourceFlavor}
        columns={[
          'name',
          {
            id: 'nodeLabels',
            label: t('Node Labels'),
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.nodeLabelsDisplay,
          },
          {
            id: 'nodeTaints',
            label: t('Node Taints'),
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.nodeTaintsDisplay,
          },
          {
            id: 'tolerations',
            label: t('Tolerations'),
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.tolerationsDisplay,
          },
          {
            id: 'topology',
            label: t('Topology'),
            getValue: (resourceFlavor: ResourceFlavor) => resourceFlavor.topologyName,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
