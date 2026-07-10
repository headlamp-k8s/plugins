export interface ClusterLike {
  metadata: {
    name: string;
    namespace?: string;
  };
}

/**
 * Extracts and sorts unique namespaces from a list of Kafka clusters.
 * Safely handles null/undefined inputs.
 */
export function getAvailableNamespaces(clusters: ClusterLike[] | null | undefined): string[] {
  if (!clusters) return [];
  const namespaces = clusters
    .map(k => k.metadata.namespace)
    .filter((ns): ns is string => typeof ns === 'string' && ns !== '');
  return [...new Set(namespaces)].sort();
}

/**
 * Filters Kafka clusters by namespace and returns their sorted names.
 * Safely handles null/undefined inputs.
 */
export function getFilteredClusterNames(
  clusters: ClusterLike[] | null | undefined,
  namespace: string | null | undefined
): string[] {
  if (!clusters || !namespace) return [];
  return clusters
    .filter(k => k.metadata.namespace === namespace)
    .map(k => k.metadata.name)
    .filter((name): name is string => typeof name === 'string' && name !== '')
    .sort();
}
