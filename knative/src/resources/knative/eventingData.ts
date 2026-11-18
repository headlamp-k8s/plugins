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

import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import type { QueryListResponse } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/hooks';
import type { KubeCRD } from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { stringify } from 'yaml';
import type { CustomResourceDefinition } from '../k8s/customResourceDefinition';
import type { Destination, KReference } from './common';
import { getKnativeCrdName, type KnativeResourceClass } from './customResourceLinks';
import type { KnativeTrigger } from './trigger';

const BROKER_CLASS_ANNOTATION = 'eventing.knative.dev/broker.class';

export const KNATIVE_SOURCE_KINDS: KnativeResourceClass[] = [
  ['ApiServerSource', 'apiserversources'],
  ['ContainerSource', 'containersources'],
  ['PingSource', 'pingsources'],
  ['SinkBinding', 'sinkbindings'],
].map(([kind, apiName]) => ({
  kind,
  apiName,
  apiVersion: 'sources.knative.dev/v1',
  isNamespaced: true,
}));

export const KNATIVE_CHANNEL_IMPLEMENTATION_KINDS: KnativeResourceClass[] = [
  {
    kind: 'InMemoryChannel',
    apiName: 'inmemorychannels',
    apiVersion: 'messaging.knative.dev/v1',
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
 * Reads what a class for a CRD's kind needs from the CRD, such as a Source or channel
 * implementation CRD.
 *
 * @param crd - The CRD.
 * @returns The kind, its plural name, scope and the API version to request, or undefined when the
 * CRD serves no version.
 */
export function getCrdKindInfo(crd: KubeCRD): KnativeResourceClass | undefined {
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
 * Tells whether an error of a list of several clusters is one of a cluster's errors.
 *
 * @param error - The error, with its cluster when it is known.
 * @param cluster - The cluster.
 * @returns Whether the error names the cluster or names no cluster, which counts for every
 * cluster.
 */
export function isClusterError(error: Pick<ApiError, 'cluster'>, cluster: string): boolean {
  return !error.cluster || error.cluster === cluster;
}

/**
 * Finds the clusters whose CRDs could not be listed, for example because the user may not list
 * CRDs there.
 *
 * @param clusters - The selected clusters.
 * @param crds - The CRDs found, each with the cluster it was found in.
 * @param errors - The errors of the CRD list, each with its cluster when it is known.
 * @returns The clusters with no CRD found and an error, or every cluster with no CRD found when
 * an error names no cluster.
 */
export function getClustersWithoutCrds(
  clusters: string[],
  crds: Pick<CustomResourceDefinition, 'cluster'>[] | null | undefined,
  errors: Pick<ApiError, 'cluster'>[] | null | undefined
): string[] {
  return clusters.filter(
    cluster =>
      !crds?.some(crd => crd.cluster === cluster) &&
      errors?.some(error => isClusterError(error, cluster))
  );
}

/**
 * Tells whether every cluster of a list of several clusters has answered. The list can stop
 * loading while a slower cluster has not answered yet: a cluster has a result once it answers,
 * and an error once it fails.
 *
 * @param clusters - The clusters listed.
 * @param clusterResults - The list's results, by the cluster that answered.
 * @param errors - The list's errors, each with its cluster when it is known.
 * @returns Whether every cluster has a result or an error, counting an error that names no
 * cluster against every cluster.
 */
export function hasEveryClusterAnswered(
  clusters: string[],
  clusterResults: QueryListResponse<unknown, unknown, ApiError>['clusterResults'],
  errors: Pick<ApiError, 'cluster'>[] | null | undefined
): boolean {
  return clusters.every(
    cluster =>
      clusterResults?.[cluster] !== undefined ||
      errors?.some(error => isClusterError(error, cluster))
  );
}

/**
 * Ranks a Kubernetes API version the way Kubernetes orders versions: a stable version before a
 * beta before an alpha, then the higher number first, and a version of any other form last.
 *
 * @param version - The version, such as `v1beta2`.
 * @returns The stability, the major number and the beta or alpha number; a higher rank comes first.
 */
function versionRank(version: string): number[] {
  const match = /^v(\d+)(?:(alpha|beta)(\d+))?$/.exec(version);
  if (!match) return [0, 0, 0];
  const [, major, stage, minor = '0'] = match;
  return [stage === 'alpha' ? 1 : stage === 'beta' ? 2 : 3, Number(major), Number(minor)];
}

/**
 * Finds how to list one kind the plugin knows: the API version that the most clusters with the
 * kind's CRD serve, preferring a version that a CRD prefers and then the newest, and the clusters
 * that serve it. Knative's own kinds are also listed in the clusters whose CRDs could not be
 * listed.
 *
 * @param kind - The kind, with the API version to request when no CRD names another.
 * @param crds - The CRDs found, each with the cluster it was found in.
 * @param clustersWithoutCrds - The clusters whose CRDs could not be listed.
 * @param fallbackKinds - Knative's own kinds.
 * @returns The kind with the version to request, the clusters to list it in, and the clusters
 * with the kind's CRD that do not serve that version.
 */
export function findKnownKind(
  kind: KnativeResourceClass,
  crds: Pick<CustomResourceDefinition, 'cluster' | 'jsonData'>[],
  clustersWithoutCrds: string[],
  fallbackKinds: KnativeResourceClass[]
): {
  /** The kind, with the API version to request. */
  info: KnativeResourceClass;
  /** The clusters to list the kind in. */
  clusters: string[];
  /** The clusters with the kind's CRD that are left out, as it does not serve the version. */
  clustersLeftOut: string[];
} {
  const crdName = getKnativeCrdName(kind);
  const installed = crds.flatMap(crd => {
    const info = crd.jsonData.metadata.name === crdName && getCrdKindInfo(crd.jsonData);
    return info ? [{ cluster: crd.cluster, crd: crd.jsonData, info }] : [];
  });
  const serves = (crd: KubeCRD, apiVersion: KnativeResourceClass['apiVersion']) =>
    crd.spec.versions.some(
      version => version.served && [apiVersion].flat().includes(`${crd.spec.group}/${version.name}`)
    );
  const rank = (apiVersion: string) => [
    installed.filter(item => serves(item.crd, apiVersion)).length,
    installed.some(item => item.info.apiVersion === apiVersion) ? 1 : 0,
    ...versionRank(apiVersion.split('/')[1] ?? ''),
  ];
  const [apiVersion] = installed
    .flatMap(item =>
      item.crd.spec.versions
        .filter(version => version.served)
        .map(version => `${item.crd.spec.group}/${version.name}`)
    )
    .sort((left, right) => {
      const leftRank = rank(left);
      const rightRank = rank(right);
      const index = leftRank.findIndex((value, position) => value !== rightRank[position]);
      return index < 0 ? 0 : rightRank[index] - leftRank[index];
    });
  const info = installed[0] && apiVersion ? { ...installed[0].info, apiVersion } : kind;
  const isKnativeKind = fallbackKinds.some(fallback => getKnativeCrdName(fallback) === crdName);
  return {
    info,
    clusters: [
      ...installed.filter(item => serves(item.crd, info.apiVersion)).map(item => item.cluster),
      ...(isKnativeKind ? clustersWithoutCrds : []),
    ],
    clustersLeftOut: installed
      .filter(item => !serves(item.crd, info.apiVersion))
      .map(item => item.cluster),
  };
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

  return filter ? toYaml(filter) : undefined;
}

/**
 * Writes a value as YAML the way the plugin shows configuration: two-space indents and no line
 * wrapping.
 *
 * @param value - The value to write.
 * @returns The YAML.
 */
export function toYaml(value: unknown): string {
  return stringify(value, { indent: 2, lineWidth: 0 });
}
