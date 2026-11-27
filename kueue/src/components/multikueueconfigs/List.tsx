import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { MultiKueueConfig } from '../../resources/multiKueueConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function MultiKueueConfigList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={MultiKueueConfig}
      resourceLabel="MultiKueueConfigs"
      verb="list"
    >
      <ResourceListView
        title="Kueue MultiKueueConfigs"
        resourceClass={MultiKueueConfig}
        columns={[
          'name',
          {
            id: 'clusters',
            label: 'Clusters (priority order)',
            getValue: (config: MultiKueueConfig) => config.clustersDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
