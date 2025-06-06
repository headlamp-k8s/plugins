import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';

export function MachineHealthChecksList() {
  return (
    <ResourceListView
      title="Machine Health Checks"
      resourceClass={MachineHealthCheck}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: mhc => mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: mhc => (
            <Link
              routeName="capicluster"
              params={{
                name: mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: mhc.metadata?.namespace,
              }}
            >
              {mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'expectedMachines',
          label: 'Expected Machines',
          getValue: mhc => mhc.status?.expectedMachines,
        },
        {
          id: 'maxUnhealthy',
          label: 'Max Unhealthy',
          getValue: mhc => mhc.spec?.maxUnhealthy,
        },
        {
          id: 'currentHealthy',
          label: 'Current Healthy',
          getValue: mhc => mhc.status?.currentHealthy,
        },
        'age',
      ]}
    />
  );
}
