import type { ClusterTriggerAuthentication } from './resources/clusterTriggerAuthentication';
import type { ScaledJob } from './resources/scaledjob';
import type { ScaledObject } from './resources/scaledobject';
import type { TriggerAuthentication } from './resources/triggerAuthentication';

/**
 * Kinds an `authenticationRef` can name.
 *
 * These mirror the `kind` statics on TriggerAuthentication and
 * ClusterTriggerAuthentication. They are repeated here rather than imported so
 * that this module carries no runtime dependency on the resource classes, which
 * reach `@kinvolk/headlamp-plugin/lib/k8s/cluster`. That specifier is supplied
 * by Headlamp at runtime and is not resolvable on disk, so importing it here
 * would make this logic impossible to unit test.
 */
const TRIGGER_AUTHENTICATION_KIND = 'TriggerAuthentication';
const CLUSTER_TRIGGER_AUTHENTICATION_KIND = 'ClusterTriggerAuthentication';

/**
 * Build a map edge between two Kubernetes objects.
 *
 * The id is derived from both uids so it stays stable across renders and does
 * not collide with edges between other pairs.
 *
 * @param from - Source object.
 * @param to - Target object.
 * @returns An edge for the resource map.
 */
export const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

/**
 * Build map edges from a ScaledObject or ScaledJob to the authentications its
 * triggers reference.
 *
 * A trigger's `authenticationRef` carries a name and an optional kind, not a
 * uid, so the target is resolved by lookup rather than by ownerReference. A
 * TriggerAuthentication is matched on name within the source's own namespace;
 * a ClusterTriggerAuthentication is matched on name alone because it is
 * cluster scoped. `kind` defaults to TriggerAuthentication when omitted, which
 * mirrors KEDA's own default.
 *
 * @param sourceObject - The ScaledObject or ScaledJob holding the triggers.
 * @param triggerAuthentications - Namespaced authentications to match against;
 *   null while the list is still loading.
 * @param clusterTriggerAuthentications - Cluster-scoped authentications to
 *   match against; null while the list is still loading.
 * @returns One edge per trigger whose reference resolves. References that do
 *   not resolve are skipped, so a dangling ref yields no edge rather than a
 *   broken one.
 */
export const findAuthenticationEdges = (
  sourceObject: ScaledObject | ScaledJob,
  triggerAuthentications: TriggerAuthentication[],
  clusterTriggerAuthentications: ClusterTriggerAuthentication[]
) => {
  const edges = [];
  const { triggers } = sourceObject.spec;

  if (!triggers || !triggerAuthentications || !clusterTriggerAuthentications) {
    return edges;
  }

  triggers.forEach(trigger => {
    if (trigger.authenticationRef) {
      const authRefKind = trigger.authenticationRef.kind || TRIGGER_AUTHENTICATION_KIND;
      const authRefName = trigger.authenticationRef.name;

      let auth = null;
      if (authRefKind === TRIGGER_AUTHENTICATION_KIND) {
        auth = triggerAuthentications.find(
          auth =>
            auth.metadata.namespace === sourceObject.metadata.namespace &&
            auth.metadata.name === authRefName
        );
      } else if (authRefKind === CLUSTER_TRIGGER_AUTHENTICATION_KIND) {
        auth = clusterTriggerAuthentications.find(auth => auth.metadata.name === authRefName);
      }

      if (auth) {
        edges.push(makeKubeToKubeEdge(sourceObject, auth));
      }
    }
  });

  return edges;
};
