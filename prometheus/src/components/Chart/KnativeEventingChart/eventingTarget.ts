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

import type { KubeMetadata } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** The fields of a Knative Eventing resource that decide which charts it has. */
export interface EventingResource {
  /** The resource's kind, when the resource has no `jsonData`. */
  kind?: string;
  /** The resource's API version, when the resource has no `jsonData`. */
  apiVersion?: string;
  /** The resource as the Kubernetes API returned it. */
  jsonData?: {
    /** The resource's kind. */
    kind?: string;
    /** The resource's API version. */
    apiVersion?: string;
    /** The resource's name, namespace, UID and annotations, such as a Broker's class. */
    metadata?: Pick<KubeMetadata, 'name' | 'namespace' | 'uid' | 'annotations'>;
    /** The resource's spec. */
    spec?: {
      /** The name of a Trigger's Broker, in the Trigger's namespace. */
      broker?: string;
      /** A Trigger's Broker, which may be in another namespace. */
      brokerRef?: {
        /** The Broker's name. */
        name?: string;
        /** The Broker's namespace, when it is not the Trigger's. */
        namespace?: string;
      };
      /** The channel a Subscription receives events from. */
      channel?: {
        /** The channel's API version; the webhook requires it. */
        apiVersion?: string;
        /** The channel's kind. */
        kind?: string;
        /** The channel's name. */
        name?: string;
        /** The channel's namespace, when it is not the Subscription's. */
        namespace?: string;
      };
      /** The Kafka consumer group a KafkaSource reads with. */
      consumerGroup?: string;
      /** The Kafka topics a KafkaSource reads; the webhook requires at least one. */
      topics?: string[];
    };
    /** The resource's status. */
    status?: {
      /** The channel implementation a Channel created to deliver its events. */
      channel?: {
        /** The channel implementation's API version. */
        apiVersion?: string;
        /** The channel implementation's kind. */
        kind?: string;
      };
      /** The Subscriptions a channel delivers events to. */
      subscribers?: {
        /** The Subscription's UID. */
        uid?: string;
      }[];
      /** Settings a controller recorded, such as the `group.id` of a Kafka Broker's Trigger. */
      annotations?: Record<string, string>;
    };
  };
}

/** How the admission webhooks and the controllers of Knative name a resource's kind. */
export interface ControlPlane {
  /** The kind's API group. */
  group: string;
  /** The kind. */
  kind: string;
  /** The `name` of the work queue of the reconciler of the kind, when it is known. */
  reconciler?: string;
}

/** A Trigger, named the way its metrics name it. */
export interface TriggerTarget {
  /** A Trigger, whose Broker's class tells which data plane records it. */
  kind: 'Trigger';
  /** The Trigger's namespace. */
  namespace: string;
  /** The Trigger's name. */
  name: string;
  /** How the control plane names Triggers. Its reconciler is known once the Broker is read. */
  controlPlane: ControlPlane;
  /** The Kafka consumer group in the Trigger's `group.id` status annotation, if it has one. */
  consumerGroup?: string;
  /** The Trigger's Broker. */
  broker: {
    /** The Broker's namespace. */
    namespace: string;
    /** The Broker's name. */
    name: string;
    /** The Broker's class, once the Broker is read and found to be of the default class. */
    brokerClass?: 'MTChannelBasedBroker';
  };
}

/** A Subscription, named the way its metrics name it. */
export interface SubscriptionTarget {
  /** A Subscription. */
  kind: 'Subscription';
  /** The Subscription's namespace. */
  namespace: string;
  /** The Subscription's name. */
  name: string;
  /** The Subscription's UID, which names its Kafka consumer group and its NATS consumer. */
  uid: string;
  /** How the control plane names Subscriptions. */
  controlPlane: ControlPlane;
  /** The channel the Subscription receives events from. */
  channel: {
    /**
     * The channel's kind. Which channel implementation delivers a Channel's events is known only
     * once the Channel is read.
     */
    kind: ChannelImplementationKind | 'Channel';
    /** The channel's namespace. */
    namespace: string;
    /** The channel's name. */
    name: string;
  };
}

/** A channel implementation that Prometheus has metrics for. */
export type ChannelImplementationKind = 'InMemoryChannel' | 'KafkaChannel' | 'NatsJetStreamChannel';

/** A Knative Eventing resource, named the way its metrics name it. */
export type KnativeEventingTarget =
  | ({
      /**
       * Which metrics describe the resource: a channel-based Broker, a Kafka Broker, an
       * InMemoryChannel, an ApiServerSource, or a resource that only the control plane records,
       * such as a PingSource.
       */
      kind: 'Broker' | 'KafkaBroker' | 'InMemoryChannel' | 'ApiServerSource' | 'Resource';
    } & NamedTarget)
  | ({
      /** A Trigger of a Kafka Broker. */
      kind: 'KafkaTrigger';
      /** The Kafka consumer group that reads its events, when it is known. */
      consumerGroup?: string;
    } & NamedTarget)
  | ({
      /** A KafkaSource. */
      kind: 'KafkaSource';
      /** The Kafka consumer group that reads its events, when it is known. */
      consumerGroup?: string;
      /** The Kafka topics it reads, which its consumer group may not be the only one to read. */
      topics: string[];
    } & NamedTarget)
  | ({
      /** A KafkaChannel or a NatsJetStreamChannel, or a Channel that one of them delivers for. */
      kind: 'KafkaChannel' | 'NatsJetStreamChannel';
      /** The UIDs of the channel's Subscriptions, which name their consumers. */
      subscriptionUids: string[];
    } & NamedTarget)
  | TriggerTarget
  | SubscriptionTarget;

/** What reading a Trigger's Broker or a Subscription's Channel tells about its charts. */
export interface Resolution {
  /** The resource, named with what was read. */
  target: KnativeEventingTarget;
  /** The Broker class or channel kind that has no delivery charts, if any. */
  unsupported?: string;
}

/** The namespace, name and control plane names that every target has. */
interface NamedTarget {
  /** The resource's namespace. */
  namespace: string;
  /** The resource's name. */
  name: string;
  /** How the control plane names the resource's kind. */
  controlPlane: ControlPlane;
}

const eventing = 'knative.dev.eventing.pkg.reconciler.';
const kafka = 'knative.dev.eventing-kafka-broker.control-plane.pkg.reconciler.';
const reconcilers: Record<string, string> = {
  'eventing.knative.dev/Broker': `${eventing}broker.Reconciler`,
  'eventing.knative.dev/Trigger': `${eventing}broker.trigger.Reconciler`,
  'messaging.knative.dev/Channel': `${eventing}channel.Reconciler`,
  'messaging.knative.dev/InMemoryChannel': `${eventing}inmemorychannel.controller.Reconciler`,
  'messaging.knative.dev/KafkaChannel': `${kafka}channel.Reconciler`,
  'messaging.knative.dev/NatsJetStreamChannel':
    'knative.dev.eventing-natss.pkg.channel.jetstream.controller.Reconciler',
  'messaging.knative.dev/Subscription': `${eventing}subscription.Reconciler`,
  'sources.knative.dev/ApiServerSource': `${eventing}apiserversource.Reconciler`,
  'sources.knative.dev/ContainerSource': `${eventing}containersource.Reconciler`,
  'sources.knative.dev/KafkaSource': `${kafka}source.Reconciler`,
  'sources.knative.dev/PingSource': `${eventing}pingsource.Reconciler`,
  'sources.knative.dev/SinkBinding': 'SinkBindings',
};

/**
 * Tells whether a kind is a channel implementation that Prometheus has metrics for.
 *
 * @param kind - The kind.
 * @returns Whether the kind is an InMemoryChannel, a KafkaChannel or a NatsJetStreamChannel.
 */
export function isChannelImplementation(kind?: string): kind is ChannelImplementationKind {
  return kind === 'InMemoryChannel' || kind === 'KafkaChannel' || kind === 'NatsJetStreamChannel';
}

/**
 * Gives the kind of a channel that a resource refers to, when the channel is of Knative's
 * `messaging.knative.dev` API group. A Subscription or a Channel may refer to a channel of any
 * group.
 *
 * @param channel - The reference to the channel.
 * @returns The channel's kind, or `undefined` for a channel of another API group.
 */
function getKnativeChannelKind(channel?: Pick<EventingResource, 'apiVersion' | 'kind'>) {
  return channel?.apiVersion?.split('/')[0] === 'messaging.knative.dev' ? channel.kind : undefined;
}

/**
 * Names a channel implementation's events the way its metrics do.
 *
 * @param implementation - The kind of the channel implementation.
 * @param target - The channel's namespace, name and control plane names.
 * @param status - The channel's status, which lists its Subscriptions.
 * @returns The channel's target.
 */
function getChannelTarget(
  implementation: ChannelImplementationKind,
  target: NamedTarget,
  status: NonNullable<EventingResource['jsonData']>['status']
): KnativeEventingTarget {
  if (implementation === 'InMemoryChannel') {
    return { ...target, kind: implementation };
  }

  const subscriptionUids = (status?.subscribers ?? []).flatMap(({ uid }) => (uid ? [uid] : []));

  return { ...target, kind: implementation, subscriptionUids };
}

/**
 * Finds the Knative Eventing resource that a detail page shows, named the way its metrics name it.
 * A Channel is charted as the channel implementation that delivers its events, which has the
 * Channel's name, with the control plane charts of Channels. The class of a Broker tells which
 * data plane records it and its Triggers.
 *
 * @param resource - The resource of the detail page.
 * @returns The resource's target, or `undefined` when Prometheus has no metrics for its kind.
 */
export function getKnativeEventingTarget(
  resource?: EventingResource
): KnativeEventingTarget | undefined {
  const data = resource?.jsonData;
  const kind = data?.kind ?? resource?.kind;
  const group = (data?.apiVersion ?? resource?.apiVersion)?.split('/')[0];
  const namespace = data?.metadata?.namespace;
  const name = data?.metadata?.name;
  const reconciler = reconcilers[`${group}/${kind}`];

  if (!namespace || !name || !group || !kind || !reconciler) {
    return undefined;
  }

  const target: NamedTarget = { namespace, name, controlPlane: { group, kind, reconciler } };

  switch (kind) {
    case 'Broker': {
      const brokerClass =
        data?.metadata?.annotations?.['eventing.knative.dev/broker.class'] ??
        'MTChannelBasedBroker';
      if (brokerClass === 'MTChannelBasedBroker') {
        return { ...target, kind };
      }
      if (brokerClass === 'Kafka') {
        const kafkaBroker = `${kafka}broker.Reconciler`;

        return {
          ...target,
          kind: 'KafkaBroker',
          controlPlane: { group, kind, reconciler: kafkaBroker },
        };
      }
      return { ...target, kind: 'Resource', controlPlane: { group, kind } };
    }
    case 'Trigger': {
      const brokerName = data?.spec?.brokerRef?.name ?? data?.spec?.broker;
      if (!brokerName) {
        return { ...target, kind: 'Resource', controlPlane: { group, kind } };
      }
      return {
        ...target,
        kind,
        controlPlane: { group, kind },
        consumerGroup: data?.status?.annotations?.['group.id'],
        broker: { namespace: data?.spec?.brokerRef?.namespace || namespace, name: brokerName },
      };
    }
    case 'InMemoryChannel':
    case 'KafkaChannel':
    case 'NatsJetStreamChannel':
      return getChannelTarget(kind, target, data?.status);
    case 'Channel': {
      const implementation = getKnativeChannelKind(data?.status?.channel);
      return isChannelImplementation(implementation)
        ? getChannelTarget(implementation, target, data?.status)
        : { ...target, kind: 'Resource' };
    }
    case 'Subscription': {
      const channel = data?.spec?.channel;
      const uid = data?.metadata?.uid;
      const channelKind = getKnativeChannelKind(channel);
      if (
        !uid ||
        !channel?.name ||
        (!isChannelImplementation(channelKind) && channelKind !== 'Channel')
      ) {
        return { ...target, kind: 'Resource' };
      }
      return {
        ...target,
        kind,
        uid,
        channel: {
          kind: channelKind,
          namespace: channel.namespace || namespace,
          name: channel.name,
        },
      };
    }
    case 'KafkaSource':
      return {
        ...target,
        kind,
        consumerGroup: data?.spec?.consumerGroup,
        topics: data?.spec?.topics ?? [],
      };
    case 'ApiServerSource':
      return { ...target, kind };
    default:
      return { ...target, kind: 'Resource' };
  }
}

/**
 * Names a Trigger with the class of its Broker: a default-class Broker's Trigger is charted from
 * the Broker filter, and a Kafka Broker's Trigger from the Kafka dispatcher and, once the Trigger
 * names it, its consumer group. Other classes, such as `KafkaNamespaced`, are not charted.
 *
 * @param trigger - The Trigger.
 * @param broker - The Trigger's Broker, as reading it returned it.
 * @returns The Trigger's target, and the Broker's class when Prometheus has no metrics for it.
 */
export function resolveTriggerTarget(trigger: TriggerTarget, broker: EventingResource): Resolution {
  const brokerKind = getKnativeEventingTarget(broker)?.kind;
  const { group, kind } = trigger.controlPlane;

  if (brokerKind === 'Broker') {
    return {
      target: {
        ...trigger,
        controlPlane: { group, kind, reconciler: reconcilers['eventing.knative.dev/Trigger'] },
        broker: { ...trigger.broker, brokerClass: 'MTChannelBasedBroker' },
      },
    };
  }
  if (brokerKind === 'KafkaBroker') {
    return {
      target: {
        kind: 'KafkaTrigger',
        namespace: trigger.namespace,
        name: trigger.name,
        consumerGroup: trigger.consumerGroup,
        controlPlane: { group, kind, reconciler: `${kafka}trigger.v2.Reconciler` },
      },
    };
  }
  return {
    target: trigger,
    unsupported: broker.jsonData?.metadata?.annotations?.['eventing.knative.dev/broker.class'],
  };
}

/**
 * Names a Subscription to a Channel with the channel implementation that delivers the Channel's
 * events. Until the Channel names its implementation, the Subscription keeps its Channel.
 *
 * @param subscription - The Subscription.
 * @param channel - The Subscription's Channel, as reading it returned it.
 * @returns The Subscription's target, and the channel kind when Prometheus has no metrics for it.
 */
export function resolveSubscriptionTarget(
  subscription: SubscriptionTarget,
  channel: EventingResource
): Resolution {
  const implementation = channel.jsonData?.status?.channel;
  const kind = getKnativeChannelKind(implementation);

  if (isChannelImplementation(kind)) {
    return { target: { ...subscription, channel: { ...subscription.channel, kind } } };
  }
  return { target: subscription, unsupported: implementation?.kind };
}
