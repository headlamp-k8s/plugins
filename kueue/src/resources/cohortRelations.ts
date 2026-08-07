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
