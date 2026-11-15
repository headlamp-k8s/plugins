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
import { KnativeChannel } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { getReadinessColumns, TextValue } from '../common/ResourceListCells';

/**
 * Lists the Knative Channels in the selected clusters.
 *
 * @returns The Channels list, or a banner when Knative Eventing is not installed.
 */
export function ChannelsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeChannel> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'backing',
        label: 'Backing Channel',
        getValue: item => item.backingKind || '',
        render: item => <TextValue value={item.backingKind} />,
      },
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
      ...getReadinessColumns<KnativeChannel>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return (
    <ResourceListView
      title="Channels"
      resourceClass={KnativeChannel}
      columns={columns}
      reflectInURL="knative-channels"
      id="knative-channels"
    />
  );
}
