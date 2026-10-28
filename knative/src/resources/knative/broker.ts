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
import type { Addressable, AppliedEventPolicyRef, DeliverySpec, KReference } from './common';
import { ConditionedKnativeCustomResource, type ConditionedStatus } from './conditionedResource';
import { getBrokerClass } from './eventingData';

/** A Knative Broker, as the v1 `brokers.eventing.knative.dev` CRD defines it. */
interface KnativeBrokerResource extends KubeObjectInterface {
  /** How the Broker is set up. */
  spec?: {
    /** The configuration options for this Broker, for example a ConfigMap. */
    config?: KReference;
    /** Delivery settings for every Trigger of this Broker; a Trigger's own settings win. */
    delivery?: DeliverySpec;
  };
  /** What the Broker controller last reported. */
  status?: ConditionedStatus & {
    /** The address where the Broker accepts events. */
    address?: Addressable;
    /** Every address where the Broker accepts events. */
    addresses?: Addressable[];
    /** The resolved URI of the dead letter sink, used when a Trigger sets none. */
    deadLetterSinkUri?: string;
    /** CA certificates in PEM format of the dead letter sink. */
    deadLetterSinkCACerts?: string;
    /** The OIDC audience of the dead letter sink. */
    deadLetterSinkAudience?: string;
    /** The EventPolicies applied to the Broker. */
    policies?: AppliedEventPolicyRef[];
  };
}

/** A Knative Eventing Broker, which receives events and passes them on to its Triggers. */
export class KnativeBroker extends ConditionedKnativeCustomResource<KnativeBrokerResource> {
  static kind = 'Broker';
  static apiName = 'brokers';
  static apiVersion = 'eventing.knative.dev/v1';
  static isNamespaced = true;

  /**
   * The plugin route that shows one Broker.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeBrokerDetails';
  }

  /**
   * The plugin route that lists Brokers.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeBrokers';
  }

  /**
   * The Broker's class, from its `eventing.knative.dev/broker.class` annotation.
   *
   * @returns The class, for example `MTChannelBasedBroker`, or undefined when it is not set.
   */
  get brokerClass(): string | undefined {
    return getBrokerClass(this.metadata);
  }

  /**
   * The address that event producers send events to.
   *
   * @returns The Broker's URL, or undefined until the Broker has an address.
   */
  get address(): string | undefined {
    return this.status?.address?.url;
  }
}
