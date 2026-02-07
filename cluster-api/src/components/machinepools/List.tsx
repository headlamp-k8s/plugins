import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MachinePool } from '../../resources/machinepool';

export function MachinePoolsList() {
  return (
    <ResourceListView
      title="Machine Pools"
      resourceClass={MachinePool}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: mp => mp.spec?.clusterName,
          render: mp => (
            <Link
              routeName="capicluster"
              params={{
                name: mp.spec?.clusterName,
                namespace: mp.metadata?.namespace,
              }}
            >
              {mp.spec?.clusterName}
            </Link>
          ),
        },
        {
          id: 'desired',
          label: 'Desired',
          getValue: mp => mp.spec?.replicas ?? 0,
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getValue: mp => mp.status?.replicas ?? 0,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: mp => mp.status?.readyReplicas ?? 0,
        },
        {
          id: 'available',
          label: 'Available',
          getValue: mp => mp.status?.availableReplicas ?? 0,
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: mp => mp.status?.phase || 'Unknown',
        },
        'age',
        {
          id: 'version',
          label: 'Version',
          getValue: mp => mp.spec?.template?.spec?.version || '',
        },
      ]}
    />
  );
}
