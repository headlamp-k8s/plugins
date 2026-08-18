import type { ClusterQueue } from './clusterQueue';

export interface CohortMember {
  /** Name of the ClusterQueue belonging to the cohort. */
  name: string;
  /** Cohort name. */
  cohort: string;
}

export interface CohortTree {
  /** Cohort name. */
  name: string;
  /** ClusterQueues participating in this cohort. */
  members: CohortMember[];
}

/** Group a list of ClusterQueues by their cohort name. */
export function buildCohortTrees(clusterQueues: ClusterQueue[]): CohortTree[] {
  const cohortMap = new Map<string, CohortMember[]>();

  for (const cq of clusterQueues) {
    const cohort = cq.cohort;
    if (!cohort || cohort === '-') continue;

    if (!cohortMap.has(cohort)) {
      cohortMap.set(cohort, []);
    }
    cohortMap.get(cohort)!.push({
      name: cq.metadata.name,
      cohort,
    });
  }

  return Array.from(cohortMap.entries()).map(([name, members]) => ({
    name,
    members,
  }));
}
