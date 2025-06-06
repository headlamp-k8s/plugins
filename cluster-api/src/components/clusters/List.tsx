import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
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
          render: cluster => (
            <Link
              routeName="clusterclass"
              params={{
                name: cluster.spec?.topology?.class,
                namespace: cluster.metadata?.namespace,
              }}
            >
              {cluster.spec?.topology?.class}
            </Link>
          ),
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
