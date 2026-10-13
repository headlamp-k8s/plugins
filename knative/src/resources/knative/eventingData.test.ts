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

import { formatDestination, getBrokerClass, getTriggerBroker } from './eventingData';

describe('Knative Eventing resource data', () => {
  it('reads the broker class annotation', () => {
    expect(
      getBrokerClass({
        annotations: { 'eventing.knative.dev/broker.class': 'MTChannelBasedBroker' },
      })
    ).toBe('MTChannelBasedBroker');
    expect(getBrokerClass({})).toBeUndefined();
  });

  it('finds the Broker a Trigger names in broker or brokerRef', () => {
    expect(getTriggerBroker({ broker: 'default' })).toEqual({ name: 'default' });
    expect(getTriggerBroker({ brokerRef: { kind: 'Broker', name: 'default' } })).toEqual({
      name: 'default',
      namespace: undefined,
    });
    expect(getTriggerBroker({ brokerRef: { name: 'default', namespace: 'shared' } })).toEqual({
      name: 'default',
      namespace: 'shared',
    });
    expect(getTriggerBroker({ brokerRef: { kind: 'Broker' } })).toBeUndefined();
    expect(getTriggerBroker({})).toBeUndefined();
    expect(getTriggerBroker(undefined)).toBeUndefined();
  });

  it('formats a destination from its reference, URI, or both', () => {
    const ref = { apiVersion: 'v1', kind: 'Service', name: 'event-display' };

    expect(formatDestination({ ref })).toBe('Service/event-display');
    expect(formatDestination({ uri: 'https://example.com/events' })).toBe(
      'https://example.com/events'
    );
    expect(formatDestination({ ref, uri: '/orders' })).toBe('Service/event-display (/orders)');
    expect(formatDestination({ ref: { name: 'event-display' } })).toBe('event-display');
    expect(formatDestination(undefined)).toBe('');
    expect(formatDestination({ ref: {}, uri: 'https://example.com/events' })).toBe(
      'https://example.com/events'
    );
  });
});
