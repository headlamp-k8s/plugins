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
  type EventingResource,
  getKnativeEventingTarget,
  isChannelImplementation,
  type KnativeEventingTarget,
  resolveSubscriptionTarget,
  resolveTriggerTarget,
  type SubscriptionTarget,
  type TriggerTarget,
} from './eventingTarget';

/**
 * Builds a resource the way a Headlamp detail page passes it.
 *
 * @param kind - The resource's kind.
 * @param apiVersion - The resource's API version.
 * @param fields - The spec, status and annotations of the resource.
 * @returns The resource, named `orders` in namespace `shop`, with UID `c3`.
 */
function resource(
  kind: string,
  apiVersion: string,
  fields: Pick<NonNullable<EventingResource['jsonData']>, 'spec' | 'status'> & {
    /** The resource's annotations. */
    annotations?: Record<string, string>;
  } = {}
): EventingResource {
  return {
    kind,
    jsonData: {
      kind,
      apiVersion,
      metadata: { name: 'orders', namespace: 'shop', uid: 'c3', annotations: fields.annotations },
      spec: fields.spec,
      status: fields.status,
    },
  };
}

const eventing = 'knative.dev.eventing.pkg.reconciler.';
const kafka = 'knative.dev.eventing-kafka-broker.control-plane.pkg.reconciler.';
const named = { namespace: 'shop', name: 'orders' };
const subscribers = { subscribers: [{ uid: 'a1' }, {}, { uid: 'b2' }] };
const channelPlane = {
  group: 'messaging.knative.dev',
  kind: 'Channel',
  reconciler: `${eventing}channel.Reconciler`,
};

describe('getKnativeEventingTarget', () => {
  test.each<[string, EventingResource, KnativeEventingTarget]>([
    [
      'a Broker of the default class',
      resource('Broker', 'eventing.knative.dev/v1'),
      {
        ...named,
        kind: 'Broker',
        controlPlane: {
          group: 'eventing.knative.dev',
          kind: 'Broker',
          reconciler: `${eventing}broker.Reconciler`,
        },
      },
    ],
    [
      'a Kafka Broker',
      resource('Broker', 'eventing.knative.dev/v1', {
        annotations: { 'eventing.knative.dev/broker.class': 'Kafka' },
      }),
      {
        ...named,
        kind: 'KafkaBroker',
        controlPlane: {
          group: 'eventing.knative.dev',
          kind: 'Broker',
          reconciler: `${kafka}broker.Reconciler`,
        },
      },
    ],
    [
      'a Broker of another class',
      resource('Broker', 'eventing.knative.dev/v1', {
        annotations: { 'eventing.knative.dev/broker.class': 'RabbitMQBroker' },
      }),
      {
        ...named,
        kind: 'Resource',
        controlPlane: { group: 'eventing.knative.dev', kind: 'Broker' },
      },
    ],
    [
      'a Trigger with the Broker it names, before the Broker is read',
      resource('Trigger', 'eventing.knative.dev/v1', { spec: { broker: 'default' } }),
      {
        ...named,
        kind: 'Trigger',
        controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
        broker: { namespace: 'shop', name: 'default' },
      },
    ],
    [
      'a Trigger with a Broker in another namespace',
      resource('Trigger', 'eventing.knative.dev/v1', {
        spec: { brokerRef: { name: 'default', namespace: 'billing' } },
      }),
      {
        ...named,
        kind: 'Trigger',
        controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
        broker: { namespace: 'billing', name: 'default' },
      },
    ],
    [
      'a Trigger without a Broker by its control plane only',
      resource('Trigger', 'eventing.knative.dev/v1'),
      {
        ...named,
        kind: 'Resource',
        controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
      },
    ],
    [
      'a Trigger with the consumer group it names, before the Broker is read',
      resource('Trigger', 'eventing.knative.dev/v1', {
        spec: { broker: 'default' },
        status: { annotations: { 'group.id': 'knative-trigger-shop-orders' } },
      }),
      {
        ...named,
        kind: 'Trigger',
        consumerGroup: 'knative-trigger-shop-orders',
        controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
        broker: { namespace: 'shop', name: 'default' },
      },
    ],
    [
      'an InMemoryChannel',
      resource('InMemoryChannel', 'messaging.knative.dev/v1'),
      {
        ...named,
        kind: 'InMemoryChannel',
        controlPlane: {
          group: 'messaging.knative.dev',
          kind: 'InMemoryChannel',
          reconciler: `${eventing}inmemorychannel.controller.Reconciler`,
        },
      },
    ],
    [
      'a KafkaChannel with the UIDs of the Subscriptions in its status',
      resource('KafkaChannel', 'messaging.knative.dev/v1beta1', { status: subscribers }),
      {
        ...named,
        kind: 'KafkaChannel',
        subscriptionUids: ['a1', 'b2'],
        controlPlane: {
          group: 'messaging.knative.dev',
          kind: 'KafkaChannel',
          reconciler: `${kafka}channel.Reconciler`,
        },
      },
    ],
    [
      'a NatsJetStreamChannel that has no Subscriptions yet',
      resource('NatsJetStreamChannel', 'messaging.knative.dev/v1alpha1'),
      {
        ...named,
        kind: 'NatsJetStreamChannel',
        subscriptionUids: [],
        controlPlane: {
          group: 'messaging.knative.dev',
          kind: 'NatsJetStreamChannel',
          reconciler: 'knative.dev.eventing-natss.pkg.channel.jetstream.controller.Reconciler',
        },
      },
    ],
    [
      'a Channel as the InMemoryChannel that delivers its events',
      resource('Channel', 'messaging.knative.dev/v1', {
        status: { channel: { apiVersion: 'messaging.knative.dev/v1', kind: 'InMemoryChannel' } },
      }),
      { ...named, kind: 'InMemoryChannel', controlPlane: channelPlane },
    ],
    [
      'a Channel as the NatsJetStreamChannel that delivers its events',
      resource('Channel', 'messaging.knative.dev/v1', {
        status: {
          channel: { apiVersion: 'messaging.knative.dev/v1alpha1', kind: 'NatsJetStreamChannel' },
          ...subscribers,
        },
      }),
      {
        ...named,
        kind: 'NatsJetStreamChannel',
        subscriptionUids: ['a1', 'b2'],
        controlPlane: channelPlane,
      },
    ],
    [
      'a Channel whose channel implementation is not known yet',
      resource('Channel', 'messaging.knative.dev/v1'),
      { ...named, kind: 'Resource', controlPlane: channelPlane },
    ],
    [
      'a Channel by its control plane only when its channel implementation is of another group',
      resource('Channel', 'messaging.knative.dev/v1', {
        status: { channel: { apiVersion: 'example.com/v1', kind: 'KafkaChannel' } },
      }),
      { ...named, kind: 'Resource', controlPlane: channelPlane },
    ],
    [
      'a KafkaSource with its consumer group and topics',
      resource('KafkaSource', 'sources.knative.dev/v1', {
        spec: { consumerGroup: 'payments-source', topics: ['payments', 'refunds'] },
      }),
      {
        ...named,
        kind: 'KafkaSource',
        consumerGroup: 'payments-source',
        topics: ['payments', 'refunds'],
        controlPlane: {
          group: 'sources.knative.dev',
          kind: 'KafkaSource',
          reconciler: `${kafka}source.Reconciler`,
        },
      },
    ],
    [
      'an ApiServerSource',
      resource('ApiServerSource', 'sources.knative.dev/v1'),
      {
        ...named,
        kind: 'ApiServerSource',
        controlPlane: {
          group: 'sources.knative.dev',
          kind: 'ApiServerSource',
          reconciler: `${eventing}apiserversource.Reconciler`,
        },
      },
    ],
    [
      'a PingSource, whose events Knative does not name in its metrics',
      resource('PingSource', 'sources.knative.dev/v1'),
      {
        ...named,
        kind: 'Resource',
        controlPlane: {
          group: 'sources.knative.dev',
          kind: 'PingSource',
          reconciler: `${eventing}pingsource.Reconciler`,
        },
      },
    ],
    [
      'a SinkBinding',
      resource('SinkBinding', 'sources.knative.dev/v1'),
      {
        ...named,
        kind: 'Resource',
        controlPlane: {
          group: 'sources.knative.dev',
          kind: 'SinkBinding',
          reconciler: 'SinkBindings',
        },
      },
    ],
  ])('names %s', (_, eventingResource, target) => {
    expect(getKnativeEventingTarget(eventingResource)).toEqual(target);
  });

  const subscriptionPlane = {
    group: 'messaging.knative.dev',
    kind: 'Subscription',
    reconciler: `${eventing}subscription.Reconciler`,
  };

  test.each([
    ['InMemoryChannel', 'messaging.knative.dev/v1'],
    ['KafkaChannel', 'messaging.knative.dev/v1beta1'],
    ['NatsJetStreamChannel', 'messaging.knative.dev/v1alpha1'],
    ['Channel', 'messaging.knative.dev/v1'],
  ])('names a Subscription to a %s with its channel', (channelKind, apiVersion) => {
    const subscription = resource('Subscription', 'messaging.knative.dev/v1', {
      spec: { channel: { apiVersion, kind: channelKind, name: 'orders-channel' } },
    });

    expect(getKnativeEventingTarget(subscription)).toEqual({
      ...named,
      kind: 'Subscription',
      uid: 'c3',
      controlPlane: subscriptionPlane,
      channel: { kind: channelKind, namespace: 'shop', name: 'orders-channel' },
    });
  });

  test("uses the namespace of a Subscription's channel when it names one", () => {
    const subscription = resource('Subscription', 'messaging.knative.dev/v1', {
      spec: {
        channel: {
          apiVersion: 'messaging.knative.dev/v1',
          kind: 'Channel',
          name: 'orders-channel',
          namespace: 'billing',
        },
      },
    });

    expect(getKnativeEventingTarget(subscription)).toMatchObject({
      channel: { kind: 'Channel', namespace: 'billing', name: 'orders-channel' },
    });
  });

  test.each([
    ['a channel kind without metrics', 'messaging.knative.dev/v1', 'RabbitmqChannel'],
    ['a Channel of another API group', 'example.com/v1', 'Channel'],
  ])('names a Subscription to %s by its control plane only', (_, apiVersion, kind) => {
    const subscription = resource('Subscription', 'messaging.knative.dev/v1', {
      spec: { channel: { apiVersion, kind, name: 'orders-rabbit' } },
    });

    expect(getKnativeEventingTarget(subscription)).toEqual({
      ...named,
      kind: 'Resource',
      controlPlane: subscriptionPlane,
    });
  });

  test.each([
    ['a Broker of another API group', resource('Broker', 'example.com/v1')],
    [
      'a kind that Knative does not reconcile',
      resource('EventType', 'eventing.knative.dev/v1beta3'),
    ],
    ['a Kubernetes kind', resource('Service', 'v1')],
    [
      'a KafkaSink, which has no page in the Knative plugin',
      resource('KafkaSink', 'eventing.knative.dev/v1alpha1'),
    ],
    [
      'a resource without a namespace',
      {
        jsonData: {
          kind: 'Broker',
          apiVersion: 'eventing.knative.dev/v1',
          metadata: { name: 'b', uid: 'd4' },
        },
      },
    ],
    ['no resource', undefined],
  ])('has no target for %s', (_, eventingResource) => {
    expect(getKnativeEventingTarget(eventingResource)).toBeUndefined();
  });
});

describe('isChannelImplementation', () => {
  test.each([
    ['InMemoryChannel', true],
    ['KafkaChannel', true],
    ['NatsJetStreamChannel', true],
    ['Channel', false],
    ['RabbitmqChannel', false],
    [undefined, false],
  ])('tells whether %s has delivery metrics', (kind, expected) => {
    expect(isChannelImplementation(kind)).toBe(expected);
  });
});

describe('resolveTriggerTarget', () => {
  const trigger: TriggerTarget = {
    ...named,
    kind: 'Trigger',
    controlPlane: { group: 'eventing.knative.dev', kind: 'Trigger' },
    broker: { namespace: 'shop', name: 'default' },
  };

  /**
   * Builds the Trigger's Broker as reading it returns it.
   *
   * @param brokerClass - The class its annotation names, if any.
   * @returns The Broker.
   */
  function broker(brokerClass?: string) {
    return resource('Broker', 'eventing.knative.dev/v1', {
      annotations: brokerClass ? { 'eventing.knative.dev/broker.class': brokerClass } : undefined,
    });
  }

  test.each([undefined, 'MTChannelBasedBroker'])(
    'charts the Trigger of a Broker of class %s from the Broker filter',
    brokerClass => {
      expect(resolveTriggerTarget(trigger, broker(brokerClass))).toEqual({
        target: {
          ...trigger,
          controlPlane: {
            group: 'eventing.knative.dev',
            kind: 'Trigger',
            reconciler: `${eventing}broker.trigger.Reconciler`,
          },
          broker: { namespace: 'shop', name: 'default', brokerClass: 'MTChannelBasedBroker' },
        },
      });
    }
  );

  test.each([undefined, 'knative-trigger-shop-orders'])(
    "charts a Kafka Broker's Trigger from the Kafka dispatcher with consumer group %s",
    consumerGroup => {
      expect(resolveTriggerTarget({ ...trigger, consumerGroup }, broker('Kafka'))).toStrictEqual({
        target: {
          ...named,
          kind: 'KafkaTrigger',
          consumerGroup,
          controlPlane: {
            group: 'eventing.knative.dev',
            kind: 'Trigger',
            reconciler: `${kafka}trigger.v2.Reconciler`,
          },
        },
      });
    }
  );

  test.each(['RabbitMQBroker', 'KafkaNamespaced'])(
    'names class %s, which has no delivery charts, even when the Trigger names a consumer group',
    brokerClass => {
      const kafkaTrigger = { ...trigger, consumerGroup: 'knative-trigger-shop-orders' };

      expect(resolveTriggerTarget(kafkaTrigger, broker(brokerClass))).toEqual({
        target: kafkaTrigger,
        unsupported: brokerClass,
      });
    }
  );
});

describe('resolveSubscriptionTarget', () => {
  const subscription: SubscriptionTarget = {
    ...named,
    kind: 'Subscription',
    uid: 'c3',
    controlPlane: { group: 'messaging.knative.dev', kind: 'Subscription' },
    channel: { kind: 'Channel', namespace: 'shop', name: 'orders-channel' },
  };

  test.each<[string, string | undefined]>([
    ['the channel implementation behind the Channel', 'KafkaChannel'],
    ['nothing new while the Channel names no implementation', undefined],
  ])('names a Subscription with %s', (_, implementation) => {
    const channel = resource('Channel', 'messaging.knative.dev/v1', {
      status: implementation
        ? { channel: { apiVersion: 'messaging.knative.dev/v1beta1', kind: implementation } }
        : undefined,
    });

    expect(resolveSubscriptionTarget(subscription, channel)).toEqual({
      target: implementation
        ? { ...subscription, channel: { ...subscription.channel, kind: implementation } }
        : subscription,
    });
  });

  test.each([
    ['that has no delivery metrics', 'messaging.knative.dev/v1', 'RabbitmqChannel'],
    ['of another API group', 'example.com/v1', 'KafkaChannel'],
  ])('names the kind of a channel implementation %s', (_, apiVersion, kind) => {
    const channel = resource('Channel', 'messaging.knative.dev/v1', {
      status: { channel: { apiVersion, kind } },
    });

    expect(resolveSubscriptionTarget(subscription, channel)).toEqual({
      target: subscription,
      unsupported: kind,
    });
  });
});
