import { MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeadmControlPlane } from '../resources/kubeadmcontrolplane';
import { MachineDeployment } from '../resources/machinedeployment';
import { MachinePool } from '../resources/machinepool';
import { MachineSet } from '../resources/machineset';

export function renderUpdateStrategy(item: MachineDeployment) {
  if (!item?.spec?.strategy) {
    return null;
  }

  if (item.spec.strategy.type === 'RollingUpdate') {
    const rollingUpdate = item.spec.strategy.rollingUpdate;
    return `RollingUpdate. Max unavailable: ${rollingUpdate.maxUnavailable}, max surge: ${rollingUpdate.maxSurge}`;
  }

  return item.spec.strategy.type;
}

export function showReplicas(
  item: KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool
) {
  return item.spec?.replicas !== undefined || item.status?.replicas !== undefined;
}

export function renderReplicas(
  item: KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool
) {
  if (!showReplicas(item)) {
    return null;
  }

  let values: { [key: string]: string } = {
    Desired: String(item.spec?.replicas || 0),
    Ready: String(item.status?.readyReplicas || 0),
  };

  // Type guard for updatedReplicas
  if (
    item.status &&
    Object.prototype.hasOwnProperty.call(item.status, 'updatedReplicas') &&
    (item.status as { updatedReplicas?: number }).updatedReplicas !== undefined
  ) {
    values['Up to date'] = String(
      (item.status as { updatedReplicas?: number }).updatedReplicas || 0
    );
  }
  // Type guard for availableReplicas
  if (
    item.status &&
    Object.prototype.hasOwnProperty.call(item.status, 'availableReplicas') &&
    (item.status as { availableReplicas?: number }).availableReplicas !== undefined
  ) {
    values['Available'] = String(
      (item.status as { availableReplicas?: number }).availableReplicas || 0
    );
  }
  values['Total'] = String(item.status?.replicas || 0);

  const validEntries = Object.entries(values).filter(
    ([key]: string[]) => values[key] !== undefined
  );
  values = Object.fromEntries(validEntries);

  if (Object.values(values).length === 0) {
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
