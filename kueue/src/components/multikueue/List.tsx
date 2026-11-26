import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MultiKueueCluster } from '../../resources/multiKueueCluster';
import { renderMultiKueueConnectionStatus } from '../../resources/multiKueueClusterFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function MultiKueueClusterList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={MultiKueueCluster}
      resourceLabel="MultiKueueClusters"
      verb="list"
    >
      <ResourceListView
        title="MultiKueue Clusters"
        resourceClass={MultiKueueCluster}
        columns={[
          'name',
          {
            id: 'kubeConfigLocation',
            label: 'KubeConfig Location',
            getValue: (cluster: MultiKueueCluster) => cluster.kubeConfigLocation,
          },
          {
            id: 'locationType',
            label: 'Location Type',
            getValue: (cluster: MultiKueueCluster) => cluster.kubeConfigType,
          },
          {
            id: 'connectionStatus',
            label: 'Connection Status',
            getValue: (cluster: MultiKueueCluster) =>
              renderMultiKueueConnectionStatus(cluster.activeCondition),
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
