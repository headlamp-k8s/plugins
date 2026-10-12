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
  /** Whether this cohort participates in a cyclic dependency in the cohort hierarchy. */
  isCycle?: boolean;
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

  // Ensure implicit parent Cohorts referenced only by spec.parentName have placeholder nodes
  for (const node of Array.from(nodes.values())) {
    if (node.parentName && !nodes.has(node.parentName)) {
      nodes.set(node.parentName, {
        name: node.parentName,
        members: [],
        children: [],
      });
    }
  }

  // Detect cycles in Cohort parentName relationships
  const state = new Map<string, 0 | 1 | 2>(); // 0: unvisited, 1: visiting, 2: visited
  const cycleEdges = new Set<string>(); // "childName->parentName" edges to break

  for (const startNode of nodes.values()) {
    if (state.get(startNode.name) === 2) continue;

    const path: string[] = [];
    const pathIndexMap = new Map<string, number>();
    let curr: string | undefined = startNode.name;

    while (curr) {
      const currState = state.get(curr);
      if (currState === 1) {
        // Cycle detected
        const cycleStartIndex = pathIndexMap.get(curr)!;
        const cycle = path.slice(cycleStartIndex);

        for (const name of cycle) {
          const node = nodes.get(name);
          if (node) {
            node.isCycle = true;
          }
        }

        // Pick a deterministic representative root (lexicographically smallest name)
        const sortedCycle = [...cycle].sort();
        const repRoot = sortedCycle[0];

        // Break the edge that attaches repRoot to its parent within the cycle
        const repNode = nodes.get(repRoot);
        if (repNode?.parentName) {
          cycleEdges.add(`${repRoot}->${repNode.parentName}`);
        }
        break;
      }

      if (currState === 2) {
        break;
      }

      state.set(curr, 1);
      pathIndexMap.set(curr, path.length);
      path.push(curr);

      const currNode = nodes.get(curr);
      const parentName = currNode?.parentName;
      if (parentName && nodes.has(parentName)) {
        curr = parentName;
      } else {
        curr = undefined;
      }
    }

    for (const name of path) {
      state.set(name, 2);
    }
  }

  const roots: CohortTree[] = [];
  for (const node of nodes.values()) {
    if (node.parentName && nodes.has(node.parentName)) {
      const edgeKey = `${node.name}->${node.parentName}`;
      if (cycleEdges.has(edgeKey)) {
        roots.push(node);
      } else {
        nodes.get(node.parentName)!.children!.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
