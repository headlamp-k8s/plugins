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
import type { AuthStatus, DeliverySpec, Destination, KReference } from './common';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';
import { getFirstOwner } from './resourceData';

/** A Knative Subscription, as the v1 `subscriptions.messaging.knative.dev` CRD defines it. */
interface KnativeSubscriptionResource extends KubeObjectInterface {
  /** What the Subscription is set up to do. */
  spec?: {
    /**
     * The Channel to take events from. Only `kind`, `apiVersion`, `name` and `namespace` may be
     * set, and `namespace` only with Knative's `cross-namespace-event-links` feature. The object
     * must follow Knative's Channelable contract; if it does not, the Subscription's status says
     * so. It cannot change; to use another Channel, delete the Subscription and create it again.
     * Knative requires it, though the CRD schema does not mark it as required.
     */
    channel?: KReference;
    /** Delivery settings for events sent to the subscriber; they override the Channel's. */
    delivery?: DeliverySpec;
    /** Where to send the events that the subscriber returns. */
    reply?: Destination;
    /**
     * The function that processes events: events from the Channel are delivered here, and its
     * replies go to `reply`. Knative requires it, though the CRD schema does not mark it as
     * required.
     */
    subscriber?: Destination;
  };
  /** What the Subscription controller last reported. */
  status?: ConditionedStatus & {
    /** Details used for OIDC authentication. */
    auth?: AuthStatus;
    /** The fully resolved endpoints of this Subscription. */
    physicalSubscription?: {
      /** The resolved URI of the dead letter sink in `spec.delivery`. */
      deadLetterSinkUri?: string;
      /** CA certificates in PEM format of the dead letter sink. */
      deadLetterSinkCACerts?: string;
      /** The OIDC audience of the dead letter sink. */
      deadLetterSinkAudience?: string;
      /** The resolved URI of `spec.reply`. */
      replyUri?: string;
      /** CA certificates in PEM format of the reply endpoint. */
      replyCACerts?: string;
      /** The OIDC audience of `replyUri`. */
      replyAudience?: string;
      /** The resolved URI of `spec.subscriber`. */
      subscriberUri?: string;
      /** CA certificates in PEM format of the subscriber. */
      subscriberCACerts?: string;
      /** The OIDC audience of `subscriberUri`. */
      subscriberAudience?: string;
    };
  };
}

/** A Knative Subscription, which sends every event from a Channel to a subscriber. */
export class KnativeSubscription extends ConditionedKnativeCustomResource<KnativeSubscriptionResource> {
  static kind = 'Subscription';
  static apiName = 'subscriptions';
  static apiVersion = 'messaging.knative.dev/v1';
  static isNamespaced = true;

  /**
   * The plugin route that shows one Subscription.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeSubscriptionDetails';
  }

  /**
   * The plugin route that lists Subscriptions.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeSubscriptions';
  }

  /**
   * The object that created this Subscription, for example the Trigger a Broker made it for.
   *
   * @returns The controlling owner, or the first owner, or undefined when it has none.
   */
  get owner() {
    return getFirstOwner(this.metadata);
  }
}
