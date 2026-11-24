/*
 * Copyright 2026 The Kubernetes Authors
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
  CHANNEL_IMPLEMENTATION_FAMILY,
  type KnativeChannelImplementation,
} from '../../resources/knative';
import { ChannelSubscribers } from '../channels/ChannelSubscribers';
import { getDeliveryRows } from '../common/DeliveryRows';
import { DiscoveredKindDetail } from '../common/DiscoveredKindDetail';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';
import { getSettingsRow } from '../common/SettingsRow';

export const CHANNEL_IMPLEMENTATION_DETAILS_PATH =
  '/knative/channel-implementations/:namespace?/:name';

/**
 * Shows one channel implementation of a known kind: its address, delivery settings, the settings
 * of its own kind, and its Subscriptions.
 *
 * @param props - The class of the channel's kind.
 * @returns The detail page.
 */
function ChannelImplementationPage({
  kindClass,
}: {
  /** The class of the channel's kind. */
  kindClass: typeof KnativeChannelImplementation;
}) {
  return (
    <EventingResourceDetail
      resourceType={kindClass}
      extraInfo={channel => [
        { name: 'Address', value: <TextValue value={channel.address} /> },
        ...getDeliveryRows(
          channel.spec?.delivery,
          channel.status?.deadLetterSinkUri,
          channel.getNamespace(),
          channel.cluster
        ),
        getSettingsRow(kindClass.kind, channel.settings),
      ]}
      extraSections={channel => [
        {
          id: 'knative.channel-implementation-subscriptions',
          section: <ChannelSubscribers channel={channel} />,
        },
      ]}
    />
  );
}

/**
 * Shows one channel implementation of any kind, such as a KafkaChannel or a NatsJetStreamChannel.
 * It reads the channel's CRD, named in the URL's `crd` query parameter, to know the kind; where the
 * CRD cannot be read it still shows Knative's own InMemoryChannel.
 *
 * @returns The detail page, or a message when the URL names no CRD or the CRD cannot be used.
 */
export function ChannelImplementationDetail() {
  return (
    <DiscoveredKindDetail
      family={CHANNEL_IMPLEMENTATION_FAMILY}
      kindLabel="channel implementation"
      page={ChannelImplementationPage}
    />
  );
}
