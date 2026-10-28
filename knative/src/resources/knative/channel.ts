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

import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { KnativeListRouteName } from '../../navigation';
import type {
  Addressable,
  AppliedEventPolicyRef,
  AuthStatus,
  ConditionStatus,
  DeliverySpec,
  KReference,
} from './common';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';

/** The state a Channel reports for one of its Subscriptions. */
export interface ChannelSubscriberStatus {
  /** Details used for OIDC authentication. */
  auth?: AuthStatus;
  /** A human-readable message with details about the Ready status. */
  message?: string;
  /** Generation of the Subscription with the UID `uid`. */
  observedGeneration?: number;
  /** Whether the subscriber is ready: `True`, `False` or `Unknown`. */
  ready?: ConditionStatus;
  /** UID of the Subscription this status belongs to. */
  uid?: string;
}

/** A Knative Channel, as the v1 `channels.messaging.knative.dev` CRD defines it. */
interface KnativeChannelResource extends KubeObjectInterface {
  /** How the Channel is set up. */
  spec?: {
    /**
     * Which Channel CRD backs this Channel, and the spec to create it with. It cannot change after
     * the Channel is created, and Knative's defaulting usually sets it rather than the user; Knative
     * requires it, though the CRD schema does not mark it as required.
     */
    channelTemplate?: {
      /** API version of the backing Channel kind. */
      apiVersion?: string;
      /** The backing Channel kind, for example `InMemoryChannel`. */
      kind?: string;
      /** The spec passed unchanged to each backing Channel. */
      spec?: Record<string, unknown>;
    };
    /**
     * Delivery settings for every Subscription to this Channel; a Subscription's own settings
     * win.
     */
    delivery?: DeliverySpec;
    /**
     * The Subscriptions to this Channel. Knative's webhook rejects this field on a Channel: Knative
     * writes the subscribers on the backing Channel and reports them in `status.subscribers`.
     */
    subscribers?: {
      /** Details used for OIDC authentication. */
      auth?: AuthStatus;
      /** Delivery settings of the Subscription. */
      delivery?: DeliverySpec;
      /** Generation of the Subscription with the UID `uid`. */
      generation?: number;
      /** Name of the Subscription. */
      name?: string;
      /** The OIDC audience of `replyUri`. */
      replyAudience?: string;
      /** CA certificates in PEM format of the reply endpoint. */
      replyCACerts?: string;
      /** The endpoint that replies are sent to. */
      replyUri?: string;
      /** The OIDC audience of `subscriberUri`. */
      subscriberAudience?: string;
      /** CA certificates in PEM format of the subscriber. */
      subscriberCACerts?: string;
      /** The endpoint that events are sent to. */
      subscriberUri?: string;
      /** UID of the Subscription this subscriber comes from. */
      uid?: string;
    }[];
  };
  /** What the Channel controller last reported. */
  status?: ConditionedStatus & {
    /** The address where the Channel accepts events. */
    address?: Addressable;
    /** Every address where the Channel accepts events. */
    addresses?: Addressable[];
    /** The backing Channel created for this Channel. */
    channel?: KReference;
    /**
     * The Channel that failed events go to, set when the backing Channel handles errors itself.
     */
    deadLetterChannel?: KReference;
    /** The resolved URI of the dead letter sink, used when a Subscription sets none. */
    deadLetterSinkUri?: string;
    /** CA certificates in PEM format of the dead letter sink. */
    deadLetterSinkCACerts?: string;
    /** The OIDC audience of the dead letter sink. */
    deadLetterSinkAudience?: string;
    /** The EventPolicies applied to the Channel. */
    policies?: AppliedEventPolicyRef[];
    /** The state of each Subscription to this Channel. */
    subscribers?: ChannelSubscriberStatus[];
  };
}

/** A Knative Channel, which passes every event it receives to all of its Subscriptions. */
export class KnativeChannel extends ConditionedKnativeCustomResource<KnativeChannelResource> {
  static kind = 'Channel';
  static apiName = 'channels';
  static apiVersion = 'messaging.knative.dev/v1';
  static isNamespaced = true;

  /**
   * The plugin route that shows one Channel.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeChannelDetails';
  }

  /**
   * The plugin route that lists Channels.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeChannels';
  }

  /**
   * The address that event producers send events to.
   *
   * @returns The Channel's URL, or undefined until the Channel has an address.
   */
  get address(): string | undefined {
    return this.status?.address?.url;
  }

  /**
   * The kind of Channel that backs this one, from the Channel's template.
   *
   * @returns The backing kind, for example `InMemoryChannel`, or undefined when the template names
   * none.
   */
  get backingKind(): string | undefined {
    return this.spec?.channelTemplate?.kind;
  }

  /**
   * The number of Subscriptions to this Channel. Knative records them on the backing Channel and
   * reports their state in this Channel's status.
   *
   * @returns How many subscribers the Channel reports in its status.
   */
  get subscriberCount(): number {
    return this.status?.subscribers?.length ?? 0;
  }
}
