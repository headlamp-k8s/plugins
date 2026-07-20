export type KafkaClusterRef = { metadata: { namespace?: string; name: string } };

// useList returns null while the query is loading, so every caller must
// tolerate a null cluster list.

/** Unique, sorted namespaces that contain at least one Kafka cluster. */
export function clusterNamespaces(clusters: KafkaClusterRef[] | null): string[] {
  const namespaces = (clusters ?? [])
    .map(cluster => cluster.metadata.namespace)
    .filter((namespace): namespace is string => Boolean(namespace));
  return [...new Set(namespaces)].sort();
}

/** Sorted names of the Kafka clusters that live in the given namespace. */
export function clusterNamesInNamespace(
  clusters: KafkaClusterRef[] | null,
  namespace: string
): string[] {
  if (!namespace) return [];
  return (clusters ?? [])
    .filter(cluster => cluster.metadata.namespace === namespace)
    .map(cluster => cluster.metadata.name)
    .sort();
}
