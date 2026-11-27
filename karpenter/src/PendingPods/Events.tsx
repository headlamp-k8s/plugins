import { K8s } from '@kinvolk/headlamp-plugin/lib';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { PendingPodsRenderer } from './List';
import { matchPendingPodsToEvents } from './matchPendingPodsToEvents';

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

  const data = matchPendingPodsToEvents(pods, events);

  return <PendingPodsRenderer pods={data} />;
};
