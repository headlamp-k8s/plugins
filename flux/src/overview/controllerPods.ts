import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import type Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';

/**
 * Pods belonging to a controller Deployment, matched via the Deployment's
 * `spec.selector.matchLabels`.
 *
 * Only `matchLabels` is supported: Deployments installed by Flux use it
 * exclusively, and honouring `matchExpressions` would mean reimplementing the
 * full label-selector algebra for no practical gain here.
 *
 * Running pods are returned first so that the default selection is the one
 * most likely to have logs and to accept an exec session.
 */
export function getPodsForController(pods: Pod[] | null, controller: KubeObject): Pod[] {
  const matchLabels: Record<string, string> | undefined =
    controller?.jsonData?.spec?.selector?.matchLabels;
  const selector = Object.entries(matchLabels ?? {});

  // An empty selector would match every pod in the namespace, which is never
  // what the caller wants, so treat it as "no pods" rather than "all pods".
  if (!pods || selector.length === 0) {
    return [];
  }

  const matched = pods.filter(pod => {
    if (pod.metadata.namespace !== controller.metadata.namespace) {
      return false;
    }
    const labels = pod.metadata.labels ?? {};
    return selector.every(([key, value]) => labels[key] === value);
  });

  return matched.sort((a, b) => {
    const aRunning = a.status?.phase === 'Running' ? 0 : 1;
    const bRunning = b.status?.phase === 'Running' ? 0 : 1;
    return aRunning - bRunning || a.getName().localeCompare(b.getName());
  });
}

/** Names of the pod's regular containers, in spec order. */
export function containerNamesForPod(pod: Pod | undefined): string[] {
  return (pod?.spec?.containers ?? []).map(container => container.name);
}
