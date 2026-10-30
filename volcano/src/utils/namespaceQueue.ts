import { QueueState } from '../resources/queue';

/**
 * Display helpers for Volcano NamespaceQueues.
 * @see https://github.com/volcano-sh/apis/blob/b23679438079d996d26dfc686bab05d43e8baf7f/pkg/apis/scheduling/v1beta1/types.go#L417
 */

/**
 * Returns the observed NamespaceQueue state, which is empty until the controller reports one.
 *
 * @param state Observed `status.state`, if any.
 * @returns The state, or `Unknown` when it is not set.
 */
export function getNamespaceQueueState(state?: QueueState): QueueState {
  return state || 'Unknown';
}

/**
 * Reports whether a NamespaceQueue is reclaimable. The scheduler treats an unset value as true.
 *
 * @param reclaimable `spec.reclaimable`, if any.
 * @returns `false` only when reclaiming is explicitly disabled.
 */
export function isNamespaceQueueReclaimable(reclaimable?: boolean): boolean {
  return reclaimable !== false;
}

/**
 * Returns the dequeue strategy of a NamespaceQueue. The CRD defaults it to `traverse`.
 *
 * @param strategy `spec.dequeueStrategy`, if any.
 * @returns The configured strategy, or `traverse` when it is not set.
 */
export function getNamespaceQueueDequeueStrategy(
  strategy?: 'fifo' | 'traverse'
): 'fifo' | 'traverse' {
  return strategy ?? 'traverse';
}

/**
 * Collects the distinct resource names used across several resource maps, in first-seen order.
 *
 * @param resourceMaps Resource maps such as capability, deserved, guarantee and allocated.
 * @returns Resource names present in at least one of the maps.
 */
export function getResourceNames(...resourceMaps: Array<Record<string, unknown> | undefined>) {
  return Array.from(new Set(resourceMaps.flatMap(resourceMap => Object.keys(resourceMap ?? {}))));
}
