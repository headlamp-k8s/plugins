/**
 * Per-kind health and "resolved values" summaries for the resources kro
 * creates on behalf of an instance. Pure functions over raw jsonData so
 * they stay testable and never throw on partial objects.
 */

export type HealthStatus = 'success' | 'error' | 'warning' | '';

export interface SubResourceHealth {
  status: HealthStatus;
  label: string;
}

interface KubeCondition {
  type?: string;
  status?: string;
}

function findCondition(resource: any, type: string): KubeCondition | undefined {
  const conditions = resource?.status?.conditions;
  if (!Array.isArray(conditions)) {
    return undefined;
  }
  return conditions.find((condition: KubeCondition) => condition?.type === type);
}

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

/** The RGD graph node id kro stamps on every sub-resource it creates. */
export function getNodeId(resource: any): string {
  return resource?.metadata?.labels?.['kro.run/node-id'] ?? '-';
}
