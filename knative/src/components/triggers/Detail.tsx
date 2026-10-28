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

import { KnativeTrigger } from '../../resources/knative';
import { DestinationLink } from '../common/DestinationLink';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';
import { BrokerLink } from './BrokerLink';
import { TriggerFilter } from './TriggerFilter';

/**
 * Shows one Knative Eventing Trigger: its Broker, its filter, its subscriber and the URI the
 * subscriber resolved to.
 *
 * @returns The Trigger detail page.
 */
export function TriggerDetail() {
  return (
    <EventingResourceDetail
      resourceType={KnativeTrigger}
      extraInfo={trigger => [
        { name: 'Broker', value: <BrokerLink trigger={trigger} /> },
        { name: 'Filter', value: <TriggerFilter spec={trigger.spec} />, valueFullRow: true },
        {
          name: 'Subscriber',
          value: (
            <DestinationLink
              destination={trigger.subscriber}
              namespace={trigger.getNamespace()}
              cluster={trigger.cluster}
            />
          ),
        },
        { name: 'Subscriber URI', value: <TextValue value={trigger.status?.subscriberUri} /> },
      ]}
    />
  );
}
