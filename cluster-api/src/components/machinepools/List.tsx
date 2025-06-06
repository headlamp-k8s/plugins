import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
          id: 'phase',
          label: 'Phase',
          getValue: mp => mp.status?.phase || 'Unknown',
        },
        'age',
        // {
        //   id: 'version',
        //   label: 'Version',
        //   getValue: mp => mp.spec?.template?.spec?.version || 'N/A',
        // },
      ]}
    />
  );
}
