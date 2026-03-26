import { MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachinePool } from '../../resources/machinepool';
import { MachineSet } from '../../resources/machineset';

export type ReplicaOwner = KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool;

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

export function showReplicas(item: ReplicaOwner): boolean {
  return item.spec?.replicas !== undefined || item.status?.replicas !== undefined;
}

export function renderReplicas(item: ReplicaOwner) {
  if (!showReplicas(item)) return null;

  const status = item.status;
  const desired = item.spec?.replicas ?? 0;
  const total = status?.replicas ?? 0;
  const ready = status?.readyReplicas ?? 0;
  const available =
    status && 'availableReplicas' in status
      ? (status as { availableReplicas?: number }).availableReplicas
      : undefined;

  let upToDate: number | undefined;
  if ('upToDateReplicas' in item) {
    upToDate = (item as MachineSet).upToDateReplicas;
  } else if (status && 'updatedReplicas' in status) {
    upToDate = (status as { updatedReplicas?: number }).updatedReplicas;
  }

  const values: Record<string, string> = {
    Desired: String(desired),
    Ready: String(ready),
  };

  if (upToDate !== undefined) {
    values['Up-to-date'] = String(upToDate);
  }
  if (available !== undefined) {
    values['Available'] = String(available);
  }

  values['Total'] = String(total);

  if (Object.keys(values).length === 0) return null;

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
