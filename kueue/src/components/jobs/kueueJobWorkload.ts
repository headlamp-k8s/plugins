interface ObjectWithOwners {
  metadata: { ownerReferences?: { uid: string }[] };
}

/**
 * Kinds whose Workloads Kueue creates for their Pods rather than for the object itself.
 * A Deployment's ReplicaSets carry the queue-name label from its Pod template.
 */
const POD_WORKLOAD_KINDS = ['Deployment', 'ReplicaSet'];

/** Whether Kueue makes one Workload per Pod for this kind, so the object has none of its own. */
export function hasPodWorkloads(kind: string) {
  return POD_WORKLOAD_KINDS.includes(kind);
}

/**
 * The Workloads that list the resource as an owner, which Kueue sets for every integration.
 * The job-uid label is not used, since it can name a parent of a Pod or be missing, as on
 * StatefulSet Workloads made through pod groups. A LeaderWorkerSet owns one per group.
 */
export function findOwnedWorkloads<T extends ObjectWithOwners>(workloads: T[], uid: string) {
  return workloads.filter(item => item.metadata.ownerReferences?.some(owner => owner.uid === uid));
}
