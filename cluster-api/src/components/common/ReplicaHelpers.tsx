import { MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachinePool } from '../../resources/machinepool';
import { MachineSet } from '../../resources/machineset';

export type ReplicaOwner = KubeadmControlPlane | MachineDeployment | MachineSet | MachinePool;
type ReplicaLike = {
  spec?: { replicas?: number };
  status?: {
    replicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    updatedReplicas?: number;
  };
  upToDateReplicas?: number;
};
export type RenderUpdateStrategy = MachineDeployment | KubeadmControlPlane;

export function showUpdateStrategy(item: RenderUpdateStrategy): boolean {
  const v1beta1Strategy = item.spec?.strategy;
  const v1beta2Strategy =
    (item.spec as any)?.rollout?.strategy ?? (item.spec as any)?.rolloutStrategy;
  return !!(v1beta1Strategy || v1beta2Strategy);
}

export function renderUpdateStrategy(item: RenderUpdateStrategy) {
  const strategy =
    item.spec?.strategy ??
    (item.spec as any)?.rollout?.strategy ??
    (item.spec as any)?.rolloutStrategy;

  if (!strategy?.type) return '-';

  if (strategy.type === 'RollingUpdate') {
    const r = strategy.rollingUpdate || {};

    const parts: string[] = [];

    if ('maxUnavailable' in r && r.maxUnavailable !== undefined) {
      parts.push(`maxUnavailable=${r.maxUnavailable}`);
    }

    if ('maxSurge' in r && r.maxSurge !== undefined) {
      parts.push(`maxSurge=${r.maxSurge}`);
    }

    return parts.length ? `RollingUpdate (${parts.join(', ')})` : 'RollingUpdate';
  }

  return strategy.type;
}

export function showReplicas(item: ReplicaOwner | ReplicaLike): boolean {
  return item.spec?.replicas !== undefined || item.status?.replicas !== undefined;
}

export function renderReplicas(item: ReplicaOwner | ReplicaLike) {
  if (!showReplicas(item)) return null;

  const status = item.status;
  const desired = item.spec?.replicas !== undefined ? String(item.spec.replicas) : '—';
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
    Desired: desired,
    Ready: String(ready),
  };

  if (upToDate !== undefined) {
    values['Up-to-date'] = String(upToDate);
  }
  if (available !== undefined) {
    values['Available'] = String(available);
  }

  values['Total'] = String(total);

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
