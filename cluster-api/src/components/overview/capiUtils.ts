import { alpha, Theme } from '@mui/material/styles';
import { getCondition } from '../../resources/common';
import { matchCapiError } from './capiErrorDefinitions';
import { getPriorityErrorForCluster } from './clusterHealth';

export type ErrorSeverity = 'critical' | 'warning' | 'info';

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Returns a MUI theme color for the foreground colour that corresponds to
 * a CAPI error severity level.
 *
 * Usage:
 *   sx={{ color: getSeverityColor(theme, severity) }}
 *   style={{ color: getSeverityColor(theme, severity) }}
 */
export function getSeverityColor(theme: Theme, severity?: string): string {
  if (severity === 'critical') return theme.palette.error.main;
  if (severity === 'warning') return theme.palette.warning.main;
  return theme.palette.info.main;
}

/**
 * Returns a MUI theme color for the background fill that corresponds to a
 * CAPI error severity level — useful for tinted panels / banners.
 */
export function getSeverityBgColor(theme: Theme, severity?: string): string {
  if (severity === 'critical') return alpha(theme.palette.error.main, 0.1);
  if (severity === 'warning') return alpha(theme.palette.warning.main, 0.1);
  return alpha(theme.palette.info.main, 0.1);
}

/**
 * Returns a MUI theme color for the border colour that corresponds to a
 * CAPI error severity level.
 */
export function getSeverityBorderColor(theme: Theme, severity?: string): string {
  if (severity === 'critical') return theme.palette.error.main;
  if (severity === 'warning') return theme.palette.warning.main;
  return theme.palette.info.main;
}

/**
 * Maps a severity string to the `status` prop accepted by Headlamp's
 * <StatusLabel> component.
 */
export function getStatusLabelStateForSeverity(
  severity?: string
): '' | 'success' | 'error' | 'warning' {
  if (severity === 'critical') return 'error';
  if (severity === 'warning') return 'warning';
  return '';
}

/**
 * Returns a MUI theme color for the foreground colour that represents the
 * readiness ratio of a set of replicas.
 *
 *  100 %          → success
 *  50 % – 99 %   → info
 *  1 % – 49 %    → warning
 *  0 % or empty  → error  (or text.secondary when total === 0)
 */
export function getReadinessColor(ready: number, total: number, theme: Theme): string {
  if (total === 0) return theme.palette.text.secondary;
  const percent = getReadinessPercent(ready, total);
  if (percent === 0) return theme.palette.error.main;
  if (percent < 50) return theme.palette.warning.main;
  if (percent < 100) return theme.palette.info.main;
  return theme.palette.success.main;
}
/**
 * Derives the severity level for a resource condition.
 *
 * Priority:
 * 1. Matched known CAPI error severity.
 * 2. Warning if condition status is False.
 * 3. Info otherwise.
 *
 * @param item - Kubernetes resource object.
 * @param condition - Resource condition to evaluate.
 * @returns The derived severity level.
 */
export function getDerivedSeverity(item: any, condition?: any): ErrorSeverity {
  const matched = matchCapiError(item, condition);
  if (matched) return matched.severity;
  if (condition?.status === 'False') return 'warning';
  return 'info';
}
/**
 * Calculates the readiness percentage for a replica set.
 *
 * @param ready - Number of ready replicas.
 * @param total - Total desired replicas.
 * @returns Readiness percentage between 0 and 100.
 */
export function getReadinessPercent(ready: number, total: number): number {
  if (total === 0) return 0;
  return (ready / total) * 100;
}
/**
 * Determines whether a Kubernetes resource is considered ready based on its kind.
 *
 * Readiness logic varies by Cluster API resource type.
 *
 * @param item - Kubernetes resource object.
 * @param kind - Kubernetes resource kind.
 * @param allResourcesForMatching - Additional resources used for cluster error matching.
 * @returns True if the resource is considered ready, otherwise false.
 */
export function isResourceReadyByKind(
  item: any,
  kind: string,
  allResourcesForMatching: { className: string; items: any[] }[] = []
): boolean {
  switch (kind) {
    case 'Cluster':
      return getPriorityErrorForCluster(item, allResourcesForMatching) === null;
    case 'Machine':
      return item.status?.phase === 'Running';
    case 'MachineDeployment':
    case 'MachineSet':
    case 'MachinePool': {
      const desired = item.spec?.replicas ?? 0;
      const ready = item.status?.readyReplicas ?? 0;
      return desired > 0 && ready === desired;
    }
    case 'KubeadmControlPlane': {
      const desired = item.spec?.replicas ?? 0;
      const ready = item.status?.readyReplicas ?? 0;
      if (desired > 0) return ready === desired;
      const readyCond = getCondition(item.status?.conditions ?? item.conditions, 'Ready');
      return readyCond?.status === 'True';
    }
    default: {
      const readyCond = getCondition(item.status?.conditions ?? item.conditions, 'Ready');
      return readyCond?.status === 'True';
    }
  }
}
/**
 * Returns the infrastructure provider name for a Cluster resource.
 *
 * Example:
 *   DockerCluster -> Docker
 *   AWSCluster -> AWS
 *
 * @param cluster - Cluster resource object.
 * @returns Infrastructure provider name or '-' if unavailable.
 */
export function getInfrastructureProvider(cluster: any): string {
  const kind = cluster?.spec?.infrastructureRef?.kind;
  if (!kind) return '-';
  return kind.replace(/Cluster$/, '') || kind;
}

/**
 * Resolves the Cluster name associated with a resource.
 *
 * Lookup priority:
 * 1. cluster.x-k8s.io/cluster-name label
 * 2. spec.clusterName
 * 3. metadata.name
 *
 * @param item - Kubernetes resource object.
 * @returns Associated cluster name.
 */
export function getClusterNameForResource(item: any): string {
  return (
    item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ||
    item.spec?.clusterName ||
    item.metadata?.name ||
    ''
  );
}
/**
 * Determines the bootstrap provider used by a Cluster.
 *
 * Checks:
 * 1. KubeadmControlPlane resources
 * 2. MachineDeployments
 * 3. Cluster topology bootstrap configuration
 *
 * @param cluster - Cluster resource object.
 * @param machineDeployments - List of MachineDeployment resources.
 * @param kcps - List of KubeadmControlPlane resources.
 * @returns Bootstrap provider name or '-' if unavailable.
 */
export function getBootstrapKind(cluster: any, machineDeployments: any[], kcps: any[]): string {
  const clusterName = cluster.metadata.name;

  const clusterKcp = kcps?.find(
    k =>
      k.metadata.labels?.['cluster.x-k8s.io/cluster-name'] === clusterName ||
      k.metadata.ownerReferences?.some((owner: any) => owner.uid === cluster.metadata.uid)
  );

  if (clusterKcp) {
    if (clusterKcp.kind === 'KubeadmControlPlane') return 'Kubeadm';
    const kind = clusterKcp.spec?.machineTemplate?.bootstrap?.configRef?.kind;
    if (kind) return kind.replace(/ConfigTemplate$/, '');
  }

  const clusterMd = machineDeployments?.find(
    md => md.metadata.labels?.['cluster.x-k8s.io/cluster-name'] === clusterName
  );
  if (clusterMd) {
    const kind = clusterMd.spec?.template?.spec?.bootstrap?.configRef?.kind;
    if (kind) return kind.replace(/ConfigTemplate$/, '');
  }

  const topoBootstrap =
    cluster.spec?.topology?.controlPlane?.machineTemplate?.bootstrap?.configRef?.kind;
  if (topoBootstrap) return topoBootstrap.replace(/ConfigTemplate$/, '');

  return '-';
}
