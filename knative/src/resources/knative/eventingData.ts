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

import type { KubeCRD } from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { stringify } from 'yaml';
import type { Destination, KReference } from './common';
import type { KnativeResourceClass } from './customResourceLinks';
import type { KnativeTrigger } from './trigger';

const BROKER_CLASS_ANNOTATION = 'eventing.knative.dev/broker.class';

export const KNATIVE_SOURCE_KINDS: KnativeResourceClass[] = [
  {
    kind: 'ApiServerSource',
    apiName: 'apiserversources',
    apiVersion: 'sources.knative.dev/v1',
    isNamespaced: true,
  },
  {
    kind: 'ContainerSource',
    apiName: 'containersources',
    apiVersion: 'sources.knative.dev/v1',
    isNamespaced: true,
  },
  {
    kind: 'PingSource',
    apiName: 'pingsources',
    apiVersion: 'sources.knative.dev/v1',
    isNamespaced: true,
  },
  {
    kind: 'SinkBinding',
    apiName: 'sinkbindings',
    apiVersion: 'sources.knative.dev/v1',
    isNamespaced: true,
  },
];

/**
 * Picks the API version to request a CRD's resources with.
 *
 * @param spec - The CRD's group and versions.
 * @returns `<group>/<version>` of the version the CRD stores when it is served, otherwise of its
 * first served version, or undefined when it serves none.
 */
export function getPreferredApiVersion(
  spec: Pick<KubeCRD['spec'], 'group' | 'versions'>
): string | undefined {
  const version =
    spec.versions.find(item => item.served && item.storage) ??
    spec.versions.find(item => item.served);
  return version && `${spec.group}/${version.name}`;
}

/**
 * Reads what a Source class needs from a Source CRD.
 *
 * @param crd - A Source CRD.
 * @returns The kind, its plural name, scope and the API version to request, or undefined when the
 * CRD serves no version.
 */
export function getSourceKindInfo(crd: KubeCRD): KnativeResourceClass | undefined {
  const apiVersion = getPreferredApiVersion(crd.spec);
  return (
    apiVersion && {
      kind: crd.spec.names.kind,
      apiName: crd.spec.names.plural,
      apiVersion,
      isNamespaced: crd.spec.scope === 'Namespaced',
    }
  );
}

/**
 * Reads a Broker's class from its annotations.
 *
 * @param metadata - The Broker's metadata.
 * @returns The value of the `eventing.knative.dev/broker.class` annotation, or undefined when it
 * is not set.
 */
export function getBrokerClass(metadata: {
  /** Annotations of the Broker. */
  annotations?: Record<string, string>;
}): string | undefined {
  return metadata.annotations?.[BROKER_CLASS_ANNOTATION];
}

/**
 * Finds the Broker a Trigger takes events from, which it names in `spec.broker` or
 * `spec.brokerRef`.
 *
 * @param spec - The Trigger's spec, if it has one.
 * @returns The Broker's name, with the namespace that `spec.brokerRef` names, if any; undefined
 * when the Trigger names no Broker.
 */
export function getTriggerBroker(spec?: {
  /** Name of the Broker in the Trigger's namespace. */
  broker?: string;
  /** Reference to the Broker, which may be in another namespace. */
  brokerRef?: KReference;
}): { name: string; namespace?: string } | undefined {
  if (spec?.broker) {
    return { name: spec.broker };
  }

  return spec?.brokerRef?.name
    ? { name: spec.brokerRef.name, namespace: spec.brokerRef.namespace }
    : undefined;
}

/**
 * Formats a destination, such as a Trigger's or Subscription's subscriber, for display.
 *
 * @param destination - The destination, if there is one.
 * @returns `Kind/name` for an object reference (or whichever of the two is set), the URI on its
 * own, `Kind/name (uri)` when both are set, and an empty string when there is neither.
 */
export function formatDestination(destination?: Destination): string {
  if (!destination) {
    return '';
  }

  const ref = destination.ref;
  const target = ref ? [ref.kind, ref.name].filter(Boolean).join('/') : '';
  if (!target) {
    return destination.uri || '';
  }

  return destination.uri ? `${target} (${destination.uri})` : target;
}

/**
 * Formats the active Trigger filter as YAML, preserving its configured structure and values.
 *
 * @param spec - The Trigger's spec, if it has one.
 * @returns The active `filters` or legacy `filter` field as YAML, or undefined when neither
 * contains conditions.
 */
export function formatTriggerFilter(spec?: KnativeTrigger['spec']): string | undefined {
  const filter = spec?.filters?.length
    ? { filters: spec.filters }
    : Object.keys(spec?.filter?.attributes ?? {}).length
    ? { filter: spec?.filter }
    : undefined;

  return filter ? stringify(filter, { indent: 2, lineWidth: 0 }) : undefined;
}
