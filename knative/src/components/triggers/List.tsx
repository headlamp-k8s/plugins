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
import { KnativeTrigger } from '../../resources/knative';
import { destinationColumn } from '../common/DestinationLink';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { getReadinessColumns } from '../common/ResourceListCells';
import { BrokerLink } from './BrokerLink';

/**
 * Lists the Knative Eventing Triggers in the selected clusters.
 *
 * @returns The Triggers list, or a banner when Knative Eventing is not installed.
 */
export function TriggersList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeTrigger> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'broker',
        label: 'Broker',
        getValue: item => item.broker?.name || '',
        render: item => <BrokerLink trigger={item} />,
      },
      destinationColumn('subscriber', 'Subscriber', item => item.subscriber),
      ...getReadinessColumns<KnativeTrigger>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return (
    <ResourceListView
      title="Triggers"
      resourceClass={KnativeTrigger}
      columns={columns}
      reflectInURL="knative-triggers"
      id="knative-triggers"
    />
  );
}
