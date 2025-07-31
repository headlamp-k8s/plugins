import {
  HoverInfoLabel,
  SectionBox,
  ShowHideLabel,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { KubeEvent } from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';

/**
 * Used to fetch and display Kubernetes events filtered by source, reason, and kind.
 */
export interface ObjectEventListProps {
  /**
   * The reason for the Kubernetes event.
   */
  reason?: string;

  /**
   * The component or controller that generated the event (e.g., 'karpenter', 'kubelet').
   */
  source?: string;

  /**
   * The kind of the Kubernetes object the event is related to (e.g., 'Pod', 'Node').
   */
  kind?: string;

  /**
   * The title shown above the event table section.
   */
  title: string;
}

export default function CustomObjectEventList(props: ObjectEventListProps) {
  let fieldSelector = `source=${props.source},involvedObject.kind=${props.kind}`;

  if (props.reason !== '' && props.reason !== undefined) {
    fieldSelector += `,reason=${props.reason}`;
  }

  const [events] =
    Event.useList({
      fieldSelector: fieldSelector,
    }) ?? [];

  const eventList = (events || []).map((e: KubeEvent) => new Event(e));

  return (
    <SectionBox title={props.title}>
      <SimpleTable
        columns={[
          {
            label: 'Type',
            getter: item => item.type || '-',
          },
          {
            label: 'Reason',
            getter: item => item.reason || '-',
          },
          {
            label: 'From',
            getter: item => item.source.component || '-',
          },
          {
            label: props.kind === 'Pod' ? 'Pod' : 'Node',
            getter: item => item.jsonData.involvedObject?.name,
          },
          {
            label: 'Message',
            getter: item =>
              item && (
                <ShowHideLabel labelId={item?.metadata?.uid || ''}>
                  {item.message || '-'}
                </ShowHideLabel>
              ),
          },
          {
            label: 'Age',
            getter: item => {
              if (item.count > 1) {
                return `${timeAgo(item.lastOccurrence)} (${item.count} times over ${timeAgo(
                  item.firstOccurrence
                )})`;
              }
              const eventDate = timeAgo(item.lastOccurrence, { format: 'mini' });
              const label =
                item.count > 1
                  ? `${eventDate} ${item.count} since ${timeAgo(item.firstOccurrence)}`
                  : eventDate;

              return (
                <HoverInfoLabel
                  label={label}
                  hoverInfo={localeDate(item.lastOccurrence)}
                  icon="mdi:calendar"
                />
              );
            },
            sort: (n1: KubeEvent, n2: KubeEvent) =>
              new Date(n2.lastTimestamp).getTime() - new Date(n1.lastTimestamp).getTime(),
          },
        ]}
        data={eventList}
      />
    </SectionBox>
  );
}
