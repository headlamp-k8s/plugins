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

/** Whether a condition holds: `True`, `False` or `Unknown`. */
export type ConditionStatus = 'True' | 'False' | 'Unknown';

/** One observation of a Knative resource's current state. */
export interface Condition {
  /** Type of the condition, for example `Ready`. */
  type: string;
  /** Status of the condition: `True`, `False` or `Unknown`. */
  status: ConditionStatus;
  /** How failures of this condition are treated; when unset, they count as `Error`. */
  severity?: string;
  /** When the condition last changed from one status to another. */
  lastTransitionTime?: string;
  /** The reason for the condition's last change. */
  reason?: string;
  /** A human-readable message with details about the last change. */
  message?: string;
}

/** A reference to a Kubernetes object, as Knative's `KReference` defines it. */
export interface KReference {
  /** API version of the referenced object. */
  apiVersion?: string;
  /** Kind of the referenced object. */
  kind?: string;
  /** Name of the referenced object. */
  name?: string;
  /**
   * Namespace of the referenced object. Where Knative lets it be left out, it defaults to the
   * namespace of the object holding the reference.
   */
  namespace?: string;
}

/** Where events are sent, as Knative's `Destination` defines it: a reference, a URI, or both. */
export interface Destination {
  /** Points to an Addressable object. */
  ref?: KReference;
  /**
   * An absolute URL with a non-empty scheme and host, or a URI relative to the address resolved
   * from `ref`.
   */
  uri?: string;
  /** CA certificates in PEM format that the sender trusts when sending events to the sink. */
  CACerts?: string;
  /**
   * The OIDC audience. Only needed when the target is not an Addressable; when set, it takes
   * precedence over the target's audience.
   */
  audience?: string;
}

/**
 * How events are delivered and retried, as Knative's `DeliverySpec` defines it. The CRDs keep
 * unknown fields here, so `timeout`, `retryAfterMax` and, on a Broker, `format` are stored
 * although their schemas do not list them.
 */
export interface DeliverySpec {
  /** The sink that receives events that could not be delivered. */
  deadLetterSink?: Destination;
  /** The minimum number of retries before an event goes to the dead letter sink. */
  retry?: number;
  /** The retry backoff policy: `linear` or `exponential`. */
  backoffPolicy?: string;
  /**
   * The delay before retrying, as an ISO 8601 duration such as `PT1S`. With the `linear` policy
   * the delay is `backoffDelay * <numberOfRetries>`; with `exponential` it is
   * `backoffDelay * 2^<numberOfRetries>`.
   */
  backoffDelay?: string;
  /** How the event is serialized in the HTTP request: `json`, `binary`, or unset. */
  format?: string;
  /**
   * The timeout of each delivery attempt, as an ISO 8601 duration greater than zero. Needs
   * Knative's `delivery-timeout` feature.
   */
  timeout?: string;
  /**
   * The longest `Retry-After` delay to respect when retrying after a 429 or 503 response, as an
   * ISO 8601 duration; `PT0S` ignores `Retry-After`. Only applies when `retry` is set, and needs
   * Knative's `delivery-retryafter` feature.
   */
  retryAfterMax?: string;
}

/** An address where a Knative resource accepts events, as Knative's `Addressable` defines it. */
export interface Addressable {
  /** Name of the address, for example `http`. */
  name?: string;
  /** URL of the address. */
  url?: string;
  /** CA certificates in PEM format of the address. */
  CACerts?: string;
  /** The OIDC audience of the address. */
  audience?: string;
}

/** An EventPolicy applied to a resource. */
export interface AppliedEventPolicyRef {
  /**
   * API version of the applied EventPolicy, which is the EventPolicy version the resource
   * supports.
   */
  apiVersion?: string;
  /** Name of the applied EventPolicy. */
  name?: string;
}

/** Details used for OIDC authentication, as Knative's `AuthStatus` defines them. */
export interface AuthStatus {
  /** The generated service account used for OIDC authentication. */
  serviceAccountName?: string;
  /** Every generated service account used for OIDC authentication. */
  serviceAccountNames?: string[];
}
