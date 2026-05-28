import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();
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
            label: t('Type'),
            getter: item => item.type || '-',
          },
          {
            label: t('Reason'),
            getter: item => item.reason || '-',
          },
          {
            label: t('From'),
            getter: item => item.source.component || '-',
          },
          {
            label: props.kind === 'Pod' ? t('Pod') : t('Node'),
            getter: item => item.jsonData.involvedObject?.name,
          },
          {
            label: t('Message'),
            getter: item =>
              item && (
                <ShowHideLabel labelId={item?.metadata?.uid || ''}>
                  {item.message || '-'}
                </ShowHideLabel>
              ),
          },
          {
            label: t('Age'),
            getter: item => {
              if (item.count > 1) {
                return t('{{last}} ({{count}} times over {{first}})', {
                  last: timeAgo(item.lastOccurrence),
                  count: item.count,
                  first: timeAgo(item.firstOccurrence),
                });
              }
              const label = timeAgo(item.lastOccurrence, { format: 'mini' });

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
