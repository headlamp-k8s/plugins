import {
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachinePool } from '../../resources/machinepool';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { ScaleButton } from '../common/index';
import { getPhaseStatus } from '../common/util';

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
          id: 'ready',
          label: 'Ready',
          getValue: mp => `${mp.status?.readyReplicas ?? 0}/${mp.spec?.replicas ?? 0}`,
          render: mp => {
            const ready = mp.status?.readyReplicas ?? 0;
            const desired = mp.spec?.replicas ?? 0;
            const isReady = ready === desired && desired > 0;
            return (
              <StatusLabel status={isReady ? 'success' : 'warning'}>
                {ready}/{desired}
              </StatusLabel>
            );
          },
        },
        {
          id: 'uptodate',
          label: 'Up-to-date',
          getValue: mp => mp.upToDateReplicas ?? '-',
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: mp => mp.status?.phase,
          render: mp => {
            const phase = mp.status?.phase;
            if (!phase) return '-';
            return <StatusLabel status={getPhaseStatus(phase)}>{phase}</StatusLabel>;
          },
        },
        {
          id: 'available',
          label: 'Available',
          getValue: mp => mp.status?.availableReplicas ?? 0,
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
