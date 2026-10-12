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

export interface CohortMember {
  /** Name of the ClusterQueue belonging to the cohort. */
  name: string;
  /** Cohort name. */
  cohort: string;
}

export interface CohortTree {
  /** Cohort name. */
  name: string;
  /** Parent cohort name if any. */
  parentName?: string;
  /** Child cohorts belonging to this cohort. */
  children?: CohortTree[];
  /** ClusterQueues participating directly in this cohort. */
  members: CohortMember[];
}

/** Group ClusterQueues and Cohorts into hierarchical relationship trees. */
export function buildCohortTrees(
  clusterQueues: {
    metadata?: { name?: string };
    name?: string;
    cohortName?: string;
    cohort?: string;
    spec?: { cohortName?: string };
  }[],
  cohorts?: {
    metadata?: { name?: string };
    name?: string;
    parentName?: string;
    spec?: { parentName?: string };
  }[]
): CohortTree[] {
  const cohortMap = new Map<string, { members: CohortMember[]; parentName?: string }>();

  if (cohorts) {
    for (const c of cohorts) {
      const name = c.metadata?.name ?? c.name;
      if (name) {
        cohortMap.set(name, {
          members: [],
          parentName: (() => {
            const raw = c.spec?.parentName ?? c.parentName;
            return raw && raw !== '-' ? raw : undefined;
          })(),
        });
      }
    }
  }

  for (const cq of clusterQueues) {
    const cohort = cq.cohortName ?? cq.cohort ?? cq.spec?.cohortName;
    if (!cohort || cohort === '-') continue;

    const cqName = cq.metadata?.name ?? cq.name ?? '';
    if (!cqName) continue;

    if (!cohortMap.has(cohort)) {
      cohortMap.set(cohort, { members: [] });
    }
    cohortMap.get(cohort)!.members.push({
      name: cqName,
      cohort,
    });
  }

  const nodes = new Map<string, CohortTree>();
  for (const [name, data] of cohortMap.entries()) {
    nodes.set(name, {
      name,
      parentName: data.parentName,
      members: data.members,
      children: [],
    });
  }

  const roots: CohortTree[] = [];
  for (const node of nodes.values()) {
    if (node.parentName && nodes.has(node.parentName)) {
      nodes.get(node.parentName)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
