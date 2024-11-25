import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterIssuer } from '../../types/clusterIssuer';

export function ClusterIssuersList() {
  return (
    <ResourceListView
      title="Cluster Issuers"
      resourceClass={ClusterIssuer}
      columns={[
        'name',
        {
          id: 'status',
          label: 'Status',
          getValue: item => item.status.conditions[0].status,
        },
        'age',
      ]}
    />
  );
}
