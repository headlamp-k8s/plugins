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

import { KnativeBroker } from '../../resources/knative';
import { DestinationLink } from '../common/DestinationLink';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { TextValue } from '../common/ResourceListCells';

/**
 * Shows one Knative Eventing Broker: its class, its address and the object with its settings.
 *
 * @returns The Broker detail page.
 */
export function BrokerDetail() {
  return (
    <EventingResourceDetail
      resourceType={KnativeBroker}
      extraInfo={broker => [
        { name: 'Class', value: <TextValue value={broker.brokerClass} /> },
        { name: 'Address', value: <TextValue value={broker.address} /> },
        {
          name: 'Config',
          value: (
            <DestinationLink
              destination={{ ref: broker.spec?.config }}
              namespace={broker.getNamespace()}
              cluster={broker.cluster}
            />
          ),
        },
      ]}
    />
  );
}
