import { CapiErrorDefinition, matchCapiError } from './capiErrorDefinitions';

export interface ClusterPriorityError {
  errorDef: CapiErrorDefinition;
  resource: any;
  condition?: any;
  conditionType?: string;
  message?: string;
}

// Hoisted to module scope — was previously defined inside getPriorityErrorForCluster.
interface Candidate {
  priority: number;
  errorDef: CapiErrorDefinition;
  resource: any;
  condition?: any;
}

const CONDITION_PRIORITY: Record<string, number> = {
  ControlPlaneReady: 1,
  ControlPlaneInitialized: 2,
  EtcdClusterHealthy: 3,
  CertificatesAvailable: 4,
  InfrastructureReady: 5,
  BootstrapReady: 6,
  Ready: 7,
  Available: 8,
  Failure: 0,
};

const NEGATIVE_CONDITIONS = new Set([
  'RollingOut',
  'Remediating',
  'ScalingDown',
  'ScalingUp',
  'Paused',
  'Deleting',
]);

export function isNegativeConditionType(type?: string): boolean {
  return !!type && NEGATIVE_CONDITIONS.has(type);
}

// Lower score = higher severity. Exported for use in sort comparators.
export function severityScore(severity: string): number {
  if (severity === 'critical') return 0;
  if (severity === 'warning') return 1;
  return 2;
}

function getConditions(item: any): any[] {
  return item?.status?.conditions ?? item?.conditions ?? [];
}

function getFailureReason(item: any): string | undefined {
  return item?.status?.failureReason ?? item?.failure?.failureReason;
}

function getFailureMessage(item: any): string | undefined {
  return item?.status?.failureMessage ?? item?.failure?.failureMessage ?? getFailureReason(item);
}

export function getDisplayableErrorConditions(item: any): any[] {
  const displayableConditions = getConditions(item).filter(
    (condition: any) =>
      !isNegativeConditionType(condition.type) &&
      (condition.status === 'False' || condition.status === 'Unknown')
  );

  const failureReason = getFailureReason(item);
  if (failureReason) {
    return [
      {
        type: 'Failure',
        status: 'False',
        reason: failureReason,
        message: getFailureMessage(item),
      },
      ...displayableConditions,
    ];
  }

  return displayableConditions;
}

export function getPriorityErrorForCluster(
  cluster: any,
  allResources: { className: string; items: any[] }[]
): ClusterPriorityError | null {
  const clusterName = cluster.metadata.name;
  const candidates: Candidate[] = [];

  for (const { items } of allResources) {
    for (const item of items) {
      const belongsToCluster =
        item.metadata?.name === clusterName ||
        item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] === clusterName ||
        item.metadata?.ownerReferences?.some((owner: any) => owner.uid === cluster.metadata.uid);

      if (!belongsToCluster) continue;

      const failureReason = getFailureReason(item);
      if (failureReason) {
        const syntheticCondition = {
          type: 'Failure',
          status: 'False',
          reason: failureReason,
          message: getFailureMessage(item),
        };
        const matched = matchCapiError(item, syntheticCondition);
        if (matched) {
          candidates.push({
            priority: 0,
            errorDef: matched,
            resource: item,
            condition: syntheticCondition,
          });
        }
      }

      for (const condition of getConditions(item)) {
        const isNegative = isNegativeConditionType(condition.type);
        if (isNegative) {
          if (condition.status !== 'True') continue;
        } else {
          if (condition.status !== 'False' && condition.status !== 'Unknown') continue;
        }

        const matched = matchCapiError(item, condition);
        if (matched) {
          candidates.push({
            priority: CONDITION_PRIORITY[condition.type] ?? 99,
            errorDef: matched,
            resource: item,
            condition,
          });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const diff = severityScore(a.errorDef.severity) - severityScore(b.errorDef.severity);
    return diff !== 0 ? diff : a.priority - b.priority;
  });

  const top = candidates[0];
  return {
    errorDef: top.errorDef,
    resource: top.resource,
    condition: top.condition,
    conditionType: top.condition?.type,
    message: top.condition?.message || top.condition?.reason,
  };
}

export function isClusterHealthy(
  cluster: any,
  allResources: { className: string; items: any[] }[]
): boolean {
  return getPriorityErrorForCluster(cluster, allResources) === null;
}
