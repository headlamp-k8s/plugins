/**
 * Per-kind health and "resolved values" summaries for the resources kro
 * creates on behalf of an instance. Pure functions over raw jsonData so
 * they stay testable and never throw on partial objects.
 */

/** Health bucket for a sub-resource; '' means "no status to show". */
export type HealthStatus = 'success' | 'error' | 'warning' | '';

/** Health summary of one sub-resource. */
export interface SubResourceHealth {
  /** Status bucket driving badge color. */
  status: HealthStatus;
  /** Short human-readable label, e.g. "2/2 ready" or "Bound". */
  label: string;
}

interface KubeCondition {
  type?: string;
  status?: string;
}

/**
 * Find a status condition by type on a raw resource.
 *
 * @param resource - Raw jsonData of the resource; tolerates junk.
 * @param type - Condition type, e.g. "Ready".
 * @returns The condition, or undefined when absent/malformed.
 */
function findCondition(resource: any, type: string): KubeCondition | undefined {
  const conditions = resource?.status?.conditions;
  if (!Array.isArray(conditions)) {
    return undefined;
  }
  return conditions.find((condition: KubeCondition) => condition?.type === type);
}

/**
 * Compute a health summary for a sub-resource, per kind.
 *
 * @param kind - The resource kind, e.g. "Deployment".
 * @param resource - Raw jsonData; tolerates partial or null data.
 * @returns Health bucket and label; unknown kinds fall back to a Ready
 *   condition when present, else "Created".
 */
export function getSubResourceHealth(kind: string, resource: any): SubResourceHealth {
  switch (kind) {
    case 'Deployment': {
      const desired = resource?.spec?.replicas ?? 0;
      const ready = resource?.status?.readyReplicas ?? 0;
      return {
        status: desired > 0 && ready >= desired ? 'success' : 'error',
        label: `${ready}/${desired} ready`,
      };
    }
    case 'StatefulSet': {
      const desired = resource?.spec?.replicas ?? 0;
      const ready = resource?.status?.readyReplicas ?? 0;
      return {
        status: desired > 0 && ready >= desired ? 'success' : 'error',
        label: `${ready}/${desired} ready`,
      };
    }
    case 'PersistentVolumeClaim': {
      const phase = resource?.status?.phase ?? 'Unknown';
      return {
        status: phase === 'Bound' ? 'success' : phase === 'Lost' ? 'error' : 'warning',
        label: phase,
      };
    }
    case 'Job': {
      const succeeded = resource?.status?.succeeded ?? 0;
      const failed = resource?.status?.failed ?? 0;
      const active = resource?.status?.active ?? 0;
      if (succeeded > 0) {
        return { status: 'success', label: 'Succeeded' };
      }
      if (failed > 0) {
        return { status: 'error', label: `Failed (${failed})` };
      }
      if (active > 0) {
        return { status: 'warning', label: 'Running' };
      }
      return { status: 'warning', label: 'Pending' };
    }
    case 'Pod': {
      const phase = resource?.status?.phase ?? 'Unknown';
      return {
        status:
          phase === 'Running' || phase === 'Succeeded'
            ? 'success'
            : phase === 'Failed'
            ? 'error'
            : 'warning',
        label: phase,
      };
    }
    default: {
      // Generic fallback: a Ready condition when the resource reports one;
      // otherwise resources like ConfigMap/Service/Role are healthy by existing.
      const ready = findCondition(resource, 'Ready');
      if (ready) {
        return {
          status: ready.status === 'True' ? 'success' : 'error',
          label: ready.status === 'True' ? 'Ready' : 'Not Ready',
        };
      }
      return { status: 'success', label: 'Created' };
    }
  }
}

/**
 * The resolved, environment-specific values worth surfacing without a
 * click-through. This is the demo's portability proof: e.g. the same
 * instance YAML binds a different StorageClass per cloud.
 *
 * @param kind - The resource kind.
 * @param resource - Raw jsonData; tolerates partial or null data.
 * @returns A short comma-separated summary, or '' when the kind has
 *   nothing worth surfacing.
 */
export function getResolvedValues(kind: string, resource: any): string {
  switch (kind) {
    case 'PersistentVolumeClaim': {
      const storageClass = resource?.spec?.storageClassName || '(cluster default)';
      const capacity = resource?.status?.capacity?.storage;
      const parts = [`storageClass: ${storageClass}`];
      if (capacity) {
        parts.push(`capacity: ${capacity}`);
      }
      return parts.join(', ');
    }
    case 'Deployment':
    case 'StatefulSet': {
      const desired = resource?.spec?.replicas ?? 0;
      const ready = resource?.status?.readyReplicas ?? 0;
      return `replicas: ${ready}/${desired}`;
    }
    case 'Service': {
      const type = resource?.spec?.type || 'ClusterIP';
      const clusterIP = resource?.spec?.clusterIP;
      const parts = [`type: ${type}`];
      if (clusterIP && clusterIP !== 'None') {
        parts.push(`clusterIP: ${clusterIP}`);
      }
      return parts.join(', ');
    }
    case 'StorageClass': {
      const provisioner = resource?.provisioner;
      return provisioner ? `provisioner: ${provisioner}` : '';
    }
    case 'ConfigMap': {
      const keys = Object.keys(resource?.data ?? {});
      return keys.length > 0 ? `keys: ${keys.join(', ')}` : '';
    }
    default:
      return '';
  }
}

/**
 * The RGD graph node id kro stamps on every sub-resource it creates
 * (the kro.run/node-id label).
 *
 * @param resource - Raw jsonData of the resource.
 * @returns The node id, or "-" when the label is missing.
 * @see https://github.com/kubernetes-sigs/kro/blob/main/pkg/metadata/labels.go
 */
export function getNodeId(resource: any): string {
  return resource?.metadata?.labels?.['kro.run/node-id'] ?? '-';
}
