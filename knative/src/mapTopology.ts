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
import { findReadyCondition, getFirstOwner } from './resources/knative/resourceData';

export type TopologyResource = {
  apiVersion?: string;
  cluster?: string;
  kind?: string;
  metadata: {
    name?: string;
    namespace?: string;
    ownerReferences?: Partial<KubeOwnerReference>[];
    uid?: string;
  };
  parentService?: string;
  readyCondition?: { status?: string };
  spec?: any;
  status?: any;
  targetNamespace?: string;
};

type ResourceList = TopologyResource[] | null | undefined;

type ResourceClassIdentity = {
  apiVersion: string | string[];
  kind: string;
};

type OwnerFilter = {
  apiVersionPrefix?: string;
  kind: string;
};

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

function deduplicateEdges(edges: Array<GraphEdge | null>): GraphEdge[] {
  const result = new Map<string, GraphEdge>();
  edges.forEach(item => {
    if (item && !result.has(item.id)) result.set(item.id, item);
  });
  return Array.from(result.values());
}

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

function trafficLabel(target: Traffic): string {
  const percent = `${target.percent ?? 0}%`;
  return target.tag ? `${percent} (${target.tag})` : percent;
}

function effectiveTraffic(route: TopologyResource): Traffic[] {
  return route.status?.traffic?.length ? route.status.traffic : route.spec?.traffic ?? [];
}

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

export function makeMetricTargetEdges(metrics: ResourceList, services: ResourceList): GraphEdge[] {
  const serviceIndex = indexNamespacedResources(services);
  return deduplicateEdges(
    (metrics ?? []).map(metric => {
      const service = findNamespacedResource(serviceIndex, metric, metric.spec?.scrapeTarget);
      return service ? edge(metric, service, 'metric-scrape-target') : null;
    })
  );
}

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

export function getReadyCondition(resource: TopologyResource): { status?: string } | undefined {
  return resource.readyCondition ?? findReadyCondition(resource.status);
}

export function getReadyNodeStatus(resource: TopologyResource): GraphNodeStatus {
  const ready = getReadyCondition(resource);
  if (ready?.status === 'True') return 'success';
  if (ready?.status === 'False') return 'error';
  return 'warning';
}
