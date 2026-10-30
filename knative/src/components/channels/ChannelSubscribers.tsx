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

import {
  EmptyContent,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import {
  type ChannelableStatus,
  type ChannelSubscriberStatus,
  type KnativeChannel,
  KnativeSubscription,
} from '../../resources/knative';
import { ReadyStatusLabel } from '../common/ReadyStatusLabel';
import { NamespacedResourceLink, TextValue } from '../common/ResourceListCells';

/** A channel of any kind, as the Subscriptions section reads it. */
type SubscribedChannel = Pick<KnativeChannel, 'cluster' | 'getNamespace'> & {
  /** What the channel reports; only its subscribers are read. */
  status?: Pick<ChannelableStatus, 'subscribers'>;
};

/**
 * Shows the state a Channel reports for each of its Subscriptions. Knative identifies them by UID,
 * so their names come from the Subscriptions in the Channel's namespace. A Subscription in another
 * namespace, which Knative allows with `cross-namespace-event-links`, is not found there, and its
 * subscriber shows the UID.
 *
 * @param props - The Channel and the subscriber states it reports.
 * @returns A table with one row per Subscription, and a note when the Subscriptions could not be
 * loaded.
 */
function SubscribersTable({
  channel,
  subscribers,
}: {
  /** The channel the subscribers belong to. */
  channel: SubscribedChannel;
  /** The subscriber states the Channel reports. */
  subscribers: ChannelSubscriberStatus[];
}) {
  const [subscriptions, error] = KnativeSubscription.useList({
    namespace: channel.getNamespace(),
    cluster: channel.cluster,
  });
  const namesByUid = new Map(
    (subscriptions ?? []).map(subscription => [subscription.metadata.uid, subscription.getName()])
  );

  return (
    <>
      {error && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Subscription names could not be loaded, so subscribers are shown by UID.
        </Typography>
      )}
      <SimpleTable
        data={subscribers}
        columns={[
          {
            label: 'Subscription',
            getter: (subscriber: ChannelSubscriberStatus) => {
              const name = subscriber.uid && namesByUid.get(subscriber.uid);
              if (!name) return <TextValue value={subscriber.uid} />;
              return (
                <NamespacedResourceLink
                  routeName={KnativeSubscription.detailsRoute}
                  name={name}
                  namespace={channel.getNamespace()}
                  cluster={channel.cluster}
                />
              );
            },
          },
          {
            label: 'Ready',
            getter: (subscriber: ChannelSubscriberStatus) => (
              <ReadyStatusLabel status={subscriber.ready ?? 'Unknown'} />
            ),
          },
          {
            label: 'Message',
            getter: (subscriber: ChannelSubscriberStatus) => (
              <TextValue value={subscriber.message} />
            ),
          },
        ]}
      />
    </>
  );
}

/**
 * Lists the Subscriptions to a channel of any kind, a Channel or a channel implementation, with
 * the state the channel reports for each. It looks up
 * their names only when the Channel reports any.
 *
 * @param props - The channel whose Subscriptions are shown.
 * @returns A section with one row per Subscription.
 */
export function ChannelSubscribers({
  channel,
}: {
  /** The channel to show. */
  channel: SubscribedChannel;
}) {
  const subscribers = channel.status?.subscribers;

  return (
    <SectionBox title="Subscriptions">
      {subscribers?.length ? (
        <SubscribersTable channel={channel} subscribers={subscribers} />
      ) : (
        <EmptyContent>This channel reports no subscribers.</EmptyContent>
      )}
    </SectionBox>
  );
}
