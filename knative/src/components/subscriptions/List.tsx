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
import { destinationColumn } from '../common/DestinationLink';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { ownerColumn } from '../common/OwnerLink';
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
      destinationColumn('channel', 'Channel', item => ({
        ref: item.spec?.channel,
      })),
      destinationColumn('subscriber', 'Subscriber', item => item.spec?.subscriber),
      destinationColumn('reply', 'Reply', item => item.spec?.reply),
      ownerColumn<KnativeSubscription>(),
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
