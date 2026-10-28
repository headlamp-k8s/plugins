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

import { parse } from 'yaml';
import {
  formatDestination,
  formatTriggerFilter,
  getBrokerClass,
  getTriggerBroker,
} from './eventingData';
import type { KnativeTrigger } from './trigger';

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
  it('leaves the All events presentation to the caller when no conditions are configured', () => {
    for (const spec of [
      undefined,
      {},
      { filter: {} },
      { filter: { attributes: {} } },
      { filters: [] },
    ]) {
      expect(formatTriggerFilter(spec)).toBeUndefined();
    }
  });

  it('shows only the active filter when both forms are configured', () => {
    const filters = [{ exact: { type: 'order.created' } }];
    const filter = { attributes: { type: 'order.cancelled' } };

    expect(parse(formatTriggerFilter({ filter, filters })!)).toEqual({ filters });
    expect(parse(formatTriggerFilter({ filter, filters: [{}] })!)).toEqual({ filters: [{}] });
    expect(parse(formatTriggerFilter({ filter, filters: [] })!)).toEqual({ filter });
  });

  it('preserves legacy attribute filters including empty values', () => {
    const filter = { attributes: { type: 'order.created', subject: '' } };

    expect(parse(formatTriggerFilter({ filter })!)).toEqual({ filter });
  });

  it('indents nested expressions and preserves their order and repeated conditions', () => {
    const filters = [
      {
        all: [
          { exact: { type: 'order.created' } },
          { any: [{ prefix: { source: '/shop' } }, { suffix: { subject: '.json' } }] },
          { not: { exact: { tenant: 'internal' } } },
        ],
      },
      { exact: { type: 'order.created' } },
      { exact: { type: 'order.created' } },
    ];
    const yaml = formatTriggerFilter({ filters })!;

    expect(yaml).toContain('filters:\n  - all:\n      - exact:\n');
    expect(parse(yaml)).toEqual({ filters });
  });

  it.each<NonNullable<KnativeTrigger['spec']>>([
    { filters: [{}] },
    { filters: [{ all: [] }, { any: [{}] }, { not: {} }] },
    { filters: [{ any: [{ all: [{}] }, { exact: { type: 'a' } }] }] },
    { filters: [{ not: { all: [{ any: [{}] }, { exact: { type: 'a' } }] } }] },
    { filters: [{ exact: {} }, { cesql: '' }] },
    { filters: [{ exact: { type: 'a', source: '' } }, { suffix: { '': '.json' } }] },
    { filters: [{ exact: { type: 'a' }, prefix: { source: '/x' } }] },
  ])('preserves empty or incomplete expressions without interpreting them: %j', spec => {
    expect(parse(formatTriggerFilter(spec)!)).toEqual(spec);
  });

  it('preserves literal strings separately from conditions and CESQL expressions', () => {
    const spec = {
      filters: [
        { exact: { type: 'a and source = b', subject: 'a "quote"\\path\nline' } },
        { prefix: { source: '/shop' } },
        { cesql: "type = 'a' OR type = 'b'" },
      ],
    };

    expect(parse(formatTriggerFilter(spec)!)).toEqual(spec);
  });

  it('quotes strings that YAML would otherwise read as a different type', () => {
    const spec = { filter: { attributes: { type: 'true', source: '123', subject: 'null' } } };

    expect(parse(formatTriggerFilter(spec)!)).toEqual(spec);
  });

  it('omits unrelated Trigger configuration', () => {
    const filters = [{ exact: { type: 'order.created' } }];

    expect(
      parse(formatTriggerFilter({ broker: 'default', subscriber: { uri: '/sink' }, filters })!)
    ).toEqual({ filters });
  });
});
