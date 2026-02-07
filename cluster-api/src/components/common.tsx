import { MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeadmControlPlane } from '../resources/kubeadmcontrolplane';
import { MachineDeployment } from '../resources/machinedeployment';
import { MachinePool } from '../resources/machinepool';
import { MachineSet } from '../resources/machineset';
import { formatUpdateStrategy, getReplicaValues, hasReplicas } from '../utils';

export function renderUpdateStrategy(item: MachineDeployment) {
  return formatUpdateStrategy(item?.spec?.strategy);
}

export function showReplicas(
  item: KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool
) {
  return hasReplicas(item.spec, item.status);
}

export function renderReplicas(
  item: KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool
) {
  const values = getReplicaValues(item.spec, item.status);
  if (!values) {
    return null;
  }

  return (
    <MetadataDictGrid
      dict={values}
      gridProps={{
        direction: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}
    />
  );
}
