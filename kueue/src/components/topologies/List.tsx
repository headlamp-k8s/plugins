import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Topology } from '../../resources/topology';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function TopologyList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={Topology}
      resourceLabel={t('Topologies')}
      verb="list"
      accessDescription={t('Kueue Topologies define node and hardware hierarchy levels for Topology-Aware Scheduling (TAS).')}
    >
      <ResourceListView
        title={t('Topologies')}
        resourceClass={Topology}
        columns={[
          'name',
          {
            id: 'levelsDisplay',
            label: t('Levels Hierarchy'),
            getValue: (topology: Topology) => topology.levelsDisplay,
          },
          {
            id: 'levelsCount',
            label: t('Total Levels'),
            getValue: (topology: Topology) => topology.levelsCount,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
