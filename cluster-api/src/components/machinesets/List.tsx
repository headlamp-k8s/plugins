import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
          getValue: machineset => machineset.spec.clusterName,
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
          getValue: machineset => machineset.metadata.resourceVersion,
        },
      ]}
    />
  );
}
