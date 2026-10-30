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
  CHANNEL_CRD_LABEL_SELECTOR,
  GENERIC_CHANNEL_CRD_NAME,
  getKnativeChannelImplementationClass,
  KnativeChannelImplementation,
} from '../../resources/knative';
import { KNATIVE_CHANNEL_IMPLEMENTATION_KINDS } from '../../resources/knative/eventingData';
import { type DiscoveredKindsColumns, DiscoveredKindsList } from '../common/DiscoveredKindsList';
import { ownerColumn } from '../common/OwnerLink';
import { getReadinessColumns, TextValue } from '../common/ResourceListCells';

/**
 * Builds the columns of the channel implementations list.
 *
 * @param showClusterColumn - Whether more than one cluster is selected.
 * @returns The columns.
 */
function channelImplementationColumns(
  showClusterColumn: boolean
): DiscoveredKindsColumns<KnativeChannelImplementation> {
  return [
    'name',
    'namespace',
    ...(showClusterColumn ? (['cluster'] as const) : []),
    'kind',
    {
      id: 'address',
      label: 'Address',
      getValue: item => item.address || '',
      render: item => <TextValue value={item.address} />,
    },
    {
      id: 'subscribers',
      label: 'Subscribers',
      getValue: item => item.subscriberCount,
      render: item => <TextValue value={item.subscriberCount} />,
    },
    ownerColumn<KnativeChannelImplementation>(),
    ...getReadinessColumns<KnativeChannelImplementation>(),
    'age',
  ];
}

/**
 * Lists the Knative channel implementations of every kind in the selected clusters, such as
 * InMemoryChannels, KafkaChannels and NatsJetStreamChannels: the kinds whose CRD is labelled
 * `messaging.knative.dev/subscribable=true`, apart from the generic Channel, or Knative's own
 * InMemoryChannel where the CRDs cannot be listed.
 *
 * @returns The channel implementations list, or a banner when Knative Eventing is not installed.
 */
export function ChannelImplementationsList() {
  return (
    <DiscoveredKindsList
      title="Channel Implementations"
      id="knative-channel-implementations"
      labelSelector={CHANNEL_CRD_LABEL_SELECTOR}
      excludedCrds={[GENERIC_CHANNEL_CRD_NAME]}
      fallbackKinds={KNATIVE_CHANNEL_IMPLEMENTATION_KINDS}
      getKindClass={getKnativeChannelImplementationClass}
      columns={channelImplementationColumns}
      kindLabel="channel"
    />
  );
}
