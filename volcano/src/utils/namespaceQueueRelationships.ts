import { VolcanoNamespaceQueue } from '../resources/namespacequeue';

/**
 * Prefix of a NamespaceQueue `spec.parent` that refers to a cluster-scoped Queue.
 * @see https://github.com/volcano-sh/volcano/blob/ac7f6a4dfe30d992c3b293ea5974c646e3da5da7/pkg/util/queue_reference.go
 */
const clusterQueueParentPrefix = 'cluster/';

/**
 * Resolved target of a NamespaceQueue `spec.parent` reference.
 */
export type NamespaceQueueParentRef =
  | {
      /** The parent is a cluster-scoped Queue. */
      kind: 'queue';
      /** Queue name. */
      name: string;
    }
  | {
      /** The parent is another NamespaceQueue in the same namespace. */
      kind: 'namespacequeue';
      /** Namespace shared with the child NamespaceQueue. */
      namespace: string;
      /** NamespaceQueue name. */
      name: string;
    };

/**
 * Resolves the target of a NamespaceQueue `spec.parent` value.
 *
 * `cluster/<name>` refers to a cluster Queue. Any other value refers to a NamespaceQueue in the
 * same namespace as the child.
 *
 * @param namespace Namespace of the NamespaceQueue that holds the reference.
 * @param parent The `spec.parent` value, if any.
 * @returns The referenced queue, or `null` when the reference is empty or malformed.
 */
export function resolveNamespaceQueueParent(
  namespace: string,
  parent?: string
): NamespaceQueueParentRef | null {
  if (!parent) {
    return null;
  }

  if (parent.startsWith(clusterQueueParentPrefix)) {
    const name = parent.slice(clusterQueueParentPrefix.length);

    return name && !name.includes('/') ? { kind: 'queue', name } : null;
  }

  if (!namespace || parent.includes('/')) {
    return null;
  }

  return { kind: 'namespacequeue', namespace, name: parent };
}

/**
 * Reports whether a NamespaceQueue with the given namespace and name exists in a list.
 *
 * @param namespaceQueues Known NamespaceQueues, or `null` while they are still loading.
 * @param namespace Namespace of the NamespaceQueue to look for.
 * @param name Name of the NamespaceQueue to look for.
 * @returns `true` only when the list is loaded and contains a match.
 */
export function hasNamespaceQueue(
  namespaceQueues: VolcanoNamespaceQueue[] | null | undefined,
  namespace: string,
  name: string
): boolean {
  return (
    namespaceQueues?.some(
      namespaceQueue =>
        namespaceQueue.metadata.namespace === namespace && namespaceQueue.metadata.name === name
    ) ?? false
  );
}

/**
 * Finds the NamespaceQueues that use a cluster Queue as their direct parent.
 *
 * @param queueName Name of the cluster Queue.
 * @param namespaceQueues Candidate NamespaceQueues.
 * @returns NamespaceQueues whose parent is the given Queue.
 */
export function getChildNamespaceQueues(
  queueName: string,
  namespaceQueues: VolcanoNamespaceQueue[] | null | undefined
): VolcanoNamespaceQueue[] {
  return (namespaceQueues ?? []).filter(namespaceQueue => {
    const parent = resolveNamespaceQueueParent(
      namespaceQueue.metadata.namespace ?? '',
      namespaceQueue.spec.parent
    );

    return parent?.kind === 'queue' && parent.name === queueName;
  });
}
