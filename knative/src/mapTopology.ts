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

import type {
  GraphEdge,
  GraphNodeStatus,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Traffic } from './resources/knative';
import type { KReference } from './resources/knative/common';
import { findReadyCondition, getFirstOwner } from './resources/knative/resourceData';

/**
 * Resource data consumed by the pure Knative Map topology builders.
 *
 * This is intentionally a projection rather than a complete Kubernetes schema. It contains the
 * identity and relationship fields shared by the Serving and Kubernetes resources displayed in
 * the Map. For example, a Route named `checkout` can be matched to Revision
 * `checkout-00004` without coupling these helpers to either resource class.
 */
export type TopologyResource = {
  /** Kubernetes API version used when a relationship requires an exact resource identity. */
  apiVersion?: string;
  /** Headlamp cluster identifier; resources from different clusters never match. */
  cluster?: string;
  /** Kubernetes kind used when a relationship requires an exact resource identity. */
  kind?: string;
  /** Kubernetes identity and controller ownership data used to create graph edges. */
  metadata: {
    name?: string;
    namespace?: string;
    ownerReferences?: Partial<KubeOwnerReference>[];
    uid?: string;
  };
  /** Parent Knative Service name derived from the `serving.knative.dev/service` label. */
  parentService?: string;
  /** Ready condition exposed directly by the Knative resource model when available. */
  readyCondition?: { status?: string };
  /** Resource-specific desired-state fields inspected by relationship builders. */
  spec?: any;
  /** Resource-specific observed-state fields inspected by relationship builders. */
  status?: any;
  /** Namespace selected by a cluster-scoped ClusterDomainClaim. */
  targetNamespace?: string;
};

/** A possibly unloaded list returned by a Headlamp resource hook. */
type ResourceList = TopologyResource[] | null | undefined;

/** Static API identity exposed by a Headlamp resource class. */
type ResourceClassIdentity = {
  apiVersion: string | string[];
  kind: string;
};

/** Owner-reference identity required when building one ownership relationship. */
type OwnerFilter = {
  apiVersionPrefix?: string;
  kind: string;
};

/**
 * Tests whether a raw Kubernetes object or Headlamp `KubeObject` belongs to a resource class.
 *
 * Headlamp instances keep `apiVersion` in `jsonData`, while stories and tests may supply raw
 * resource JSON. Both shapes are accepted so the Map glance uses the same identity check.
 */
export function matchesResourceClass(resource: any, resourceClass: ResourceClassIdentity): boolean {
  const resourceData = resource?.jsonData ?? resource;
  const apiVersions = Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion
    : [resourceClass.apiVersion];

  return (
    resourceData?.kind === resourceClass.kind &&
    apiVersions.some(apiVersion => resourceData?.apiVersion === apiVersion)
  );
}

function resourceUid(resource: TopologyResource): string | undefined {
  return resource.metadata.uid;
}

function resourceCluster(resource: TopologyResource): string {
  return resource.cluster ?? '';
}

function resourceNamespace(resource: TopologyResource): string {
  return resource.metadata.namespace ?? '';
}

/** Creates the cluster-and-namespace-scoped lookup key used by every name-based relationship. */
function namespacedKey(cluster: string, namespace: string, name: string): string {
  return `${cluster}|${namespace}|${name}`;
}

function indexNamespacedResources(resources: ResourceList): Map<string, TopologyResource> {
  const index = new Map<string, TopologyResource>();
  resources?.forEach(resource => {
    const name = resource.metadata.name;
    if (!name) return;
    const key = namespacedKey(resourceCluster(resource), resourceNamespace(resource), name);
    if (!index.has(key)) index.set(key, resource);
  });
  return index;
}

function findNamespacedResource(
  index: Map<string, TopologyResource>,
  source: TopologyResource,
  name: string | undefined,
  namespace = resourceNamespace(source)
): TopologyResource | undefined {
  if (!name) return undefined;
  return index.get(namespacedKey(resourceCluster(source), namespace, name));
}

function edge(
  source: TopologyResource,
  target: TopologyResource,
  relationship: string,
  label?: string
): GraphEdge | null {
  const sourceUid = resourceUid(source);
  const targetUid = resourceUid(target);
  if (!sourceUid || !targetUid) return null;

  return {
    id: `${relationship}:${sourceUid}:${targetUid}`,
    source: sourceUid,
    target: targetUid,
    ...(label ? { label } : {}),
  };
}

/** Keeps the first edge for each stable relationship/source/target edge ID. */
function deduplicateEdges(edges: Array<GraphEdge | null>): GraphEdge[] {
  const result = new Map<string, GraphEdge>();
  edges.forEach(item => {
    if (item && !result.has(item.id)) result.set(item.id, item);
  });
  return Array.from(result.values());
}

/**
 * Combines labels that point from one source to the same target into a single edge.
 *
 * A Route sending both `100%` and tagged `0% (candidate)` traffic to one Revision therefore
 * produces one edge with both labels instead of overlapping edges.
 */
function labeledEdges(
  source: TopologyResource,
  relationship: string,
  targets: Array<{ label: string; target: TopologyResource }>
): Array<GraphEdge | null> {
  const grouped = new Map<string, { labels: Set<string>; resource: TopologyResource }>();
  targets.forEach(({ label, target }) => {
    const targetUid = resourceUid(target);
    if (!targetUid) return;
    const entry = grouped.get(targetUid) ?? { labels: new Set<string>(), resource: target };
    entry.labels.add(label);
    grouped.set(targetUid, entry);
  });
  return Array.from(grouped.values(), ({ labels, resource }) =>
    edge(source, resource, relationship, Array.from(labels).join(', '))
  );
}

function matchesRef(ref: { apiVersion?: string; kind?: string }, filter?: OwnerFilter): boolean {
  if (!filter) return true;
  return (
    ref.kind === filter.kind &&
    (!filter.apiVersionPrefix || ref.apiVersion?.startsWith(filter.apiVersionPrefix) === true)
  );
}

/**
 * Converts a resource class identity into the owner-reference filter used by ownership edges.
 *
 * For `serving.knative.dev/v1 Service`, the result accepts Service owners from the
 * `serving.knative.dev/` API group while remaining version-tolerant.
 */
export function ownerFilterFor(resourceClass: {
  apiVersion: string | string[];
  kind: string;
}): OwnerFilter {
  const apiVersion = Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion[0]
    : resourceClass.apiVersion;
  const group = apiVersion.includes('/') ? `${apiVersion.split('/')[0]}/` : '';
  return group
    ? { apiVersionPrefix: group, kind: resourceClass.kind }
    : { kind: resourceClass.kind };
}

/**
 * Builds owner-reference edges from owner UID to child UID.
 *
 * Resources without an owner or the required owner and child UIDs are ignored, as are owners that
 * do not match the optional identity filter. The supplied relationship becomes part of the edge
 * ID, allowing multiple relationship types between the same graph nodes.
 */
export function makeOwnerEdges(
  resources: ResourceList,
  relationship: string,
  filter?: OwnerFilter
): GraphEdge[] {
  return deduplicateEdges(
    (resources ?? []).map(resource => {
      const owner = getFirstOwner(resource.metadata);
      const childUid = resourceUid(resource);
      if (!owner?.uid || !childUid || !matchesRef(owner, filter)) return null;

      return {
        id: `${relationship}:${owner.uid}:${childUid}`,
        source: owner.uid,
        target: childUid,
      };
    })
  );
}

/**
 * Tells whether a resource was created by an object of a class: whether its controlling owner, or
 * its first owner, is of that class, such as a channel that a Broker created.
 *
 * @param resource - The resource.
 * @param ownerClass - The class of the owner.
 * @returns Whether the resource's owner is of that class.
 */
export function isOwnedBy(resource: TopologyResource, ownerClass: ResourceClassIdentity): boolean {
  const owner = getFirstOwner(resource.metadata);
  return !!owner && matchesRef(owner, ownerFilterFor(ownerClass));
}

/**
 * Builds owner-reference edges from some owners only, such as from Sources to the Deployments they
 * run.
 *
 * @param resources - The resources, such as Deployments.
 * @param owners - The owners to build edges from, such as Sources.
 * @param relationship - The kind of relationship, which becomes part of each edge's ID.
 * @returns One edge for each resource whose owner is one of `owners`.
 */
export function makeOwnerEdgesFrom(
  resources: ResourceList,
  owners: TopologyResource[],
  relationship: string
): GraphEdge[] {
  const ownerUids = new Set(owners.map(resourceUid));
  return makeOwnerEdges(
    resources?.filter(resource => ownerUids.has(getFirstOwner(resource.metadata)?.uid)),
    relationship
  );
}

/**
 * Builds edges to resources from the owner of their owner, leaving out the owner in between, such
 * as from a Broker to the Service of the channel that the Broker created.
 *
 * @param resources - The resources, such as Services.
 * @param owners - The owners in between, such as the channels that Brokers created.
 * @param relationship - The kind of relationship, which becomes part of each edge's ID.
 * @returns One edge for each resource whose owner is one of `owners` and has an owner itself.
 */
export function makeIndirectOwnerEdges(
  resources: ResourceList,
  owners: TopologyResource[],
  relationship: string
): GraphEdge[] {
  const ownerOfOwner = new Map(
    owners.flatMap((owner): [string, string][] => {
      const uid = resourceUid(owner);
      const ownerUid = getFirstOwner(owner.metadata)?.uid;
      return uid && ownerUid ? [[uid, ownerUid]] : [];
    })
  );
  return deduplicateEdges(
    (resources ?? []).map(resource => {
      const ownerUid = getFirstOwner(resource.metadata)?.uid;
      const source = ownerUid && ownerOfOwner.get(ownerUid);
      const target = resourceUid(resource);
      return source && target
        ? { id: `${relationship}:${source}:${target}`, source, target }
        : null;
    })
  );
}

/** The objects a reference can point to, with the class that gives their API group and kind. */
export type ReferenceTargets = {
  /** The class of the objects. */
  resourceClass: ResourceClassIdentity;
  /** The objects, or null while they load. */
  items: ResourceList;
}[];

/** The objects references can point to, by their reference key. */
export type ReferenceIndex = ReadonlyMap<string, TopologyResource>;

/** An object a resource sends events to, and how the edge to it is named. */
export type DestinationReference = {
  /** The kind of relationship, which keeps edges of different kinds to one object apart. */
  relationship: string;
  /** The object the events go to; a destination given only as a URI has none. */
  ref?: KReference;
  /** The edge's label, such as `dead letter sink`. */
  label?: string;
};

/**
 * Builds the lookup key of a referenced object: its cluster, API group, kind, namespace and name.
 *
 * @param cluster - Cluster of the object.
 * @param apiVersion - API version of the object; only its group is used.
 * @param kind - Kind of the object.
 * @param namespace - Namespace of the object.
 * @param name - Name of the object.
 * @returns The key.
 */
function referenceKey(
  cluster: string,
  apiVersion: string,
  kind: string,
  namespace: string,
  name: string
): string {
  const group = apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
  return `${cluster}|${group}|${kind}|${namespace}|${name}`;
}

/**
 * Indexes the objects that references can point to, so that edges to them can be found.
 *
 * @param targets - The objects, by class.
 * @returns The objects by their reference key.
 */
export function indexReferenceTargets(targets: ReferenceTargets): ReferenceIndex {
  const index = new Map<string, TopologyResource>();
  targets.forEach(({ resourceClass, items }) => {
    const apiVersion = Array.isArray(resourceClass.apiVersion)
      ? resourceClass.apiVersion[0]
      : resourceClass.apiVersion;
    items?.forEach(item => {
      const name = item.metadata.name;
      if (!name) return;
      index.set(
        referenceKey(
          resourceCluster(item),
          apiVersion,
          resourceClass.kind,
          resourceNamespace(item),
          name
        ),
        item
      );
    });
  });
  return index;
}

/**
 * Finds the object a reference points to, in the referring object's cluster.
 *
 * @param index - The objects references can point to.
 * @param holder - The object that holds the reference.
 * @param ref - The reference.
 * @returns The object, or undefined when the reference names none of the indexed objects or
 * has no API version, which a cluster without Knative's webhook accepts.
 */
function findReferenceTarget(
  index: ReferenceIndex,
  holder: TopologyResource,
  ref: KReference | undefined
): TopologyResource | undefined {
  if (!ref?.apiVersion || !ref.kind || !ref.name) return undefined;
  return index.get(
    referenceKey(
      resourceCluster(holder),
      ref.apiVersion,
      ref.kind,
      ref.namespace || resourceNamespace(holder),
      ref.name
    )
  );
}

/**
 * Builds edges from each resource to the objects it sends events to, such as a Source to its sink
 * or a Trigger to its subscriber and dead letter sink. A destination given only as a URI, or one
 * whose object is not loaded, has no edge.
 *
 * @param resources - The resources.
 * @param index - The objects the destinations can point to.
 * @param getDestinations - Reads a resource's destinations.
 * @returns One edge per destination found.
 */
export function makeDestinationEdges<T extends TopologyResource>(
  resources: T[] | null | undefined,
  index: ReferenceIndex,
  getDestinations: (resource: T) => DestinationReference[]
): GraphEdge[] {
  return deduplicateEdges(
    (resources ?? []).flatMap(resource =>
      getDestinations(resource).map(({ relationship, ref, label }) => {
        const target = findReferenceTarget(index, resource, ref);
        return target ? edge(resource, target, relationship, label) : null;
      })
    )
  );
}

/**
 * Builds edges from the object each resource references to the resource, in the direction events
 * flow, such as from a Broker to its Trigger or from a channel to its Subscription.
 *
 * @param resources - The resources.
 * @param index - The objects the references can point to.
 * @param relationship - The kind of relationship, which becomes part of each edge's ID.
 * @param getReference - Reads a resource's reference.
 * @returns One edge per reference found.
 */
export function makeReferrerEdges<T extends TopologyResource>(
  resources: T[] | null | undefined,
  index: ReferenceIndex,
  relationship: string,
  getReference: (resource: T) => KReference | undefined
): GraphEdge[] {
  return deduplicateEdges(
    (resources ?? []).map(resource => {
      const target = findReferenceTarget(index, resource, getReference(resource));
      return target ? edge(target, resource, relationship) : null;
    })
  );
}

function trafficLabel(target: Traffic): string {
  const percent = `${target.percent ?? 0}%`;
  return target.tag ? `${percent} (${target.tag})` : percent;
}

/** Uses resolved Route status traffic when available, otherwise the requested spec traffic. */
function effectiveTraffic(route: TopologyResource): Traffic[] {
  return route.status?.traffic?.length ? route.status.traffic : route.spec?.traffic ?? [];
}

/**
 * Connects each Route to the Revision or Configuration selected by its effective traffic.
 *
 * Resolved `revisionName` targets take precedence. A latest-revision target without a resolved
 * Revision falls back to its Configuration, using the parent Service name when necessary. Edge
 * labels include percentages and tags, such as `100%` and `0% (candidate)`.
 */
export function makeRouteTrafficEdges(
  routes: ResourceList,
  revisions: ResourceList,
  configurations: ResourceList
): GraphEdge[] {
  const revisionIndex = indexNamespacedResources(revisions);
  const configurationIndex = indexNamespacedResources(configurations);

  return deduplicateEdges(
    (routes ?? []).flatMap(route =>
      labeledEdges(
        route,
        'route-traffic',
        effectiveTraffic(route).flatMap(traffic => {
          const configurationName =
            traffic.configurationName || (traffic.latestRevision ? route.parentService : undefined);
          const target =
            findNamespacedResource(revisionIndex, route, traffic.revisionName) ??
            findNamespacedResource(configurationIndex, route, configurationName);
          return target ? [{ label: trafficLabel(traffic), target }] : [];
        })
      )
    )
  );
}

/** Indexes effective Route traffic by revision within the same cluster and namespace. */
export function indexRevisionTraffic(routes: ResourceList): Map<string, Traffic[]> {
  const trafficByRevision = new Map<string, Traffic[]>();
  routes?.forEach(route => {
    effectiveTraffic(route).forEach(target => {
      if (!target.revisionName) return;
      const key = namespacedKey(
        resourceCluster(route),
        resourceNamespace(route),
        target.revisionName
      );
      const targets = trafficByRevision.get(key) ?? [];
      targets.push(target);
      trafficByRevision.set(key, targets);
    });
  });
  return trafficByRevision;
}

/** Returns all effective Route traffic targets that name the supplied Revision. */
export function getRevisionTraffic(
  revision: TopologyResource,
  trafficByRevision: Map<string, Traffic[]>
): Traffic[] {
  const name = revision.metadata.name;
  if (!name) return [];
  return (
    trafficByRevision.get(
      namespacedKey(resourceCluster(revision), resourceNamespace(revision), name)
    ) ?? []
  );
}

/**
 * Connects a cluster-scoped ClusterDomainClaim to the same-named DomainMapping in its target
 * namespace. Claims without a target namespace or matching mapping do not produce an edge.
 */
export function makeClusterDomainClaimEdges(
  claims: ResourceList,
  domainMappings: ResourceList
): GraphEdge[] {
  const domainMappingIndex = indexNamespacedResources(domainMappings);
  return deduplicateEdges(
    (claims ?? []).map(claim => {
      const namespace = claim.targetNamespace ?? claim.spec?.namespace ?? '';
      const domainMapping = findNamespacedResource(
        domainMappingIndex,
        claim,
        claim.metadata.name,
        namespace
      );
      return domainMapping ? edge(claim, domainMapping, 'claim-domain-mapping') : null;
    })
  );
}

/**
 * Connects DomainMappings to referenced Knative Services.
 *
 * Core Kubernetes Service references and references outside `serving.knative.dev` are
 * intentionally ignored because this edge represents the Knative addressable relationship.
 */
export function makeDomainMappingTargetEdges(
  domainMappings: ResourceList,
  services: ResourceList
): GraphEdge[] {
  const serviceIndex = indexNamespacedResources(services);
  return deduplicateEdges(
    (domainMappings ?? []).map(domainMapping => {
      const ref = domainMapping.spec?.ref;
      if (!ref || !matchesRef(ref, { apiVersionPrefix: 'serving.knative.dev/', kind: 'Service' })) {
        return null;
      }

      const service = findNamespacedResource(
        serviceIndex,
        domainMapping,
        ref.name,
        ref.namespace ?? resourceNamespace(domainMapping)
      );
      return service ? edge(domainMapping, service, 'domain-mapping-target') : null;
    })
  );
}

/** Connects each PodAutoscaler to its referenced `apps/v1 Deployment` in the same scope. */
export function makePodAutoscalerTargetEdges(
  podAutoscalers: ResourceList,
  deployments: ResourceList
): GraphEdge[] {
  const deploymentIndex = indexNamespacedResources(deployments);
  return deduplicateEdges(
    (podAutoscalers ?? []).map(podAutoscaler => {
      const ref = podAutoscaler.spec?.scaleTargetRef;
      if (ref?.kind !== 'Deployment' || ref.apiVersion !== 'apps/v1') return null;
      const deployment = findNamespacedResource(deploymentIndex, podAutoscaler, ref.name);
      return deployment ? edge(podAutoscaler, deployment, 'autoscaler-target') : null;
    })
  );
}

/** Connects each autoscaling Metric to the Kubernetes Service named by `spec.scrapeTarget`. */
export function makeMetricTargetEdges(metrics: ResourceList, services: ResourceList): GraphEdge[] {
  const serviceIndex = indexNamespacedResources(services);
  return deduplicateEdges(
    (metrics ?? []).map(metric => {
      const service = findNamespacedResource(serviceIndex, metric, metric.spec?.scrapeTarget);
      return service ? edge(metric, service, 'metric-scrape-target') : null;
    })
  );
}

/**
 * Connects each image-resolution resource to its Kubernetes ServiceAccount.
 *
 * Knative uses the `default` ServiceAccount when `spec.serviceAccountName` is omitted, so the Map
 * applies the same fallback.
 */
export function makeImageServiceAccountEdges(
  images: ResourceList,
  serviceAccounts: ResourceList
): GraphEdge[] {
  const serviceAccountIndex = indexNamespacedResources(serviceAccounts);
  return deduplicateEdges(
    (images ?? []).map(image => {
      const serviceAccount = findNamespacedResource(
        serviceAccountIndex,
        image,
        image.spec?.serviceAccountName || 'default'
      );
      return serviceAccount ? edge(image, serviceAccount, 'image-service-account') : null;
    })
  );
}

/**
 * Connects each KIngress to the Kubernetes Services referenced by its HTTP backend splits.
 * Duplicate backends are collapsed and their percentage labels are combined per target.
 */
export function makeIngressBackendEdges(
  ingresses: ResourceList,
  services: ResourceList
): GraphEdge[] {
  const serviceIndex = indexNamespacedResources(services);
  return deduplicateEdges(
    (ingresses ?? []).flatMap(ingress =>
      labeledEdges(
        ingress,
        'ingress-backend',
        (ingress.spec?.rules ?? []).flatMap(rule =>
          (rule.http?.paths ?? []).flatMap(path =>
            (path.splits ?? []).flatMap(split => {
              const service = findNamespacedResource(
                serviceIndex,
                ingress,
                split.serviceName,
                split.serviceNamespace ?? resourceNamespace(ingress)
              );
              return service ? [{ label: `${split.percent ?? 0}%`, target: service }] : [];
            })
          )
        )
      )
    )
  );
}

/** Connects each KIngress TLS entry to its referenced Kubernetes Secret. */
export function makeIngressSecretEdges(
  ingresses: ResourceList,
  secrets: ResourceList
): GraphEdge[] {
  const secretIndex = indexNamespacedResources(secrets);
  return deduplicateEdges(
    (ingresses ?? []).flatMap(ingress =>
      (ingress.spec?.tls ?? []).map(tls => {
        const secret = findNamespacedResource(
          secretIndex,
          ingress,
          tls.secretName,
          tls.secretNamespace ?? resourceNamespace(ingress)
        );
        return secret ? edge(ingress, secret, 'ingress-tls-secret') : null;
      })
    )
  );
}

/**
 * Connects each ServerlessService to its target Deployment and generated public/private Services.
 * Missing status names are normal while Knative reconciles and do not produce placeholder edges.
 */
export function makeServerlessServiceTargetEdges(
  serverlessServices: ResourceList,
  deployments: ResourceList,
  services: ResourceList
): GraphEdge[] {
  const deploymentIndex = indexNamespacedResources(deployments);
  const serviceIndex = indexNamespacedResources(services);
  const edges: Array<GraphEdge | null> = [];

  (serverlessServices ?? []).forEach(serverlessService => {
    const ref = serverlessService.spec?.objectRef;
    if (ref?.kind === 'Deployment' && ref.apiVersion === 'apps/v1') {
      const deployment = findNamespacedResource(
        deploymentIndex,
        serverlessService,
        ref.name,
        ref.namespace ?? resourceNamespace(serverlessService)
      );
      if (deployment) {
        edges.push(edge(serverlessService, deployment, 'serverless-service-target'));
      }
    }

    [serverlessService.status?.serviceName, serverlessService.status?.privateServiceName].forEach(
      serviceName => {
        const service = findNamespacedResource(serviceIndex, serverlessService, serviceName);
        if (service) {
          edges.push(edge(serverlessService, service, 'serverless-service-service'));
        }
      }
    );
  });

  return deduplicateEdges(edges);
}

/** Connects each Knative Certificate to the Kubernetes Secret that stores its issued key pair. */
export function makeCertificateSecretEdges(
  certificates: ResourceList,
  secrets: ResourceList
): GraphEdge[] {
  const secretIndex = indexNamespacedResources(secrets);
  return deduplicateEdges(
    (certificates ?? []).map(certificate => {
      const secret = findNamespacedResource(secretIndex, certificate, certificate.spec?.secretName);
      return secret ? edge(certificate, secret, 'certificate-secret') : null;
    })
  );
}

/** Returns the model-provided Ready condition, or finds it in raw resource status. */
export function getReadyCondition(resource: TopologyResource): { status?: string } | undefined {
  return resource.readyCondition ?? findReadyCondition(resource.status);
}

/** Maps Kubernetes Ready values to Headlamp graph colors: success, error, or warning. */
export function getReadyNodeStatus(resource: TopologyResource): GraphNodeStatus {
  const ready = getReadyCondition(resource);
  if (ready?.status === 'True') return 'success';
  if (ready?.status === 'False') return 'error';
  return 'warning';
}
