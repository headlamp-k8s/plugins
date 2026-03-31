import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachinePool } from '../../resources/machinepool';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { ScaleButton } from '../common/index';

interface MachinePoolsListWithDataProps {
  MachinePoolClass: typeof MachinePool;
}

function MachinePoolsListWithData({ MachinePoolClass }: MachinePoolsListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Pools"
      resourceClass={MachinePoolClass}
      actions={[{ id: 'scale', action: (item: any) => <ScaleButton item={item} /> }]}
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
      ]}
    />
  );
}

export function MachinePoolsList() {
  const version = useCapiApiVersion(MachinePool.crdName, 'v1beta1');
  const VersionedMachinePool = useMemo(
    () => (version ? MachinePool.withApiVersion(version) : MachinePool),
    [version]
  );
  if (!version) return <Loader title="Detecting MachinePool version" />;
  return <MachinePoolsListWithData MachinePoolClass={VersionedMachinePool} />;
}
