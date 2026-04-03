import {
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachinePool } from '../../resources/machinepool';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { getPhaseStatus } from '../common/util';

interface MachinePoolsListWithDataProps {
  MachinePoolClass: typeof MachinePool;
}

/**
 * Data-fetching wrapper for the machine pool list.
 *
 * @param props - Component properties.
 * @param props.MachinePoolClass - The machine pool resource class bound to a specific API version.
 */
function MachinePoolsListWithData({ MachinePoolClass }: MachinePoolsListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Pools"
      resourceClass={MachinePoolClass}
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

/**
 * Main entry point for the MachinePools list view.
 * Detects the CAPI version and renders the list with the correct resource class.
 */
export function MachinePoolsList() {
  const version = useCapiApiVersion(MachinePool.crdName, 'v1beta1');
  const VersionedMachinePool = useMemo(
    () => (version ? MachinePool.withApiVersion(version) : MachinePool),
    [version]
  );
  if (!version) return <Loader title="Detecting MachinePool version" />;
  return <MachinePoolsListWithData MachinePoolClass={VersionedMachinePool} />;
}
