import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MachineSet } from '../../resources/machineset';

export function MachineSetsList() {
  return (
    <ResourceListView
      title="Machine Sets"
      resourceClass={MachineSet}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: machineset => machineset.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: machineset => (
            <Link
              routeName="capicluster"
              params={{
                name: machineset.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: machineset.metadata?.namespace,
              }}
            >
              {machineset.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getValue: machineset => machineset.status?.replicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: machineset => machineset.status?.readyReplicas,
        },
        {
          id: 'available',
          label: 'Available',
          getValue: machineset => machineset.status?.availableReplicas,
        },
        'age',
        {
          id: 'version',
          label: 'Version',
          getValue: machineset => machineset.spec?.template?.spec?.version,
        },
      ]}
    />
  );
}
