/** Minimal Cohort shape needed to derive parent-child relationships. */
export interface CohortRelationshipLike {
  /** Desired Cohort state. */
  spec?: {
    /** Optional parent Cohort name. */
    parentName?: string;
  };
}

/** Minimal ClusterQueue shape needed to derive Cohort membership. */
export interface ClusterQueueCohortRelationshipLike {
  /** Desired ClusterQueue state. */
  spec?: {
    /** Optional Cohort name this ClusterQueue belongs to. */
    cohortName?: string;
  };
}

/** Return Cohorts whose parentName points at the given Cohort. */
export function getChildCohorts<T extends CohortRelationshipLike>(
  cohorts: T[] | null | undefined,
  parentName?: string
) {
  if (!parentName) {
    return [];
  }

  return (cohorts || []).filter(cohort => cohort.spec?.parentName === parentName);
}

/** Return ClusterQueues whose cohortName points at the given Cohort. */
export function getCohortClusterQueues<T extends ClusterQueueCohortRelationshipLike>(
  clusterQueues: T[] | null | undefined,
  cohortName?: string
) {
  if (!cohortName) {
    return [];
  }

  return (clusterQueues || []).filter(clusterQueue => clusterQueue.spec?.cohortName === cohortName);
}

/** Group Cohorts by parentName in one pass for list relationship counts. */
export function groupChildCohortsByParent<T extends CohortRelationshipLike>(
  cohorts: T[] | null | undefined
) {
  const cohortsByParent = new Map<string, T[]>();

  for (const cohort of cohorts || []) {
    const parentName = cohort.spec?.parentName;

    if (!parentName) {
      continue;
    }

    const siblings = cohortsByParent.get(parentName) || [];
    siblings.push(cohort);
    cohortsByParent.set(parentName, siblings);
  }

  return cohortsByParent;
}

/** Group ClusterQueues by cohortName in one pass for list relationship counts. */
export function groupClusterQueuesByCohort<T extends ClusterQueueCohortRelationshipLike>(
  clusterQueues: T[] | null | undefined
) {
  const clusterQueuesByCohort = new Map<string, T[]>();

  for (const clusterQueue of clusterQueues || []) {
    const cohortName = clusterQueue.spec?.cohortName;

    if (!cohortName) {
      continue;
    }

    const members = clusterQueuesByCohort.get(cohortName) || [];
    members.push(clusterQueue);
    clusterQueuesByCohort.set(cohortName, members);
  }

  return clusterQueuesByCohort;
}
