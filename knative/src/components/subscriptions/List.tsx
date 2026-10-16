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
  ResourceListView,
  ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeSubscription } from '../../resources/knative';
import { formatDestination } from '../../resources/knative/eventingData';
import { DestinationLink } from '../common/DestinationLink';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { OwnerLink } from '../common/OwnerLink';
import { getReadinessColumns } from '../common/ResourceListCells';

/**
 * Lists the Knative Subscriptions in the selected clusters, including the ones a Broker creates
 * for its Triggers.
 *
 * @returns The Subscriptions list, or a banner when Knative Eventing is not installed.
 */
export function SubscriptionsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeSubscription> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'channel',
        label: 'Channel',
        getValue: item => formatDestination({ ref: item.spec?.channel }),
        render: item => (
          <DestinationLink
            destination={{ ref: item.spec?.channel }}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'subscriber',
        label: 'Subscriber',
        getValue: item => formatDestination(item.spec?.subscriber),
        render: item => (
          <DestinationLink
            destination={item.spec?.subscriber}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'reply',
        label: 'Reply',
        getValue: item => formatDestination(item.spec?.reply),
        render: item => (
          <DestinationLink
            destination={item.spec?.reply}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'owner',
        label: 'Owner',
        getValue: item => item.owner?.name || '',
        render: item => (
          <OwnerLink
            owner={item.owner}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      ...getReadinessColumns<KnativeSubscription>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return (
    <ResourceListView
      title="Subscriptions"
      resourceClass={KnativeSubscription}
      columns={columns}
      reflectInURL="knative-subscriptions"
      id="knative-subscriptions"
    />
  );
}
