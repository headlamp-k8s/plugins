import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MultiKueueCluster } from '../../resources/multiKueueCluster';
import { renderMultiKueueConnectionStatus } from '../../resources/multiKueueClusterFormatters';

export default function MultiKueueClusterList() {
  return (
    <ResourceListView
      title="MultiKueue Clusters"
      resourceClass={MultiKueueCluster}
      columns={[
        'name',
        {
          id: 'kubeConfigLocation',
          label: 'KubeConfig Secret',
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
  );
}
