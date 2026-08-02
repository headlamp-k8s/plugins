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

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import type {
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { useMemo } from 'react';
import { knativeMapSourceConfig } from './mapSourceConfig';
import {
  getReadyCondition,
  getReadyNodeStatus,
  getRevisionTraffic,
  indexRevisionTraffic,
  makeCertificateSecretEdges,
  makeClusterDomainClaimEdges,
  makeDomainMappingTargetEdges,
  makeImageServiceAccountEdges,
  makeIngressBackendEdges,
  makeIngressSecretEdges,
  makeMetricTargetEdges,
  makeOwnerEdges,
  makePodAutoscalerTargetEdges,
  makeRouteTrafficEdges,
  makeServerlessServiceTargetEdges,
  matchesResourceClass,
  ownerFilterFor,
  type TopologyResource,
} from './mapTopology';
import {
  ClusterDomainClaim,
  getKnativeCrdName,
  KnativeCertificate,
  KnativeConfiguration,
  KnativeDomainMapping,
  KnativeImage,
  KnativeIngress,
  KnativeMetric,
  KnativePodAutoscaler,
  KnativeRoute,
  KnativeServerlessService,
  KRevision,
  KService,
  type Traffic,
} from './resources/knative';
import { formatList, formatNanoseconds, formatTraffic } from './utils/servingResources';
import { getSafeUrl } from './utils/url';

const { Deployment, Secret, Service, ServiceAccount } = K8s.ResourceClasses;
const { servingApi: servingApiConfig, servingInternals: servingInternalsConfig } =
  knativeMapSourceConfig.groups;

type MapNode = GraphNode & {
  traffic?: Traffic[];
};

type ResourceClass = {
  apiName: string;
  apiVersion: string | string[];
  kind: string;
};

function readyValue(item: any): string {
  return getReadyCondition(item)?.status ?? 'Unknown';
}

function resourceCoordinates(node: any) {
  return {
    name: node.kubeObject.jsonData.metadata.name,
    namespace: node.kubeObject.jsonData.metadata.namespace,
  };
}

function makeDetailsComponent(
  resourceType: any,
  rows: (item: any, node: MapNode) => Array<{ name: string; value: any }>
) {
  return ({ node }: { node: any }) => (
    <DetailsGrid
      resourceType={resourceType}
      {...resourceCoordinates(node)}
      withEvents
      extraInfo={item => (item ? rows(item, node) : null)}
    />
  );
}

const KServiceDetails = makeDetailsComponent(KService, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'URL', value: item.url || '-' },
  { name: 'Latest Created', value: item.status?.latestCreatedRevisionName || '-' },
  { name: 'Latest Ready', value: item.status?.latestReadyRevisionName || '-' },
]);

const ConfigurationDetails = makeDetailsComponent(KnativeConfiguration, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Service', value: item.parentService || '-' },
  { name: 'Latest Created', value: item.status?.latestCreatedRevisionName || '-' },
  { name: 'Latest Ready', value: item.status?.latestReadyRevisionName || '-' },
]);

const RevisionDetails = makeDetailsComponent(KRevision, (item, node) => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Parent Service', value: item.parentService || '-' },
  { name: 'Image', value: item.primaryImage || '-' },
  { name: 'Container Concurrency', value: item.spec?.containerConcurrency ?? 'Default' },
  { name: 'Traffic', value: formatTraffic(node.traffic) },
]);

const RouteDetails = makeDetailsComponent(KnativeRoute, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Service', value: item.parentService || '-' },
  { name: 'URL', value: getSafeUrl(item.url) || '-' },
  { name: 'Traffic', value: formatTraffic(item.traffic) },
]);

const DomainMappingDetails = makeDetailsComponent(KnativeDomainMapping, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Host', value: item.host || '-' },
  { name: 'Target', value: item.spec?.ref?.name || '-' },
  { name: 'Target Kind', value: item.spec?.ref?.kind || '-' },
  { name: 'URL', value: item.readyUrl || '-' },
]);

const ClusterDomainClaimDetails = makeDetailsComponent(ClusterDomainClaim, item => [
  { name: 'Domain', value: item.metadata?.name || '-' },
  { name: 'Owner Namespace', value: item.targetNamespace || '-' },
]);

const ImageDetails = makeDetailsComponent(KnativeImage, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Revision', value: item.revisionName || '-' },
  { name: 'Image', value: item.spec?.image || '-' },
  { name: 'Service Account', value: item.spec?.serviceAccountName || 'default' },
]);

const PodAutoscalerDetails = makeDetailsComponent(KnativePodAutoscaler, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Revision', value: item.revisionName || '-' },
  { name: 'Desired Scale', value: item.status?.desiredScale ?? '-' },
  { name: 'Actual Scale', value: item.status?.actualScale ?? '-' },
]);

const MetricDetails = makeDetailsComponent(KnativeMetric, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Revision', value: item.revisionName || '-' },
  { name: 'Scrape Target', value: item.spec?.scrapeTarget || '-' },
  { name: 'Stable Window', value: formatNanoseconds(item.spec?.stableWindow) },
  { name: 'Panic Window', value: formatNanoseconds(item.spec?.panicWindow) },
]);

const IngressDetails = makeDetailsComponent(KnativeIngress, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Owner', value: item.owner?.name || '-' },
  { name: 'Hosts', value: formatList(item.hosts) },
]);

const ServerlessServiceDetails = makeDetailsComponent(KnativeServerlessService, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Revision', value: item.revisionName || '-' },
  { name: 'Mode', value: item.spec?.mode || '-' },
  { name: 'Public Service', value: item.status?.serviceName || '-' },
  { name: 'Private Service', value: item.status?.privateServiceName || '-' },
]);

const CertificateDetails = makeDetailsComponent(KnativeCertificate, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Owner', value: item.owner?.name || '-' },
  { name: 'DNS Names', value: formatList(item.spec?.dnsNames) },
  { name: 'Secret', value: item.spec?.secretName || '-' },
  { name: 'Expiry', value: item.status?.notAfter || '-' },
]);

function makeNode(
  resource: any,
  resourceClass: ResourceClass,
  detailsComponent: MapNode['detailsComponent'],
  data: Partial<MapNode> = {}
): MapNode {
  return {
    id: resource.metadata.uid,
    kubeObject: resource,
    customResourceDefinition: getKnativeCrdName(resourceClass as any),
    detailsComponent,
    weight: 1100,
    status: getReadyNodeStatus(resource as TopologyResource),
    ...data,
  };
}

const sourceIcon = (
  <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />
);

const knativeServiceSource: GraphSource = {
  ...servingApiConfig.sources.service,
  icon: sourceIcon,
  useData() {
    const [services] = KService.useList();
    return useMemo(
      () =>
        services
          ? { nodes: services.map(service => makeNode(service, KService, KServiceDetails)) }
          : null,
      [services]
    );
  },
};

const knativeConfigurationSource: GraphSource = {
  ...servingApiConfig.sources.configuration,
  icon: sourceIcon,
  useData() {
    const [configurations] = KnativeConfiguration.useList();
    return useMemo(
      () =>
        configurations
          ? {
              nodes: configurations.map(configuration =>
                makeNode(configuration, KnativeConfiguration, ConfigurationDetails)
              ),
              edges: makeOwnerEdges(
                configurations,
                'service-configuration',
                ownerFilterFor(KService)
              ),
            }
          : null,
      [configurations]
    );
  },
};

const knativeRevisionSource: GraphSource = {
  ...servingApiConfig.sources.revision,
  icon: sourceIcon,
  useData() {
    const [revisions] = KRevision.useList();
    const [routes] = KnativeRoute.useList();
    const [deployments] = Deployment.useList();

    return useMemo(() => {
      if (!revisions) return null;
      const trafficByRevision = indexRevisionTraffic(routes);
      return {
        nodes: revisions.map(revision =>
          makeNode(revision, KRevision, RevisionDetails, {
            traffic: getRevisionTraffic(revision, trafficByRevision),
          })
        ),
        edges: [
          ...makeOwnerEdges(
            revisions,
            'configuration-revision',
            ownerFilterFor(KnativeConfiguration)
          ),
          ...makeOwnerEdges(deployments, 'revision-deployment', ownerFilterFor(KRevision)),
        ],
      };
    }, [deployments, revisions, routes]);
  },
};

const knativeRouteSource: GraphSource = {
  ...servingApiConfig.sources.route,
  icon: sourceIcon,
  useData() {
    const [routes] = KnativeRoute.useList();
    const [revisions] = KRevision.useList();
    const [configurations] = KnativeConfiguration.useList();
    const [services] = Service.useList();

    return useMemo(() => {
      if (!routes) return null;
      return {
        nodes: routes.map(route => makeNode(route, KnativeRoute, RouteDetails)),
        edges: [
          ...makeOwnerEdges(routes, 'service-route', ownerFilterFor(KService)),
          ...makeRouteTrafficEdges(routes, revisions, configurations),
          ...makeOwnerEdges(services, 'route-service', ownerFilterFor(KnativeRoute)),
        ],
      };
    }, [configurations, revisions, routes, services]);
  },
};

const knativeDomainMappingSource: GraphSource = {
  ...servingApiConfig.sources.domainMapping,
  icon: sourceIcon,
  useData() {
    const [services] = KService.useList();
    const [domainMappings] = KnativeDomainMapping.useList();
    const [clusterDomainClaims] = ClusterDomainClaim.useList();

    return useMemo(() => {
      if (!domainMappings) return null;
      return {
        nodes: domainMappings.map(domainMapping =>
          makeNode(domainMapping, KnativeDomainMapping, DomainMappingDetails)
        ),
        edges: [
          ...makeDomainMappingTargetEdges(domainMappings, services),
          ...makeClusterDomainClaimEdges(clusterDomainClaims, domainMappings),
        ],
      };
    }, [clusterDomainClaims, domainMappings, services]);
  },
};

const knativeClusterDomainClaimSource: GraphSource = {
  ...servingApiConfig.sources.clusterDomainClaim,
  icon: sourceIcon,
  useData() {
    const [clusterDomainClaims] = ClusterDomainClaim.useList();
    return useMemo(
      () =>
        clusterDomainClaims
          ? {
              nodes: clusterDomainClaims.map(claim =>
                // ClusterDomainClaims report no status conditions, so leave the status badge off.
                makeNode(claim, ClusterDomainClaim, ClusterDomainClaimDetails, {
                  status: undefined,
                })
              ),
            }
          : null,
      [clusterDomainClaims]
    );
  },
};

const knativeImageSource: GraphSource = {
  ...servingInternalsConfig.sources.image,
  icon: sourceIcon,
  useData() {
    const [images] = KnativeImage.useList();
    const [serviceAccounts] = ServiceAccount.useList();
    return useMemo(
      () =>
        images
          ? {
              nodes: images.map(image => makeNode(image, KnativeImage, ImageDetails)),
              edges: [
                ...makeOwnerEdges(images, 'revision-image'),
                ...makeImageServiceAccountEdges(images, serviceAccounts),
              ],
            }
          : null,
      [images, serviceAccounts]
    );
  },
};

const knativePodAutoscalerSource: GraphSource = {
  ...servingInternalsConfig.sources.podAutoscaler,
  icon: sourceIcon,
  useData() {
    const [podAutoscalers] = KnativePodAutoscaler.useList();
    const [deployments] = Deployment.useList();
    return useMemo(
      () =>
        podAutoscalers
          ? {
              nodes: podAutoscalers.map(podAutoscaler =>
                makeNode(podAutoscaler, KnativePodAutoscaler, PodAutoscalerDetails)
              ),
              edges: [
                ...makeOwnerEdges(podAutoscalers, 'revision-pod-autoscaler'),
                ...makePodAutoscalerTargetEdges(podAutoscalers, deployments),
              ],
            }
          : null,
      [deployments, podAutoscalers]
    );
  },
};

const knativeMetricSource: GraphSource = {
  ...servingInternalsConfig.sources.metric,
  icon: sourceIcon,
  useData() {
    const [metrics] = KnativeMetric.useList();
    const [services] = Service.useList();
    return useMemo(
      () =>
        metrics
          ? {
              nodes: metrics.map(metric => makeNode(metric, KnativeMetric, MetricDetails)),
              edges: [
                ...makeOwnerEdges(metrics, 'pod-autoscaler-metric'),
                ...makeMetricTargetEdges(metrics, services),
              ],
            }
          : null,
      [metrics, services]
    );
  },
};

const knativeIngressSource: GraphSource = {
  ...servingInternalsConfig.sources.ingress,
  icon: sourceIcon,
  useData() {
    const [ingresses] = KnativeIngress.useList();
    const [services] = Service.useList();
    const [secrets] = Secret.useList();
    return useMemo(
      () =>
        ingresses
          ? {
              nodes: ingresses.map(ingress => makeNode(ingress, KnativeIngress, IngressDetails)),
              edges: [
                ...makeOwnerEdges(ingresses, 'owner-ingress'),
                ...makeIngressBackendEdges(ingresses, services),
                ...makeIngressSecretEdges(ingresses, secrets),
              ],
            }
          : null,
      [ingresses, secrets, services]
    );
  },
};

const knativeServerlessServiceSource: GraphSource = {
  ...servingInternalsConfig.sources.serverlessService,
  icon: sourceIcon,
  useData() {
    const [serverlessServices] = KnativeServerlessService.useList();
    const [deployments] = Deployment.useList();
    const [services] = Service.useList();
    return useMemo(
      () =>
        serverlessServices
          ? {
              nodes: serverlessServices.map(serverlessService =>
                makeNode(serverlessService, KnativeServerlessService, ServerlessServiceDetails)
              ),
              edges: [
                ...makeOwnerEdges(serverlessServices, 'pod-autoscaler-serverless-service'),
                ...makeServerlessServiceTargetEdges(serverlessServices, deployments, services),
              ],
            }
          : null,
      [deployments, serverlessServices, services]
    );
  },
};

const knativeCertificateSource: GraphSource = {
  ...servingInternalsConfig.sources.certificate,
  icon: sourceIcon,
  useData() {
    const [certificates] = KnativeCertificate.useList();
    const [secrets] = Secret.useList();
    return useMemo(
      () =>
        certificates
          ? {
              nodes: certificates.map(certificate =>
                makeNode(certificate, KnativeCertificate, CertificateDetails)
              ),
              edges: [
                ...makeOwnerEdges(certificates, 'owner-certificate'),
                ...makeCertificateSecretEdges(certificates, secrets),
              ],
            }
          : null,
      [certificates, secrets]
    );
  },
};

const servingApiSource: GraphSource = {
  id: servingApiConfig.id,
  label: servingApiConfig.label,
  icon: sourceIcon,
  sources: [
    knativeServiceSource,
    knativeConfigurationSource,
    knativeRevisionSource,
    knativeRouteSource,
    knativeDomainMappingSource,
    knativeClusterDomainClaimSource,
  ],
};

const servingInternalsSource: GraphSource = {
  id: servingInternalsConfig.id,
  label: servingInternalsConfig.label,
  icon: sourceIcon,
  isEnabledByDefault: servingInternalsConfig.isEnabledByDefault,
  sources: [
    knativeImageSource,
    knativePodAutoscalerSource,
    knativeMetricSource,
    knativeIngressSource,
    knativeServerlessServiceSource,
    knativeCertificateSource,
  ],
};

export const knativePluginSource: GraphSource = {
  id: knativeMapSourceConfig.id,
  label: knativeMapSourceConfig.label,
  icon: sourceIcon,
  sources: [servingApiSource, servingInternalsSource],
};

type GlanceFact = { label: string; value: unknown };

const glanceFactsByClass: Array<[ResourceClass, (resource: any) => GlanceFact[]]> = [
  [
    KnativeConfiguration,
    resource => [
      { label: 'Service', value: resource.parentService },
      { label: 'Latest Ready', value: resource.status?.latestReadyRevisionName },
    ],
  ],
  [
    KnativeRoute,
    resource => [
      { label: 'URL', value: getSafeUrl(resource.url) },
      { label: 'Traffic', value: formatTraffic(resource.traffic) },
    ],
  ],
  [
    KnativeImage,
    resource => [
      { label: 'Revision', value: resource.revisionName },
      { label: 'Service Account', value: resource.spec?.serviceAccountName || 'default' },
    ],
  ],
  [
    KnativePodAutoscaler,
    resource => [
      { label: 'Revision', value: resource.revisionName },
      {
        label: 'Scale',
        value: `${resource.status?.actualScale ?? '-'} / ${resource.status?.desiredScale ?? '-'}`,
      },
    ],
  ],
  [
    KnativeMetric,
    resource => [
      { label: 'Revision', value: resource.revisionName },
      { label: 'Scrape Target', value: resource.spec?.scrapeTarget },
    ],
  ],
  [
    KnativeIngress,
    resource => [
      { label: 'Owner', value: resource.owner?.name },
      { label: 'Hosts', value: formatList(resource.hosts) },
    ],
  ],
  [
    KnativeServerlessService,
    resource => [
      { label: 'Mode', value: resource.spec?.mode },
      { label: 'Public Service', value: resource.status?.serviceName },
    ],
  ],
  [
    KnativeCertificate,
    resource => [
      { label: 'Secret', value: resource.spec?.secretName },
      { label: 'Expiry', value: resource.status?.notAfter },
    ],
  ],
];

function internalGlanceFacts(resource: any): GlanceFact[] | null {
  const entry = glanceFactsByClass.find(([resourceClass]) =>
    matchesResourceClass(resource, resourceClass)
  );
  return entry ? entry[1](resource) : null;
}

export function KnativeInternalResourceGlance({ node }: { node: any }) {
  const resource = node.kubeObject;
  const facts = internalGlanceFacts(resource);
  if (!facts) return null;

  const ready = readyValue(resource);
  const status = ready === 'True' ? 'success' : ready === 'False' ? 'error' : '';
  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap">
      <StatusLabel status={status}>Ready: {ready}</StatusLabel>
      {facts
        .filter(fact => fact.value !== undefined && fact.value !== null && fact.value !== '-')
        .map(fact => (
          <StatusLabel key={fact.label}>
            {fact.label}: {String(fact.value)}
          </StatusLabel>
        ))}
    </Box>
  );
}
