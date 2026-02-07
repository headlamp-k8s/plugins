/**
 * Pure utility functions for the Cluster API plugin.
 * These functions contain no React/UI dependencies and are independently testable.
 */

/**
 * Formats the update strategy of a MachineDeployment into a human-readable string.
 */
export function formatUpdateStrategy(strategy?: {
  type: string;
  rollingUpdate?: { maxUnavailable?: number | string; maxSurge?: number | string };
}): string | null {
  if (!strategy) {
    return null;
  }

  if (strategy.type === 'RollingUpdate' && strategy.rollingUpdate) {
    return `RollingUpdate. Max unavailable: ${strategy.rollingUpdate.maxUnavailable}, max surge: ${strategy.rollingUpdate.maxSurge}`;
  }

  return strategy.type;
}

/**
 * Determines whether an item has replicas information to display.
 */
export function hasReplicas(spec?: { replicas?: number }, status?: { replicas?: number }): boolean {
  return spec?.replicas !== undefined || status?.replicas !== undefined;
}

/**
 * Extracts replica values from a CAPI resource's spec and status into a
 * flat dictionary suitable for display.
 */
export function getReplicaValues(
  spec?: { replicas?: number },
  status?: {
    replicas?: number;
    readyReplicas?: number;
    updatedReplicas?: number;
    availableReplicas?: number;
  }
): Record<string, string> | null {
  if (!hasReplicas(spec, status)) {
    return null;
  }

  const values: Record<string, string> = {
    Desired: String(spec?.replicas ?? 0),
    Ready: String(status?.readyReplicas ?? 0),
  };

  if (status?.updatedReplicas !== undefined) {
    values['Up to date'] = String(status.updatedReplicas);
  }
  if (status?.availableReplicas !== undefined) {
    values['Available'] = String(status.availableReplicas);
  }
  values['Total'] = String(status?.replicas ?? 0);

  return Object.keys(values).length > 0 ? values : null;
}

/**
 * Formats a rollout strategy for KubeadmControlPlane into a human-readable string.
 */
export function formatKCPRolloutStrategy(rolloutStrategy?: {
  type?: string;
  rollingUpdate?: { maxSurge?: number | string };
}): string | null {
  if (!rolloutStrategy) {
    return null;
  }

  if (rolloutStrategy.type === 'RollingUpdate' && rolloutStrategy.rollingUpdate) {
    return `RollingUpdate. Max surge: ${rolloutStrategy.rollingUpdate.maxSurge ?? 1}`;
  }

  return rolloutStrategy.type || null;
}
