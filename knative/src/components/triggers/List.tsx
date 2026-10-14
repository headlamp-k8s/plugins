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
import { KnativeBroker, KnativeTrigger } from '../../resources/knative';
import { formatDestination } from '../../resources/knative/eventingData';
import { DestinationLink } from '../common/DestinationLink';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { OwnerLink } from '../common/OwnerLink';
import { getReadinessColumns } from '../common/ResourceListCells';

/**
 * Shows the Broker a Trigger takes events from.
 *
 * @param props - The Trigger whose Broker is shown.
 * @returns A link to the Broker named in `spec.broker` or `spec.brokerRef`, or an empty value when
 * neither is set.
 */
export function BrokerCell({
  trigger,
}: {
  /** The Trigger to show. */
  trigger: KnativeTrigger;
}) {
  const broker = trigger.broker;
  const owner = broker
    ? { apiVersion: KnativeBroker.apiVersion, kind: KnativeBroker.kind, name: broker.name }
    : undefined;

  return (
    <OwnerLink
      owner={owner}
      namespace={broker?.namespace || trigger.metadata.namespace}
      cluster={trigger.cluster}
    />
  );
}

/**
 * Shows where a Trigger sends its events.
 *
 * @param props - The Trigger whose subscriber is shown.
 * @returns A link to the subscriber, or its name or URI as text when it cannot be linked.
 */
function SubscriberCell({
  trigger,
}: {
  /** The Trigger to show. */
  trigger: KnativeTrigger;
}) {
  return (
    <DestinationLink
      destination={trigger.subscriber}
      namespace={trigger.metadata.namespace}
      cluster={trigger.cluster}
    />
  );
}

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
        render: item => <BrokerCell trigger={item} />,
      },
      {
        id: 'subscriber',
        label: 'Subscriber',
        getValue: item => formatDestination(item.subscriber),
        render: item => <SubscriberCell trigger={item} />,
      },
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
