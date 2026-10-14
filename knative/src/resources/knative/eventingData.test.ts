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
  formatDestination,
  formatTriggerFilter,
  getBrokerClass,
  getTriggerBroker,
} from './eventingData';

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

describe('formatTriggerFilter', () => {
  it('reports all events when nothing is filtered', () => {
    expect(formatTriggerFilter(undefined)).toBe('All events');
    expect(formatTriggerFilter({})).toBe('All events');
    expect(formatTriggerFilter({ filter: {} })).toBe('All events');
    expect(formatTriggerFilter({ filter: { attributes: {} } })).toBe('All events');
    expect(formatTriggerFilter({ filters: [] })).toBe('All events');
  });

  it('formats the older attribute filter', () => {
    expect(
      formatTriggerFilter({ filter: { attributes: { type: 'order.created', source: '/shop' } } })
    ).toBe('type = order.created and source = /shop');
  });

  it('shows an attribute with an empty value as one that must be set', () => {
    expect(formatTriggerFilter({ filter: { attributes: { subject: '' } } })).toBe('subject is set');
  });

  it('uses filters instead of the older filter when both are set', () => {
    expect(
      formatTriggerFilter({
        filter: { attributes: { type: 'order.cancelled' } },
        filters: [{ exact: { type: 'order.created' } }],
      })
    ).toBe('type = order.created');
    expect(
      formatTriggerFilter({ filter: { attributes: { type: 'order.created' } }, filters: [{}] })
    ).toBe('All events');
  });

  it('falls back to the older filter when filters is empty', () => {
    expect(
      formatTriggerFilter({ filter: { attributes: { type: 'order.created' } }, filters: [] })
    ).toBe('type = order.created');
  });

  it('formats every filter dialect', () => {
    expect(
      formatTriggerFilter({
        filters: [
          { exact: { type: 'order.created' } },
          { prefix: { source: '/shop' } },
          { suffix: { subject: '.json' } },
          { all: [{ exact: { a: '1' } }, { exact: { b: '2' } }] },
          { any: [{ exact: { c: '3' } }, { exact: { d: '4' } }] },
          { not: { exact: { e: '5' } } },
          { cesql: "type LIKE 'order.%'" },
        ],
      })
    ).toBe(
      'type = order.created and source starts with /shop and subject ends with .json and ' +
        'all of (a = 1; b = 2) and any of (c = 3; d = 4) and not (e = 5) and ' +
        "CESQL type LIKE 'order.%'"
    );
  });

  it('requires every attribute of one expression', () => {
    expect(formatTriggerFilter({ filters: [{ exact: { a: '1', b: '2' } }] })).toBe(
      'a = 1 and b = 2'
    );
  });

  it('skips empty filter expressions', () => {
    expect(formatTriggerFilter({ filters: [{ exact: { type: 'order.created' } }, {}] })).toBe(
      'type = order.created'
    );
    expect(formatTriggerFilter({ filters: [{}] })).toBe('All events');
    expect(formatTriggerFilter({ filters: [{ all: [] }, { any: [{}] }] })).toBe('All events');
    expect(formatTriggerFilter({ filters: [{ not: {} }] })).toBe('All events');
  });

  it('skips expressions that Knative ignores because a name or value is empty', () => {
    expect(formatTriggerFilter({ filters: [{ exact: { type: 'a', source: '' } }] })).toBe(
      'All events'
    );
    expect(
      formatTriggerFilter({ filters: [{ prefix: { source: '' } }, { exact: { type: 'a' } }] })
    ).toBe('type = a');
    expect(formatTriggerFilter({ filters: [{ suffix: { '': '.json' } }] })).toBe('All events');
    expect(formatTriggerFilter({ filters: [{ not: { exact: { type: '' } } }] })).toBe('All events');
  });

  it('lets every event through an any that holds an expression that decides nothing', () => {
    const decidesNothing = { all: [{}] };
    expect(
      formatTriggerFilter({ filters: [{ any: [{ exact: { type: 'a' } }, decidesNothing] }] })
    ).toBe('All events');
    expect(
      formatTriggerFilter({
        filters: [{ not: { any: [{ exact: { type: 'a' } }, decidesNothing] } }],
      })
    ).toBe('not (type = a)');
    expect(
      formatTriggerFilter({
        filters: [{ any: [{ all: [{ exact: { type: 'a' } }, decidesNothing] }] }],
      })
    ).toBe('type = a');
  });

  it('treats an expression that decides nothing as no condition inside all', () => {
    const decidesNothing = { any: [{}] };
    expect(
      formatTriggerFilter({ filters: [{ all: [{ exact: { type: 'a' } }, decidesNothing] }] })
    ).toBe('type = a');
    expect(
      formatTriggerFilter({
        filters: [{ not: { all: [{ exact: { type: 'a' } }, decidesNothing] } }],
      })
    ).toBe('All events');
  });

  it('orders the members of all and any as Knative does, not as they are written', () => {
    expect(
      formatTriggerFilter({ filters: [{ any: [{ all: [{}] }, { exact: { type: 'a' } }] }] })
    ).toBe('All events');
    expect(
      formatTriggerFilter({
        filters: [{ not: { all: [{ any: [{}] }, { exact: { type: 'a' } }] } }],
      })
    ).toBe('All events');
  });

  it('reads only the first dialect of an expression, as Knative does', () => {
    expect(
      formatTriggerFilter({ filters: [{ exact: { type: 'a' }, prefix: { source: '/x' } }] })
    ).toBe('type = a');
  });
});
