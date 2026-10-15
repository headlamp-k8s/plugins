/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KnativeChannel, KnativeSubscription } from '../../resources/knative';
import { formatDestination } from '../../resources/knative/eventingData';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';

/** The state a Channel reports for one of its Subscriptions. */
type SubscriberStatus = NonNullable<NonNullable<KnativeChannel['status']>['subscribers']>[number];

/**
 * Lists the Subscriptions to a Channel with the state the Channel reports for each. Knative
 * identifies them by UID, so their names come from the Subscriptions in the Channel's namespace.
 *
 * @param props - The Channel whose Subscriptions are shown.
 * @returns A section with one row per Subscription.
 */
export function ChannelSubscribers({
  channel,
}: {
  /** The Channel to show. */
  channel: KnativeChannel;
}) {
  const [subscriptions] = KnativeSubscription.useList({
    namespace: channel.getNamespace(),
    cluster: channel.cluster,
  });
  const namesByUid = new Map(
    (subscriptions ?? []).map(subscription => [subscription.metadata.uid, subscription.getName()])
  );

  return (
    <SectionBox title="Subscriptions">
      <SimpleTable
        data={channel.status?.subscribers ?? []}
        columns={[
          {
            label: 'Subscription',
            getter: (subscriber: SubscriberStatus) => {
              const name = subscriber.uid && namesByUid.get(subscriber.uid);
              if (!name) return <TextValue value={subscriber.uid} />;
              return (
                <Link
                  routeName={KnativeSubscription.detailsRoute}
                  params={{ namespace: channel.getNamespace(), name }}
                  activeCluster={channel.cluster}
                >
                  {name}
                </Link>
              );
            },
          },
          {
            label: 'Ready',
            getter: (subscriber: SubscriberStatus) => <TextValue value={subscriber.ready} />,
          },
          {
            label: 'Message',
            getter: (subscriber: SubscriberStatus) => <TextValue value={subscriber.message} />,
          },
        ]}
        emptyMessage="This Channel has no Subscriptions."
      />
    </SectionBox>
  );
}

/**
 * Shows one Knative Channel: its backing Channel, its address, and its Subscriptions.
 *
 * @returns The Channel detail page.
 */
export function ChannelDetail() {
  return (
    <EventingResourceDetail
      resourceType={KnativeChannel}
      extraInfo={channel => [
        {
          name: 'Backing Channel',
          value: <TextValue value={formatDestination({ ref: channel.status?.channel })} />,
        },
        { name: 'Address', value: channel.address || '-' },
      ]}
      extraSections={channel => [
        {
          id: 'knative.channel-subscriptions',
          section: <ChannelSubscribers channel={channel} />,
        },
      ]}
    />
  );
}
