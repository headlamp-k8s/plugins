/**
 * Shared workload types used by the Kubeflow overview components.
 */
export interface OverviewWorkloadCondition {
  type?: string;
  status?: string;
}

/**
 * Minimal workload shape needed to render the overview tables.
 */
export interface OverviewWorkloadResource {
  metadata?: {
    name?: string;
    namespace?: string;
  };
  status?: {
    conditions?: OverviewWorkloadCondition[];
    phase?: string;
  };
}

/**
 * Returns a human-readable workload status for the overview dashboard.
 */
export function getStatus(resource: OverviewWorkloadResource): string {
  const conditions = resource.status?.conditions ?? [];

  if (conditions.length === 0 && !resource.status?.phase) {
    return 'Unknown';
  }

  const failedCondition = conditions.find(condition => {
    return condition.type === 'Failed' && condition.status === 'True';
  });
  if (failedCondition) {
    return 'Failed';
  }

  const runningCondition = conditions.find(condition => {
    return (
      (condition.type === 'Running' || condition.type === 'Ready') && condition.status === 'True'
    );
  });
  if (runningCondition) {
    return 'Running';
  }

  if (resource.status?.phase) {
    return resource.status.phase;
  }

  const latestCondition = conditions[conditions.length - 1];
  if (latestCondition?.status === 'True' && latestCondition.type) {
    return latestCondition.type;
  }

  return 'Pending';
}
