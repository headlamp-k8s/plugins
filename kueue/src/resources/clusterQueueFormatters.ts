/** Kubernetes condition status values used by ClusterQueue status conditions. */
type ConditionStatus = 'True' | 'False' | 'Unknown';

/** Minimal condition shape needed to summarize ClusterQueue readiness. */
export interface ClusterQueueConditionLike {
  /** Condition type, for example Active. */
  type: string;
  /** Kubernetes condition status for the condition type. */
  status: ConditionStatus;
  /** Optional machine-readable reason reported by Kueue. */
  reason?: string;
  /** Optional human-readable status message reported by Kueue. */
  message?: string;
}

/** Resource quota entry within a ClusterQueue flavor. */
export interface ResourceQuotaLike {
  /** Resource name, for example cpu or memory. */
  name: string;
  /** Guaranteed quota configured for this resource. */
  nominalQuota: string | number;
  /** Optional amount that can be borrowed from the cohort. */
  borrowingLimit?: string | number;
  /** Optional amount that can be lent to the cohort. */
  lendingLimit?: string | number;
}

/** ResourceFlavor quota entry within a ClusterQueue resource group. */
export interface FlavorQuotasLike {
  /** Referenced ResourceFlavor name. */
  name: string;
  /** Resource quota values configured for this flavor. */
  resources?: ResourceQuotaLike[];
}

/** Resource group entry from spec.resourceGroups. */
export interface ResourceGroupLike {
  /** Resources covered by this group, such as cpu and memory. */
  coveredResources?: string[];
  /** ResourceFlavors available for the covered resources. */
  flavors?: FlavorQuotasLike[];
}

/** Namespace selector used to decide where a ClusterQueue can admit workloads. */
export interface LabelSelectorLike {
  /** Exact label matches required by the selector. */
  matchLabels?: Record<string, string>;
  /** Set-based label requirements required by the selector. */
  matchExpressions?: Array<{
    /** Label key evaluated by the selector expression. */
    key: string;
    /** Kubernetes selector operator. */
    operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
    /** Optional values used by In and NotIn operators. */
    values?: string[];
  }>;
}

/** Preemption policy configured for a ClusterQueue. */
export interface ClusterQueuePreemptionLike {
  /** Reclaim policy for workloads within the same cohort. */
  reclaimWithinCohort?: string;
  /** Borrowing preemption policy within the same cohort. */
  borrowWithinCohort?: {
    /** Borrowing policy name. */
    policy?: string;
    /** Optional priority threshold for borrowing preemption. */
    maxPriorityThreshold?: number;
  };
  /** Preemption policy for workloads within this ClusterQueue. */
  withinClusterQueue?: string;
}

/** Admission check strategy configured for a ClusterQueue. */
export interface AdmissionChecksStrategyLike {
  /** Admission checks and optional flavor scopes. */
  admissionChecks?: Array<{
    /** AdmissionCheck resource name. */
    name: string;
    /** ResourceFlavor names this check applies to; empty means all flavors. */
    onFlavors?: string[];
  }>;
}

/** Flavor fungibility policy for borrowing and preemption decisions. */
export interface FlavorFungibilityLike {
  /** Policy for whether this ClusterQueue can borrow resources. */
  whenCanBorrow?: string;
  /** Policy for whether this ClusterQueue can preempt workloads. */
  whenCanPreempt?: string;
  /** Optional flavor preference policy. */
  preference?: string;
}

/** Status usage entry for a ResourceFlavor. */
export interface FlavorUsageLike {
  /** ResourceFlavor name reported by ClusterQueue status. */
  name: string;
  /** Resource usage values reported under this flavor. */
  resources?: Array<{
    /** Resource name, for example cpu or memory. */
    name: string;
    /** Total reserved or used quantity. */
    total?: string | number;
    /** Quantity currently borrowed from the cohort. */
    borrowed?: string | number;
  }>;
}

/** Fair sharing configuration for a ClusterQueue. */
export interface FairSharingLike {
  /** Optional queue weight used by Kueue fair sharing. */
  weight?: string | number;
}

/** Fair sharing status reported by Kueue. */
export interface FairSharingStatusLike {
  /** Current weighted share value reported in status. */
  weightedShare: number;
}

/** Concurrent admission migration policy configured for a ClusterQueue. */
export interface ConcurrentAdmissionPolicyLike {
  /** Optional migration settings for concurrent admission. */
  migration?: {
    /** Migration mode. */
    mode?: string;
    /** Optional constraints for migration behavior. */
    constraints?: {
      /** Last flavor name that is still acceptable during migration. */
      lastAcceptableFlavorName?: string;
    };
  };
}

/** Render the user-facing ClusterQueue status from its Active condition. */
export function renderClusterQueueStatus(activeCondition?: ClusterQueueConditionLike) {
  if (!activeCondition) {
    return 'Unknown';
  }

  if (activeCondition.status === 'True') {
    return 'Active';
  }

  if (activeCondition.status === 'False') {
    return 'Inactive';
  }

  return 'Unknown';
}

/** Return unique ResourceFlavor names referenced by ClusterQueue resource groups. */
export function getUniqueFlavorNames(resourceGroups: ResourceGroupLike[]) {
  const names = resourceGroups.flatMap(group => group.flavors?.map(flavor => flavor.name) || []);

  return Array.from(new Set(names)).filter(Boolean).sort();
}

/** Render a compact resource group and flavor count for ClusterQueue lists. */
export function renderResourceGroupsSummary(resourceGroups: ResourceGroupLike[]) {
  if (resourceGroups.length === 0) {
    return '-';
  }

  const flavorCount = resourceGroups.reduce(
    (count, group) => count + (group.flavors?.length || 0),
    0
  );
  const groupLabel = resourceGroups.length === 1 ? 'group' : 'groups';
  const flavorLabel = flavorCount === 1 ? 'flavor' : 'flavors';

  return `${resourceGroups.length} ${groupLabel}, ${flavorCount} ${flavorLabel}`;
}

/** Render a comma-separated list, falling back to '-' when empty. */
export function renderStringList(values: string[]) {
  return values.length > 0 ? values.join(', ') : '-';
}

/** Render a Kubernetes label selector as compact detail text. */
export function renderLabelSelector(selector?: LabelSelectorLike) {
  if (!selector) {
    return 'All namespaces';
  }

  const labels = Object.entries(selector.matchLabels || {}).map(
    ([key, value]) => `${key}=${value}`
  );
  const expressions = (selector.matchExpressions || []).map(expression => {
    const values = expression.values?.length ? ` (${expression.values.join(', ')})` : '';
    return `${expression.key} ${expression.operator}${values}`;
  });
  const parts = [...labels, ...expressions];

  return parts.length > 0 ? parts.join('; ') : 'All namespaces';
}

/** Render all resource groups and nested flavors as multiline detail text. */
export function renderResourceGroups(resourceGroups: ResourceGroupLike[]) {
  if (resourceGroups.length === 0) {
    return '-';
  }

  return resourceGroups
    .map((group, index) => {
      const resources = renderStringList(group.coveredResources || []);
      const flavors = (group.flavors || []).map(renderFlavorQuotas).join('; ') || '-';

      return `Group ${index + 1}: resources ${resources}; flavors ${flavors}`;
    })
    .join('\n');
}

/** Render one ResourceFlavor quota block for a resource group summary. */
function renderFlavorQuotas(flavor: FlavorQuotasLike) {
  const resources = (flavor.resources || []).map(renderResourceQuota).join(', ') || '-';

  return `${flavor.name} [${resources}]`;
}

/** Render one resource quota entry with nominal, borrow, and lend values. */
function renderResourceQuota(resource: ResourceQuotaLike) {
  const limits = [
    `nominal ${resource.nominalQuota}`,
    resource.borrowingLimit !== undefined ? `borrow ${resource.borrowingLimit}` : undefined,
    resource.lendingLimit !== undefined ? `lend ${resource.lendingLimit}` : undefined,
  ].filter(Boolean);

  return `${resource.name}: ${limits.join(', ')}`;
}

/** Render ClusterQueue conditions as multiline status text. */
export function renderConditions(conditions: ClusterQueueConditionLike[]) {
  if (conditions.length === 0) {
    return '-';
  }

  return conditions
    .map(condition => {
      const reason = condition.reason ? ` (${condition.reason})` : '';
      const message = condition.message ? `: ${condition.message}` : '';

      return `${condition.type}=${condition.status}${reason}${message}`;
    })
    .join('\n');
}

/** Render ClusterQueue preemption policies for the detail page. */
export function renderPreemption(preemption?: ClusterQueuePreemptionLike) {
  if (!preemption) {
    return '-';
  }

  const borrowWithinCohort = preemption.borrowWithinCohort
    ? [
        preemption.borrowWithinCohort.policy
          ? `policy ${preemption.borrowWithinCohort.policy}`
          : undefined,
        preemption.borrowWithinCohort.maxPriorityThreshold !== undefined
          ? `max priority ${preemption.borrowWithinCohort.maxPriorityThreshold}`
          : undefined,
      ]
        .filter(Boolean)
        .join(', ') || '-'
    : '-';

  return [
    `Reclaim within cohort: ${preemption.reclaimWithinCohort || '-'}`,
    `Borrow within cohort: ${borrowWithinCohort}`,
    `Within ClusterQueue: ${preemption.withinClusterQueue || '-'}`,
  ].join('; ');
}

/** Render admission checks and their flavor scopes for the detail page. */
export function renderAdmissionChecks(strategy?: AdmissionChecksStrategyLike) {
  const checks = strategy?.admissionChecks || [];

  if (checks.length === 0) {
    return '-';
  }

  return checks
    .map(check => {
      const flavors = check.onFlavors?.length ? check.onFlavors.join(', ') : 'all flavors';
      return `${check.name} (${flavors})`;
    })
    .join('; ');
}

/** Render ClusterQueue flavor fungibility settings for the detail page. */
export function renderFlavorFungibility(flavorFungibility?: FlavorFungibilityLike) {
  if (!flavorFungibility) {
    return '-';
  }

  return [
    flavorFungibility.whenCanBorrow
      ? `When can borrow: ${flavorFungibility.whenCanBorrow}`
      : undefined,
    flavorFungibility.whenCanPreempt
      ? `When can preempt: ${flavorFungibility.whenCanPreempt}`
      : undefined,
    flavorFungibility.preference ? `Preference: ${flavorFungibility.preference}` : undefined,
  ]
    .filter(Boolean)
    .join('; ');
}

/** Render ClusterQueue status usage or reservations grouped by flavor. */
export function renderFlavorUsage(flavorUsage?: FlavorUsageLike[]) {
  if (!flavorUsage?.length) {
    return '-';
  }

  return flavorUsage
    .map(flavor => {
      const resources = (flavor.resources || [])
        .map(resource => {
          const values = [
            resource.total !== undefined ? `total ${resource.total}` : undefined,
            resource.borrowed !== undefined ? `borrowed ${resource.borrowed}` : undefined,
          ].filter(Boolean);

          return `${resource.name}: ${values.join(', ') || '-'}`;
        })
        .join(', ');

      return `${flavor.name} [${resources || '-'}]`;
    })
    .join('; ');
}

/** Render ClusterQueue fair sharing configuration and status. */
export function renderFairSharing(
  fairSharing?: FairSharingLike,
  fairSharingStatus?: FairSharingStatusLike
) {
  const values = [
    fairSharing?.weight !== undefined ? `Weight: ${fairSharing.weight}` : undefined,
    fairSharingStatus?.weightedShare !== undefined
      ? `Weighted share: ${fairSharingStatus.weightedShare}`
      : undefined,
  ].filter(Boolean);

  return values.length > 0 ? values.join('; ') : '-';
}

/** Render ClusterQueue concurrent admission migration policy. */
export function renderConcurrentAdmissionPolicy(policy?: ConcurrentAdmissionPolicyLike) {
  if (!policy?.migration) {
    return '-';
  }

  const values = [
    policy.migration.mode ? `Mode: ${policy.migration.mode}` : undefined,
    policy.migration.constraints?.lastAcceptableFlavorName
      ? `Last acceptable flavor: ${policy.migration.constraints.lastAcceptableFlavorName}`
      : undefined,
  ].filter(Boolean);

  return values.length > 0 ? values.join('; ') : '-';
}
