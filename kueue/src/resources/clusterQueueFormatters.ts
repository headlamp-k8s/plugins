type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface ClusterQueueConditionLike {
  type: string;
  status: ConditionStatus;
  reason?: string;
  message?: string;
}

export interface ResourceQuotaLike {
  name: string;
  nominalQuota: string | number;
  borrowingLimit?: string | number;
  lendingLimit?: string | number;
}

export interface FlavorQuotasLike {
  name: string;
  resources?: ResourceQuotaLike[];
}

export interface ResourceGroupLike {
  coveredResources?: string[];
  flavors?: FlavorQuotasLike[];
}

export interface LabelSelectorLike {
  matchLabels?: Record<string, string>;
  matchExpressions?: Array<{
    key: string;
    operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
    values?: string[];
  }>;
}

export interface ClusterQueuePreemptionLike {
  reclaimWithinCohort?: string;
  borrowWithinCohort?: {
    policy?: string;
    maxPriorityThreshold?: number;
  };
  withinClusterQueue?: string;
}

export interface AdmissionChecksStrategyLike {
  admissionChecks?: Array<{
    name: string;
    onFlavors?: string[];
  }>;
}

export interface FlavorFungibilityLike {
  whenCanBorrow?: string;
  whenCanPreempt?: string;
  preference?: string;
}

export interface FlavorUsageLike {
  name: string;
  resources?: Array<{
    name: string;
    total?: string | number;
    borrowed?: string | number;
  }>;
}

export interface FairSharingLike {
  weight?: string | number;
}

export interface FairSharingStatusLike {
  weightedShare: number;
}

export interface ConcurrentAdmissionPolicyLike {
  migration?: {
    mode?: string;
    constraints?: {
      lastAcceptableFlavorName?: string;
    };
  };
}

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

export function getUniqueFlavorNames(resourceGroups: ResourceGroupLike[]) {
  const names = resourceGroups.flatMap(group => group.flavors?.map(flavor => flavor.name) || []);

  return Array.from(new Set(names)).filter(Boolean).sort();
}

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

export function renderStringList(values: string[]) {
  return values.length > 0 ? values.join(', ') : '-';
}

export function renderLabelSelector(selector?: LabelSelectorLike) {
  if (!selector) {
    return '-';
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

function renderFlavorQuotas(flavor: FlavorQuotasLike) {
  const resources = (flavor.resources || []).map(renderResourceQuota).join(', ') || '-';

  return `${flavor.name} [${resources}]`;
}

function renderResourceQuota(resource: ResourceQuotaLike) {
  const limits = [
    `nominal ${resource.nominalQuota}`,
    resource.borrowingLimit !== undefined ? `borrow ${resource.borrowingLimit}` : undefined,
    resource.lendingLimit !== undefined ? `lend ${resource.lendingLimit}` : undefined,
  ].filter(Boolean);

  return `${resource.name}: ${limits.join(', ')}`;
}

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
