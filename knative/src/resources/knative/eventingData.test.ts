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

import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import type { QueryListResponse } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/hooks';
import type { KubeCRD } from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { parse } from 'yaml';
import {
  findKnownKind,
  formatDestination,
  formatTriggerFilter,
  getBrokerClass,
  getClustersWithoutCrds,
  getCrdKindInfo,
  getPreferredApiVersion,
  getTriggerBroker,
  hasEveryClusterAnswered,
  isClusterError,
} from './eventingData';
import type { KnativeTrigger } from './trigger';

describe('Knative Eventing resource data', () => {
  it('picks the stored version when it is served, otherwise the first served one', () => {
    /**
     * Builds a CRD version.
     *
     * @param name - The version's name.
     * @param served - Whether the version is served.
     * @param storage - Whether the CRD stores this version.
     * @returns The version.
     */
    const version = (name: string, served: boolean, storage: boolean) => ({
      name,
      served,
      storage,
      additionalPrinterColumns: [],
    });
    const group = 'sources.knative.dev';

    expect(
      getPreferredApiVersion({
        group,
        versions: [version('v1beta2', true, false), version('v1', true, true)],
      })
    ).toBe('sources.knative.dev/v1');
    expect(
      getPreferredApiVersion({
        group,
        versions: [version('v1alpha1', false, true), version('v1beta1', true, false)],
      })
    ).toBe('sources.knative.dev/v1beta1');
    expect(
      getPreferredApiVersion({ group, versions: [version('v1', false, true)] })
    ).toBeUndefined();
  });

  it('reads what a Source class needs from a Source CRD', () => {
    const crd = {
      apiVersion: 'apiextensions.k8s.io/v1',
      kind: 'CustomResourceDefinition',
      metadata: { name: 'pingsources.sources.knative.dev', uid: 'crd', creationTimestamp: '' },
      spec: {
        group: 'sources.knative.dev',
        version: 'v1',
        names: { plural: 'pingsources', singular: 'pingsource', kind: 'PingSource', listKind: '' },
        scope: 'Namespaced',
        versions: [{ name: 'v1', served: true, storage: true, additionalPrinterColumns: [] }],
      },
    };

    expect(getCrdKindInfo(crd)).toEqual({
      kind: 'PingSource',
      apiName: 'pingsources',
      apiVersion: 'sources.knative.dev/v1',
      isNamespaced: true,
    });
    expect(
      getCrdKindInfo({
        ...crd,
        spec: {
          ...crd.spec,
          scope: 'Cluster',
          versions: [{ ...crd.spec.versions[0], served: false }],
        },
      })
    ).toBeUndefined();
  });

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

/**
 * Builds a KafkaChannel CRD that serves the given versions.
 *
 * @param versions - The served versions; the first is the stored one.
 * @returns The CRD.
 */
function kafkaChannelCrd(versions: string[]): KubeCRD {
  return {
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: { name: 'kafkachannels.messaging.knative.dev', uid: 'uid-1', creationTimestamp: '' },
    spec: {
      group: 'messaging.knative.dev',
      version: versions[0],
      names: {
        plural: 'kafkachannels',
        singular: 'kafkachannel',
        kind: 'KafkaChannel',
        listKind: 'KafkaChannelList',
      },
      scope: 'Namespaced',
      versions: versions.map((name, index) => ({
        name,
        served: true,
        storage: index === 0,
        additionalPrinterColumns: [],
      })),
    },
  };
}

const kafkaChannel = {
  kind: 'KafkaChannel',
  apiName: 'kafkachannels',
  apiVersion: 'messaging.knative.dev/v1',
  isNamespaced: true,
};

const inMemoryChannel = {
  kind: 'InMemoryChannel',
  apiName: 'inmemorychannels',
  apiVersion: 'messaging.knative.dev/v1',
  isNamespaced: true,
};

describe('getClustersWithoutCrds', () => {
  it('finds the clusters with no CRD found and an error for that cluster', () => {
    expect(
      getClustersWithoutCrds(
        ['a', 'b', 'c'],
        [{ cluster: 'a' }],
        [{ cluster: 'a' }, { cluster: 'b' }]
      )
    ).toEqual(['b']);
  });

  it('counts an error that names no cluster against every cluster with no CRD', () => {
    expect(getClustersWithoutCrds(['a', 'b'], [{ cluster: 'a' }], [{}])).toEqual(['b']);
  });

  it('finds none when nothing failed', () => {
    expect(getClustersWithoutCrds(['a', 'b'], [], null)).toEqual([]);
  });
});

describe('isClusterError', () => {
  it("counts an error as a cluster's when it names that cluster or names none", () => {
    expect(isClusterError({ cluster: 'a' }, 'a')).toBe(true);
    expect(isClusterError({}, 'a')).toBe(true);
    expect(isClusterError({ cluster: 'b' }, 'a')).toBe(false);
  });
});

describe('hasEveryClusterAnswered', () => {
  const answered: QueryListResponse<unknown, unknown, ApiError> = {
    data: null,
    error: null,
    errors: null,
    items: [],
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
  };

  it('waits for a cluster with neither a result nor an error of its own', () => {
    expect(hasEveryClusterAnswered(['a', 'b'], { a: answered }, [{ cluster: 'a' }])).toBe(false);
  });

  it('counts a result or an error as an answer', () => {
    expect(hasEveryClusterAnswered(['a', 'b'], { a: answered }, [{ cluster: 'b' }])).toBe(true);
  });

  it('counts an error that names no cluster as the answer of every cluster', () => {
    expect(hasEveryClusterAnswered(['a', 'b'], {}, [{}])).toBe(true);
  });
});

describe('findKnownKind', () => {
  it('lists a kind at the version its CRD stores, in the clusters where it is installed', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1beta1', 'v1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v1beta1', 'v1']) },
        ],
        [],
        [inMemoryChannel]
      )
    ).toEqual({
      info: { ...kafkaChannel, apiVersion: 'messaging.knative.dev/v1beta1' },
      clusters: ['a', 'b'],
      clustersLeftOut: [],
    });
  });

  it('lists a kind that is not installed nowhere', () => {
    expect(findKnownKind(kafkaChannel, [], ['c'], [inMemoryChannel])).toEqual({
      info: kafkaChannel,
      clusters: [],
      clustersLeftOut: [],
    });
  });

  it("still lists Knative's own kinds in the clusters whose CRDs could not be listed", () => {
    expect(findKnownKind(inMemoryChannel, [], ['c'], [inMemoryChannel])).toEqual({
      info: inMemoryChannel,
      clusters: ['c'],
      clustersLeftOut: [],
    });
  });

  it('does not list a kind whose CRD serves no version', () => {
    const crd = kafkaChannelCrd(['v1beta1']);
    crd.spec.versions[0].served = false;

    expect(findKnownKind(kafkaChannel, [{ cluster: 'a', jsonData: crd }], [], [])).toEqual({
      info: kafkaChannel,
      clusters: [],
      clustersLeftOut: [],
    });
  });

  it('lists a kind at a version every cluster with its CRD serves', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1', 'v1beta1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v1beta1']) },
        ],
        [],
        []
      )
    ).toEqual({
      info: { ...kafkaChannel, apiVersion: 'messaging.knative.dev/v1beta1' },
      clusters: ['a', 'b'],
      clustersLeftOut: [],
    });
  });

  it('lists a kind at a shared version that no cluster prefers', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1', 'v1beta1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v2', 'v1beta1']) },
        ],
        [],
        []
      )
    ).toEqual({
      info: { ...kafkaChannel, apiVersion: 'messaging.knative.dev/v1beta1' },
      clusters: ['a', 'b'],
      clustersLeftOut: [],
    });
  });

  it('lists a kind at the newest of several shared versions', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1', 'v1alpha1', 'v1beta1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v2', 'v1alpha1', 'v1beta1']) },
        ],
        [],
        []
      ).info.apiVersion
    ).toBe('messaging.knative.dev/v1beta1');
  });

  it('lists a kind at the version the most clusters serve, and names the clusters left out', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v2', 'v1beta1']) },
          { cluster: 'c', jsonData: kafkaChannelCrd(['v1beta1']) },
        ],
        [],
        []
      )
    ).toEqual({
      info: { ...kafkaChannel, apiVersion: 'messaging.knative.dev/v1beta1' },
      clusters: ['b', 'c'],
      clustersLeftOut: ['a'],
    });
  });

  it('lists a kind at the newest version when the clusters share none', () => {
    expect(
      findKnownKind(
        kafkaChannel,
        [
          { cluster: 'a', jsonData: kafkaChannelCrd(['v1']) },
          { cluster: 'b', jsonData: kafkaChannelCrd(['v2']) },
        ],
        [],
        []
      )
    ).toEqual({
      info: { ...kafkaChannel, apiVersion: 'messaging.knative.dev/v2' },
      clusters: ['b'],
      clustersLeftOut: ['a'],
    });
  });
});
