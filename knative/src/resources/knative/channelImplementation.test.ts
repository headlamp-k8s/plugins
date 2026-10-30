/*
 * Copyright 2026 The Kubernetes Authors
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

import { vi } from 'vitest';

vi.mock('./conditionedResource', () => ({
  ConditionedKnativeCustomResource: class {
    jsonData: {
      metadata: { name: string; namespace?: string; ownerReferences?: unknown[] };
      spec?: unknown;
      status?: unknown;
    };
    cluster = 'cluster-a';

    constructor(jsonData: ConditionedKnativeCustomResourceJson) {
      this.jsonData = jsonData;
    }

    get metadata() {
      return this.jsonData.metadata;
    }

    get spec() {
      return this.jsonData.spec;
    }

    get status() {
      return this.jsonData.status;
    }

    getDetailsLink() {
      return '/c/cluster-a+cluster-b/knative/channel-implementations/shop/orders';
    }

    getName() {
      return this.jsonData.metadata.name;
    }

    getNamespace() {
      return this.jsonData.metadata.namespace;
    }

    _class() {
      return this.constructor;
    }
  },
}));

/** A channel as Kubernetes returns it, as the stand-in base class stores it. */
type ConditionedKnativeCustomResourceJson = {
  /** The channel's metadata. */
  metadata: {
    /** The channel's name. */
    name: string;
    /** The channel's namespace. */
    namespace?: string;
    /** The objects that own the channel. */
    ownerReferences?: unknown[];
  };
  /** The channel's spec. */
  spec?: unknown;
  /** The channel's status. */
  status?: unknown;
};

import { getKnativeChannelImplementationClass } from './channelImplementation';

const kafkaChannel = {
  kind: 'KafkaChannel',
  apiName: 'kafkachannels',
  apiVersion: 'messaging.knative.dev/v1beta1',
  isNamespaced: true,
};

/**
 * Builds a KafkaChannel object of the class the plugin derives for the kind.
 *
 * @param spec - The channel's spec.
 * @param status - The channel's status.
 * @returns The channel.
 */
function channel(spec?: Record<string, unknown>, status?: Record<string, unknown>) {
  const ChannelClass = getKnativeChannelImplementationClass(kafkaChannel);
  return new ChannelClass({
    apiVersion: 'messaging.knative.dev/v1beta1',
    kind: 'KafkaChannel',
    metadata: {
      name: 'orders',
      namespace: 'shop',
      uid: 'uid-1',
      creationTimestamp: '',
      ownerReferences: [
        {
          apiVersion: 'messaging.knative.dev/v1',
          kind: 'Channel',
          name: 'orders',
          uid: 'uid-0',
          controller: true,
          blockOwnerDeletion: true,
        },
      ],
    },
    spec,
    status,
  } satisfies ConstructorParameters<typeof ChannelClass>[0]);
}

describe('getKnativeChannelImplementationClass', () => {
  it('builds a class that requests the kind with its API version', () => {
    const ChannelClass = getKnativeChannelImplementationClass(kafkaChannel);

    expect({
      kind: ChannelClass.kind,
      apiName: ChannelClass.apiName,
      apiVersion: ChannelClass.apiVersion,
      isNamespaced: ChannelClass.isNamespaced,
    }).toEqual(kafkaChannel);
    expect(ChannelClass.detailsRoute).toBe('knativeChannelImplementationDetails');
    expect(ChannelClass.listRoute).toBe('knativeChannelImplementations');
  });

  it('gives the same class for the same kind, so its list keeps its watch', () => {
    expect(getKnativeChannelImplementationClass({ ...kafkaChannel })).toBe(
      getKnativeChannelImplementationClass(kafkaChannel)
    );
  });
});

describe('KnativeChannelImplementation', () => {
  it('shows the settings of its own kind, without the Subscriptions and delivery', () => {
    expect(
      channel({
        numPartitions: 3,
        retentionDuration: 'PT24H',
        delivery: { retry: 3 },
        subscribers: [{ uid: 'uid-1' }],
      }).settings
    ).toEqual({ numPartitions: 3, retentionDuration: 'PT24H' });
  });

  it.each([
    ['has no spec', undefined],
    ['has only Subscriptions and delivery', { delivery: { retry: 3 }, subscribers: [] }],
  ])('has no settings when it %s', (_case, spec) => {
    expect(channel(spec).settings).toBeUndefined();
  });

  it('reads its address, Subscriptions and owner', () => {
    const item = channel(
      {},
      { address: { url: 'http://orders.shop.svc' }, subscribers: [{ uid: 'a' }, { uid: 'b' }] }
    );

    expect(item.address).toBe('http://orders.shop.svc');
    expect(item.subscriberCount).toBe(2);
    expect(item.owner).toMatchObject({ kind: 'Channel', name: 'orders' });
    expect(channel().subscriberCount).toBe(0);
  });

  it('links to its page, keeping the selected clusters and naming its CRD', () => {
    expect(channel().getDetailsLink()).toBe(
      '/c/cluster-a+cluster-b/knative/channel-implementations/shop/orders' +
        '?crd=kafkachannels.messaging.knative.dev'
    );
  });
});
