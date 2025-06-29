import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterClass } from '../../resources/clusterclass';

export function ClusterClassesList() {
  return (
    <ResourceListView
      title="Cluster Classes"
      resourceClass={ClusterClass}
      columns={['name', 'namespace', 'age']}
    />
  );
}
