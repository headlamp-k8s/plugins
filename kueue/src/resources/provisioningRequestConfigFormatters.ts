/** Retry strategy controlling how a ProvisioningRequest is retried on failure. */
export interface RetryStrategyLike {
  backoffLimitCount?: number;
  backoffBaseSeconds?: number;
  backoffMaxSeconds?: number;
}

/** Render the ProvisioningClass name, falling back when the API omits the field. */
export function renderProvisioningClassName(provisioningClassName?: string) {
  return provisioningClassName || '-';
}

/**
 * Render the resources managed by autoscaling as a comma-separated list. Kueue treats an
 * empty list as every resource being managed, so that reads as all rather than none.
 */
export function renderManagedResources(managedResources?: string[]) {
  return managedResources?.length ? managedResources.join(', ') : 'All resources';
}

/** Render the retry strategy as a short human-readable summary. */
export function renderRetryStrategy(retryStrategy?: RetryStrategyLike) {
  if (!retryStrategy) {
    return '-';
  }

  const parts: string[] = [];

  if (retryStrategy.backoffLimitCount !== undefined) {
    parts.push(`limit: ${retryStrategy.backoffLimitCount}`);
  }
  if (retryStrategy.backoffBaseSeconds !== undefined) {
    parts.push(`base: ${retryStrategy.backoffBaseSeconds}s`);
  }
  if (retryStrategy.backoffMaxSeconds !== undefined) {
    parts.push(`max: ${retryStrategy.backoffMaxSeconds}s`);
  }

  return parts.length > 0 ? parts.join(', ') : '-';
}

/** Render the pod set merge policy, falling back when the API omits the field. */
export function renderPodSetMergePolicy(podSetMergePolicy?: string) {
  return podSetMergePolicy || '-';
}
