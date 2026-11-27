import { timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import type { PendingPod } from './Events';

const podKey = (namespace: string | undefined, name: string) => `${namespace ?? ''}/${name}`;

/**
 * Pairs pending pods with their events. Pods and events are matched by
 * namespace and name, because pod names are only unique within a namespace.
 */
export function matchPendingPodsToEvents(pods: any[], events: any[]): PendingPod[] {
  const podMap = new Map<string, PendingPod>();

  pods.forEach(pod => {
    podMap.set(podKey(pod.jsonData.metadata.namespace, pod.jsonData.metadata.name), {
      id: pod.jsonData.metadata.uid,
      name: pod.jsonData.metadata.name,
      type: '',
      source: '',
      namespace: pod.jsonData.metadata.namespace,
      reason: '',
      message: '',
      age: timeAgo(pod.metadata.creationTimestamp),
      count: 0,
      lastOccurrence: '',
      firstOccurrence: '',
    });
  });

  const podsWithEvents = new Map<string, PendingPod>();

  events.forEach(event => {
    const key = podKey(event.involvedObject.namespace, event.involvedObject.name);
    if (podMap.has(key)) {
      const pod = podMap.get(key)!;

      if (event.reason && event.message && event.type) {
        podsWithEvents.set(key, {
          ...pod,
          reason: event.reason,
          message: event.message,
          type: event.type,
          source: event.source?.component || '',
          count: event.count || 0,
          lastOccurrence: event.lastOccurrence || '',
          firstOccurrence: event.firstOccurrence || '',
        });
      }
    }
  });

  return Array.from(podsWithEvents.values());
}
