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

import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { KnativeListRouteName } from '../../navigation';
import type { ChannelableStatus, ChannelSubscriberSpec } from './channel';
import type { DeliverySpec } from './common';
import type { KnativeResourceClass } from './customResourceLinks';
import { KNATIVE_CHANNEL_IMPLEMENTATION_KINDS } from './eventingData';
import { type DiscoveredKindFamily, DiscoveredKindResource, getKindClass } from './kindClass';

export const CHANNEL_API_GROUP = 'messaging.knative.dev';

/**
 * The fields every channel implementation has, whatever its kind, such as an InMemoryChannel, a
 * KafkaChannel or a NatsJetStreamChannel: Knative's Channelable duck type, which every channel CRD
 * (labelled `messaging.knative.dev/subscribable=true`) follows. Each kind adds its own settings to
 * the spec, such as a KafkaChannel's partitions or a NatsJetStreamChannel's stream.
 */
interface KnativeChannelImplementationResource extends KubeObjectInterface {
  /** How the channel is set up. */
  spec?: {
    /**
     * Delivery settings for every Subscription to this channel; a Subscription's own settings
     * win.
     */
    delivery?: DeliverySpec;
    /**
     * The Subscriptions to this channel, which Knative writes from each Subscription with the
     * endpoints it resolved.
     */
    subscribers?: ChannelSubscriberSpec[];
    /** The settings of the channel's own kind, such as a KafkaChannel's `numPartitions`. */
    [setting: string]: unknown;
  };
  /** What the channel's controller last reported. */
  status?: ChannelableStatus;
}

/**
 * A Knative channel implementation of any kind. `getKnativeChannelImplementationClass` derives one
 * class per kind, so the same type serves every kind.
 */
export class KnativeChannelImplementation extends DiscoveredKindResource<KnativeChannelImplementationResource> {
  /**
   * The plugin route that shows one channel implementation.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeChannelImplementationDetails';
  }

  /**
   * The plugin route that lists channel implementations.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeChannelImplementations';
  }

  /**
   * The address that event producers send events to.
   *
   * @returns The channel's URL, or undefined until the channel has an address.
   */
  get address(): string | undefined {
    return this.status?.address?.url;
  }

  /**
   * The number of Subscriptions to this channel.
   *
   * @returns How many subscribers the channel reports in its status.
   */
  get subscriberCount(): number {
    return this.status?.subscribers?.length ?? 0;
  }

  /**
   * The settings of the channel's own kind, as written in its spec: everything but the
   * Subscriptions Knative writes and the delivery settings.
   *
   * @returns The settings, or undefined when the kind has none set.
   */
  get settings(): Record<string, unknown> | undefined {
    return this.getSpecWithout('subscribers', 'delivery');
  }
}

const channelImplementationClasses = new Map<string, typeof KnativeChannelImplementation>();

/**
 * Gives the class for the channel implementations of one kind, the same class each time for the
 * same kind.
 *
 * @param info - The kind, its plural name, scope and the API version to request.
 * @returns The class.
 */
export function getKnativeChannelImplementationClass(
  info: KnativeResourceClass
): typeof KnativeChannelImplementation {
  return getKindClass(
    channelImplementationClasses,
    info,
    () =>
      class extends KnativeChannelImplementation {
        static kind = info.kind;
        static apiName = info.apiName;
        static apiVersion = info.apiVersion;
        static isNamespaced = info.isNamespaced;
      }
  );
}

export const CHANNEL_IMPLEMENTATION_FAMILY: DiscoveredKindFamily<
  typeof KnativeChannelImplementation
> = {
  labelKey: 'messaging.knative.dev/subscribable',
  excludedCrds: ['channels.messaging.knative.dev'],
  fallbackKinds: KNATIVE_CHANNEL_IMPLEMENTATION_KINDS,
  getKindClass: getKnativeChannelImplementationClass,
};
