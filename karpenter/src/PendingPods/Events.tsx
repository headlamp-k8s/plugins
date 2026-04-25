import { K8s } from '@kinvolk/headlamp-plugin/lib';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import { PendingPodsRenderer } from './List';

/**
 * Represents a pending Kubernetes pod with associated event information.
 * This interface combines pod metadata with relevant event details that
 * explain why the pod is in a pending state.
 */
export interface PendingPod {
  /**
   * The unique identifier of the pod (UID)
   */
  id: string;

  /**
   * The name of the pod
   */
  name: string;

  /**
   * The type of event associated with the pod
   */
  type: string;

  /**
   * The component that generated the event
   */
  source: string;

  /**
   * The namespace where the pod is located
   */
  namespace: string;

  /**
   * The reason for the event
   */
  reason: string;

  /**
   * Detailed message describing the event
   */
  message: string;

  /**
   * How long the pod has been pending
   */
  age: string;

  /**
   * Number of times this event has occurred
   */
  count: number;

  /**
   * Timestamp of when the event last occurred
   */
  lastOccurrence: any;

  /**
   * Timestamp of when the event first occurred
   */
  firstOccurrence: any;
}

export const PodEvents = (props: { reason: string; kind: string; phase: string }) => {
  const [events] = Event.useList({
    fieldSelector:
      `reason=${props.reason},involvedObject.kind=${props.kind},` +
      'involvedObject.fieldPath!=spec.initContainers{*}',
  });
  const [pods] = K8s.ResourceClasses.Pod.useList({
    fieldSelector: `status.phase=${props.phase}`,
  });

  if (!events || !pods) {
    return null;
  }

  const podMap = new Map<string, PendingPod>();

  pods.forEach(pod => {
    podMap.set(pod.jsonData.metadata.name, {
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
    const podName = event.involvedObject.name;
    if (podMap.has(podName)) {
      const pod = podMap.get(podName)!;

      if (event.reason && event.message && event.type) {
        podsWithEvents.set(podName, {
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

  const data = Array.from(podsWithEvents.values());

  return <PendingPodsRenderer pods={data} />;
};
