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
import { getTriggerBroker } from './eventingData';

/** One expression in a Trigger's `spec.filters`. */
export interface TriggerFilter {
  /**
   * Attributes whose values must match exactly, case sensitive. Names and values must not be
   * empty.
   */
  exact?: Record<string, string>;
  /**
   * Attributes whose values must start with the given strings, case sensitive. Names and values
   * must not be empty.
   */
  prefix?: Record<string, string>;
  /**
   * Attributes whose values must end with the given strings, case sensitive. Names and values
   * must not be empty.
   */
  suffix?: Record<string, string>;
  /** Expressions that must all be true; must contain at least one. */
  all?: TriggerFilter[];
  /** Expressions of which at least one must be true; must contain at least one. */
  any?: TriggerFilter[];
  /** An expression that must be false. */
  not?: TriggerFilter;
  /** A CloudEvents SQL expression that must be true. */
  cesql?: string;
}

/** A Knative Trigger, as the v1 `triggers.eventing.knative.dev` CRD defines it. */
interface KnativeTriggerResource extends KubeObjectInterface {
  /** What the Trigger is set up to do. */
  spec?: {
    /** Name of the Broker in the Trigger's namespace that the Trigger takes events from. */
    broker?: string;
    /**
     * A Broker enabled for cross-namespace references. Only `kind`, `apiVersion`, `name` and
     * `namespace` may be set.
     */
    brokerRef?: KReference;
    /** Context attributes that events must match exactly; without a filter, all events pass. */
    filter?: {
      /**
       * Context attribute names and the string values they must equal. Nested attributes are not
       * supported as keys, and only string values are supported.
       */
      attributes?: Record<string, string>;
    };
    /**
     * Expressions that must all be true for an event to pass; none means true. When set together
     * with `filter`, they override it.
     */
    filters?: TriggerFilter[];
    /**
     * Where the Trigger sends the events that pass the filter. Knative requires it, though the
     * CRD schema does not mark it as required.
     */
    subscriber?: Destination;
    /** Delivery settings for this Trigger. */
    delivery?: DeliverySpec;
  };
  /** What the Trigger controller last reported. */
  status?: ConditionedStatus & {
    /** The resolved URI of the subscriber. */
    subscriberUri?: string;
    /** CA certificates in PEM format of the subscriber. */
    subscriberCACerts?: string;
    /** The OIDC audience of the subscriber. */
    subscriberAudience?: string;
    /** The resolved URI of the dead letter sink; falls back to the Broker's. */
    deadLetterSinkUri?: string;
    /** CA certificates in PEM format of the dead letter sink. */
    deadLetterSinkCACerts?: string;
    /** The OIDC audience of the dead letter sink. */
    deadLetterSinkAudience?: string;
    /** Details used for OIDC authentication. */
    auth?: AuthStatus;
  };
}

/** A Knative Eventing Trigger, which sends matching events from a Broker to a subscriber. */
export class KnativeTrigger extends ConditionedKnativeCustomResource<KnativeTriggerResource> {
  static kind = 'Trigger';
  static apiName = 'triggers';
  static apiVersion = 'eventing.knative.dev/v1';
  static isNamespaced = true;

  /**
   * The plugin route that shows one Trigger.
   *
   * @returns The route name.
   */
  static get detailsRoute(): string {
    return 'knativeTriggerDetails';
  }

  /**
   * The plugin route that lists Triggers.
   *
   * @returns The route name.
   */
  static get listRoute(): KnativeListRouteName {
    return 'knativeTriggers';
  }

  /**
   * The Broker the Trigger takes events from.
   *
   * @returns The Broker's name from `spec.broker` or `spec.brokerRef`, with the namespace that
   * `spec.brokerRef` names, if any; undefined when the Trigger names no Broker.
   */
  get broker(): { name: string; namespace?: string } | undefined {
    return getTriggerBroker(this.spec);
  }

  /**
   * Where the Trigger sends matching events.
   *
   * @returns The subscriber: an object reference, a URI, or both; undefined when it has none.
   */
  get subscriber(): Destination | undefined {
    return this.spec?.subscriber;
  }
}
