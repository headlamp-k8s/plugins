/** Kueue resource kinds that open their details in a side-panel activity. */
type KueueActivityKind = 'clusterqueue' | 'localqueue' | 'resourceflavor' | 'workload';

/**
 * Build a stable, collision-free activity ID for a Kueue resource side panel.
 *
 * Cluster, namespace and resource names can all contain hyphens, so joining them
 * with `-` is ambiguous (`team-a` + `queue` vs `team` + `a-queue`). Headlamp only
 * un-minimizes an existing activity when the ID matches, so an ambiguous ID would
 * reopen the wrong resource. JSON-encoding the identity fields keeps them distinct.
 *
 * @param kind - Kueue resource kind, kept as a readable prefix.
 * @param cluster - Cluster the resource belongs to.
 * @param identity - Namespace and name for namespaced resources, or just the name.
 */
export function getKueueActivityId(
  kind: KueueActivityKind,
  cluster: string | undefined,
  ...identity: string[]
): string {
  return `kueue-${kind}-${JSON.stringify([cluster ?? '', ...identity])}`;
}
