import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';

/**
 * Returns the namespace an access check should be scoped to.
 *
 * A SelfSubjectAccessReview with no namespace asks whether the user holds the verb
 * cluster-wide. That is the right question for cluster-scoped resources and the wrong one
 * for namespaced resources, where a user granted access through a namespace-scoped
 * RoleBinding would be refused despite being able to read the resource.
 *
 * Cluster-scoped classes therefore always resolve to `undefined`, so a namespace passed by
 * mistake cannot narrow a check that is meant to be cluster-wide.
 */
export function resolveAuthNamespace(
  resourceClass: Pick<KubeObjectClass, 'isNamespaced'>,
  namespace?: string
): string | undefined {
  if (!resourceClass.isNamespaced) {
    return undefined;
  }

  return namespace || undefined;
}
