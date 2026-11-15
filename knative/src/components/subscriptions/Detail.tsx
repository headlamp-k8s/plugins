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
import { KnativeSubscription } from '../../resources/knative';
import type { Destination } from '../../resources/knative/common';
import { DestinationLink } from '../common/DestinationLink';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';

/**
 * Shows one Knative Subscription: its Channel, its subscriber and reply destination, and the
 * endpoints Knative resolved for them.
 *
 * @returns The Subscription detail page.
 */
export function SubscriptionDetail() {
  return (
    <EventingResourceDetail
      resourceType={KnativeSubscription}
      extraInfo={subscription => {
        const link = (destination?: Destination) => (
          <DestinationLink
            destination={destination}
            namespace={subscription.getNamespace()}
            cluster={subscription.cluster}
          />
        );
        const resolved = subscription.status?.physicalSubscription;
        return [
          { name: 'Channel', value: link({ ref: subscription.spec?.channel }) },
          { name: 'Subscriber', value: link(subscription.spec?.subscriber) },
          { name: 'Reply', value: link(subscription.spec?.reply) },
          { name: 'Subscriber URI', value: <TextValue value={resolved?.subscriberUri} /> },
          { name: 'Reply URI', value: <TextValue value={resolved?.replyUri} /> },
          {
            name: 'Dead Letter Sink URI',
            value: <TextValue value={resolved?.deadLetterSinkUri} />,
          },
        ];
      }}
    />
  );
}
