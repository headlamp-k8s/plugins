import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Cluster } from '../../resources/cluster';

export function ClustersList() {
  return (
    <ResourceListView
      title="Clusters"
      resourceClass={Cluster}
      columns={[
        'name',
        'namespace',
        {
          id: 'clusterclass',
          label: 'Cluster Class',
          getValue: cluster => cluster.spec?.topology?.class,
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: cluster => cluster.status?.phase,
        },
        'age',
        {
          id: 'version',
          label: 'Version',
          getValue: cluster => cluster.spec?.topology?.version,
        },
      ]}
    />
  );
}
