import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
          getValue: mhc => mhc.spec?.clusterName,
        },
        {
          id: 'expectedMachines',
          label: 'Expected Machines',
          getValue: mhc => mhc.status?.expectedMachines,
        },
        {
          id: 'maxHealthy',
          label: 'Max Healthy',
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
