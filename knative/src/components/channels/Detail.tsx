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
import { KnativeChannel } from '../../resources/knative';
import { DestinationLink } from '../common/DestinationLink';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';
import { ChannelSubscribers } from './ChannelSubscribers';

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
          value: (
            <DestinationLink
              destination={{ ref: channel.status?.channel }}
              namespace={channel.getNamespace()}
              cluster={channel.cluster}
            />
          ),
        },
        { name: 'Address', value: <TextValue value={channel.address} /> },
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
