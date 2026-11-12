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
import {
  DetailsGrid,
  NameValueTable,
  type NameValueTableRow,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import type {
  GraphEdge,
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import type { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/k8s/KubeObject';
import { Box } from '@mui/system';
import { useMemo } from 'react';
import { useClusters } from './hooks/useClusters';
import { useClustersServingGroup } from './hooks/useClustersServingGroup';
import { knativeMapSourceConfig } from './mapSourceConfig';
import {
  type DestinationReference,
  getReadyCondition,
  getReadyNodeStatus,
  getRevisionTraffic,
  indexReferenceTargets,
  indexRevisionTraffic,
  isOwnedBy,
  makeCertificateSecretEdges,
  makeClusterDomainClaimEdges,
  makeDestinationEdges,
  makeDomainMappingTargetEdges,
  makeImageServiceAccountEdges,
  makeIndirectOwnerEdges,
  makeIngressBackendEdges,
  makeIngressSecretEdges,
  makeMetricTargetEdges,
  makeOwnerEdges,
  makeOwnerEdgesFrom,
  makePodAutoscalerTargetEdges,
  makeReferrerEdges,
  makeRouteTrafficEdges,
  makeServerlessServiceTargetEdges,
  matchesResourceClass,
  ownerFilterFor,
  type ReferenceIndex,
  type TopologyResource,
} from './mapTopology';
import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';
import {
  CHANNEL_IMPLEMENTATION_FAMILY,
  ClusterDomainClaim,
  type DiscoveredKindFamily,
  getKnativeCrdName,
  KnativeBroker,
  KnativeCertificate,
  KnativeChannel,
  type KnativeChannelImplementation,
  KnativeConfiguration,
  KnativeDomainMapping,
  KnativeImage,
  KnativeIngress,
  KnativeMetric,
  KnativePodAutoscaler,
  KnativeRoute,
  KnativeServerlessService,
  type KnativeSource,
  KnativeSubscription,
  KnativeTrigger,
  KRevision,
  KService,
  SOURCE_FAMILY,
  type Traffic,
} from './resources/knative';
import type { DeliverySpec } from './resources/knative/common';
import type { KnativeResourceClass } from './resources/knative/customResourceLinks';
import {
  findKnownKind,
  formatDestination,
  getClustersWithoutCrds,
  hasEveryClusterAnswered,
  isClusterError,
  KNATIVE_CHANNEL_IMPLEMENTATION_KINDS,
  KNATIVE_SOURCE_KINDS,
} from './resources/knative/eventingData';
import { formatList, formatNanoseconds, formatTraffic } from './utils/servingResources';
import { getSafeUrl } from './utils/url';

const { Deployment, Secret, Service, ServiceAccount } = K8s.ResourceClasses;
const {
  servingApi: servingApiConfig,
  servingInternals: servingInternalsConfig,
  eventing: eventingConfig,
  eventingInternals: eventingInternalsConfig,
} = knativeMapSourceConfig.groups;

/** A list that failed, which the map shows as a node of its own. */
type ListError = Pick<ApiError, 'cluster' | 'status' | 'message'>;

type MapNode = GraphNode & {
  traffic?: Traffic[];
  /** Why a list failed, on the node that stands for the failure. */
  listError?: ListError;
};

/** What the data hook of a map source gives: its nodes and edges, or null while they load. */
type MapGraph = ReturnType<Extract<GraphSource, { useData: unknown }>['useData']>;

/**
 * Reads a resource's readiness for a row of its map details.
 *
 * @param item - The resource.
 * @returns The status of its `Ready` condition, or `Unknown` when it has none.
 */
function readyValue(item: TopologyResource): string {
  return getReadyCondition(item)?.status ?? 'Unknown';
}

/**
 * Finds where the resource of a map node lives.
 *
 * @param node - The map node.
 * @returns The resource's name and namespace.
 */
function resourceCoordinates(node: GraphNode) {
  return {
    name: node.kubeObject.jsonData.metadata.name,
    namespace: node.kubeObject.jsonData.metadata.namespace,
    cluster: node.kubeObject.cluster,
  };
}

/**
 * Builds the details panel that the map shows for the nodes of one resource class.
 *
 * @param resourceType - The resource class to load.
 * @param rows - Builds the rows shown below the resource's metadata.
 * @returns A component that shows the resource of a node.
 */
function makeDetailsComponent<T extends KubeObjectClass>(
  resourceType: T,
  rows: (item: InstanceType<T>, node: MapNode) => NameValueTableRow[]
) {
  return ({ node }: { node: MapNode }) => (
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

/**
 * Builds the map node of a Knative resource.
 *
 * @param resource - The resource.
 * @param resourceClass - The resource's class, which names its CRD.
 * @param detailsComponent - The details panel shown for the node.
 * @param data - Node fields that replace the defaults.
 * @returns The map node.
 */
function makeNode(
  resource: KubeObject,
  resourceClass: KnativeResourceClass,
  detailsComponent: MapNode['detailsComponent'],
  data: Partial<MapNode> = {}
): MapNode {
  return {
    id: resource.metadata.uid,
    kubeObject: resource,
    customResourceDefinition: getKnativeCrdName(resourceClass),
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

const [inMemoryChannel] = KNATIVE_CHANNEL_IMPLEMENTATION_KINDS;
const [apiServerSource, containerSource, pingSource, sinkBinding] = KNATIVE_SOURCE_KINDS;
const [kafkaChannel, natsJetStreamChannel, integrationSource, kafkaSource] = [
  ['KafkaChannel', 'kafkachannels', 'messaging.knative.dev/v1beta1'],
  ['NatsJetStreamChannel', 'natsjetstreamchannels', 'messaging.knative.dev/v1alpha1'],
  ['IntegrationSource', 'integrationsources', 'sources.knative.dev/v1alpha1'],
  ['KafkaSource', 'kafkasources', 'sources.knative.dev/v1beta1'],
].map(
  ([kind, apiName, apiVersion]): KnativeResourceClass => ({
    kind,
    apiName,
    apiVersion,
    isNamespaced: true,
  })
);

/** A class whose objects are of type `T`. */
type KindClass<T extends KubeObject> = KubeObjectClass & (new (...args: never[]) => T);

/** The objects of one kind, with the kind's class. */
type KindList<T extends KubeObject> = {
  /** The kind's class. */
  resourceClass: KindClass<T>;
  /** The objects. */
  items: T[];
  /** Why the objects could not be listed in some clusters. */
  errors: ListError[];
};

/** The CRDs of one family of kinds in the selected clusters, once they are listed. */
type FamilyCrds = {
  /** The labelled CRDs, each with the cluster it was found in. */
  crds: Pick<CustomResourceDefinition, 'cluster' | 'jsonData'>[];
  /** The clusters whose CRDs could not be listed. */
  clustersWithoutCrds: string[];
  /** Why the CRDs could not be listed, by cluster where it is known. */
  errors: ListError[];
};

/** The objects of the kinds of a family, with the family's CRDs. */
type FamilyLists<T extends KubeObject> = {
  /** The family's CRDs, or null while they load. */
  familyCrds: FamilyCrds | null;
  /** The objects by kind, or null while they load. */
  lists: KindList<T>[] | null;
};

/**
 * Lists the CRDs of one family of kinds in the selected clusters, such as every Source CRD. A
 * cluster whose CRDs could not be listed counts only when it serves Knative Eventing's API, so a
 * user who may not list CRDs sees nothing about Eventing in a cluster without it.
 *
 * @param family - How the family's CRDs are labelled.
 * @returns The CRDs, or null until every cluster has answered.
 */
function useFamilyCrds<C>(family: DiscoveredKindFamily<C>): FamilyCrds | null {
  const clusters = useClusters();
  const { items, errors, clusterResults } = CustomResourceDefinition.useList({
    clusters,
    labelSelector: `${family.labelKey}=true`,
  });
  const isLoaded = hasEveryClusterAnswered(clusters, clusterResults, errors);
  const clustersWithoutCrds = useClustersServingGroup(
    'eventing.knative.dev',
    isLoaded ? getClustersWithoutCrds(clusters, items, errors) : noItems
  );
  return useMemo(() => {
    if (!isLoaded || !clustersWithoutCrds) return null;
    return {
      crds: items ?? [],
      clustersWithoutCrds,
      errors: (errors ?? noItems).filter(error =>
        clustersWithoutCrds.some(cluster => isClusterError(error, cluster))
      ),
    };
  }, [isLoaded, items, clustersWithoutCrds, errors]);
}

/**
 * Lists the objects of one kind of a family, at the version that the most of its CRDs serve and
 * only in the clusters where it is installed, so a kind that is not installed sends no request.
 * Each kind the map shows is listed by its own call, which keeps the number of hooks fixed. A
 * cluster whose CRD does not serve that version is reported as an error.
 *
 * @param family - The kind's family.
 * @param familyCrds - The family's CRDs, or null while they load.
 * @param kind - The kind.
 * @returns The kind's class and objects, or null while they load.
 */
function useKindList<T extends KubeObject>(
  family: DiscoveredKindFamily<KindClass<T>>,
  familyCrds: FamilyCrds | null,
  kind: KnativeResourceClass
): KindList<T> | null {
  const known = useMemo(
    () =>
      familyCrds &&
      findKnownKind(kind, familyCrds.crds, familyCrds.clustersWithoutCrds, family.fallbackKinds),
    [kind, familyCrds, family.fallbackKinds]
  );
  const resourceClass = family.getKindClass(known?.info ?? kind);
  const list = useEventingList(resourceClass, known?.clusters ?? null);
  return useMemo(
    () =>
      list &&
      known && {
        resourceClass,
        items: list.items,
        errors: [
          ...list.errors,
          ...known.clustersLeftOut.map(cluster => ({
            cluster,
            message: 'Its CRD does not serve the version that the map lists in the other clusters.',
          })),
        ],
      },
    [list, known, resourceClass]
  );
}

/**
 * Lists the channel implementations of the kinds the map shows: Knative's InMemoryChannel, and
 * KafkaChannel and NatsJetStreamChannel where they are installed.
 *
 * @returns The channels by kind, with the family's CRDs.
 */
function useChannelImplementations(): FamilyLists<KnativeChannelImplementation> {
  const familyCrds = useFamilyCrds(CHANNEL_IMPLEMENTATION_FAMILY);
  const inMemory = useKindList(CHANNEL_IMPLEMENTATION_FAMILY, familyCrds, inMemoryChannel);
  const kafka = useKindList(CHANNEL_IMPLEMENTATION_FAMILY, familyCrds, kafkaChannel);
  const nats = useKindList(CHANNEL_IMPLEMENTATION_FAMILY, familyCrds, natsJetStreamChannel);
  const lists = useMemo(
    () => (inMemory && kafka && nats ? [inMemory, kafka, nats] : null),
    [inMemory, kafka, nats]
  );
  return { familyCrds, lists };
}

/**
 * Lists the Sources of the kinds the map shows: Knative's own, and KafkaSource where it is
 * installed.
 *
 * @returns The Sources by kind, with the family's CRDs.
 */
function useSources(): FamilyLists<KnativeSource> {
  const familyCrds = useFamilyCrds(SOURCE_FAMILY);
  const apiServer = useKindList(SOURCE_FAMILY, familyCrds, apiServerSource);
  const container = useKindList(SOURCE_FAMILY, familyCrds, containerSource);
  const ping = useKindList(SOURCE_FAMILY, familyCrds, pingSource);
  const binding = useKindList(SOURCE_FAMILY, familyCrds, sinkBinding);
  const integration = useKindList(SOURCE_FAMILY, familyCrds, integrationSource);
  const kafka = useKindList(SOURCE_FAMILY, familyCrds, kafkaSource);
  const lists = useMemo(
    () =>
      apiServer && container && ping && binding && integration && kafka
        ? [apiServer, container, ping, binding, integration, kafka]
        : null,
    [apiServer, container, ping, binding, integration, kafka]
  );
  return { familyCrds, lists };
}

const noItems: never[] = [];
const noReferences: ReferenceIndex = new Map();

/**
 * Gives a list that has finished loading: its objects, or none when it failed, such as when the
 * kind is not installed.
 *
 * @param items - The objects, or null while they load or when the list failed.
 * @param error - The list's error, if any.
 * @returns The objects, or null while they load.
 */
function loadedItems<T>(items: T[] | null, error: unknown): T[] | null {
  return items ?? (error ? noItems : null);
}

/**
 * Shows why a list that the map needed failed.
 *
 * @param props - The node that stands for the failure.
 * @returns The details of the failure.
 */
function ListErrorDetails({
  node,
}: {
  /** The node that stands for the failure. */
  node: MapNode;
}) {
  return (
    <SectionBox title={node.label}>
      <NameValueTable
        rows={[
          { name: 'Cluster', value: node.listError?.cluster || '-' },
          { name: 'Status Code', value: node.listError?.status ?? '-' },
          { name: 'Message', value: node.listError?.message || '-' },
        ]}
      />
    </SectionBox>
  );
}

/**
 * Builds the nodes that say which lists of a family failed: one for each kind that could not be
 * listed, and one warning for each cluster whose CRDs could not be listed, where the map shows
 * only Knative's own kinds.
 *
 * @param lists - The family's lists, by kind.
 * @param familyCrds - The family's CRDs, or null while they load.
 * @param crdsLabel - What the family's CRDs are called, such as `Source CRDs`.
 * @returns The nodes.
 */
function makeFamilyErrorNodes<T extends KubeObject>(
  lists: KindList<T>[],
  familyCrds: FamilyCrds | null,
  crdsLabel: string
): MapNode[] {
  return [
    ...lists.flatMap(list => makeListErrorNodes(`${list.resourceClass.kind}s`, list.errors)),
    ...makeListErrorNodes(
      crdsLabel,
      familyCrds?.errors ?? noItems,
      'warning',
      "Only Knative's own kinds are shown."
    ),
  ];
}

/**
 * Builds a node for each list that failed, so the map says what it could not show instead of
 * leaving it out without a word.
 *
 * @param what - What could not be listed, such as `Triggers`.
 * @param errors - Why the list failed, by cluster where it is known.
 * @param status - The node's status: `error` when nothing could be shown, `warning` when less is
 * shown.
 * @param consequence - What the map shows instead, added to the message.
 * @returns One node per failure.
 */
function makeListErrorNodes(
  what: string,
  errors: ListError[],
  status: MapNode['status'] = 'error',
  consequence?: string
): MapNode[] {
  return errors.map(error => ({
    id: `knative-list-error:${what}:${error.cluster ?? ''}`,
    label: `${what} could not be listed`,
    subtitle: error.cluster,
    status,
    icon: sourceIcon,
    detailsComponent: ListErrorDetails,
    listError: {
      cluster: error.cluster,
      status: error.status,
      message: consequence ? `${error.message} ${consequence}` : error.message,
    },
  }));
}

/**
 * Finds the clusters with Knative Eventing installed, from the channel CRDs the map lists anyway:
 * the clusters with the Channel CRD, and those whose CRDs could not be listed.
 *
 * @returns The clusters, or null while the CRDs load.
 */
function useEventingClusters(): string[] | null {
  const familyCrds = useFamilyCrds(CHANNEL_IMPLEMENTATION_FAMILY);
  const channelCrdName = getKnativeCrdName(KnativeChannel);
  const clusters =
    familyCrds &&
    [
      ...familyCrds.crds
        .filter(crd => crd.jsonData.metadata.name === channelCrdName)
        .map(crd => crd.cluster),
      ...familyCrds.clustersWithoutCrds,
    ].join('+');
  return useMemo(
    () => (clusters === null ? null : clusters.split('+').filter(Boolean)),
    [clusters]
  );
}

/**
 * Lists the objects of a Knative Eventing kind in the clusters with Eventing installed, so a
 * cluster without Eventing gets no request.
 *
 * @param resourceClass - The kind's class.
 * @param clusters - The clusters with Eventing installed, or null while they are found.
 * @returns The objects and why they could not be listed in some clusters, or null while they
 * load.
 */
function useEventingList<T extends KubeObject>(
  resourceClass: KindClass<T>,
  clusters: string[] | null
): Omit<KindList<T>, 'resourceClass'> | null {
  const list = resourceClass.useList({ clusters: clusters ?? noItems });
  const [items, error] = list;
  const errors = list.errors;
  const isListed = !!clusters && clusters.length > 0;
  return useMemo(() => {
    if (!clusters) return null;
    const loaded = isListed ? loadedItems<T>(items, error) : noItems;
    return loaded && { items: loaded, errors: (isListed && errors) || noItems };
  }, [clusters, isListed, items, error, errors]);
}

/**
 * Lists the objects that Eventing resources send events to or reference: Knative Services,
 * Kubernetes Services, Brokers, Channels and channel implementations.
 *
 * @returns The objects, indexed for finding the edges to them, or none while they load.
 */
function useEventDestinations(): ReferenceIndex {
  const [kservices, kserviceError] = KService.useList();
  const [services, serviceError] = Service.useList();
  const eventingClusters = useEventingClusters();
  const brokers = useEventingList(KnativeBroker, eventingClusters);
  const channels = useEventingList(KnativeChannel, eventingClusters);
  const { lists: channelImplementations } = useChannelImplementations();
  return useMemo(() => {
    const lists = [
      { resourceClass: KService, items: loadedItems(kservices, kserviceError) },
      { resourceClass: Service, items: loadedItems(services, serviceError) },
      { resourceClass: KnativeBroker, items: brokers?.items ?? null },
      { resourceClass: KnativeChannel, items: channels?.items ?? null },
    ];
    if (!channelImplementations || lists.some(list => !list.items)) return noReferences;
    return indexReferenceTargets([...lists, ...channelImplementations]);
  }, [kservices, kserviceError, services, serviceError, brokers, channels, channelImplementations]);
}

/**
 * Names the dead letter sink of a resource's delivery settings as a destination.
 *
 * @param relationship - The kind of relationship of the edge.
 * @param delivery - The resource's delivery settings.
 * @returns The dead letter sink, labelled for the map.
 */
function deadLetterSink(
  relationship: string,
  delivery: DeliverySpec | undefined
): DestinationReference {
  return { relationship, ref: delivery?.deadLetterSink?.ref, label: 'dead letter sink' };
}

const BrokerDetails = makeDetailsComponent(KnativeBroker, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Class', value: item.brokerClass || '-' },
  { name: 'Address', value: item.address || '-' },
]);

const TriggerDetails = makeDetailsComponent(KnativeTrigger, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Broker', value: item.broker?.name || '-' },
  { name: 'Subscriber', value: formatDestination(item.subscriber) || '-' },
]);

const ChannelDetails = makeDetailsComponent(KnativeChannel, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Backing Channel', value: item.backingKind || '-' },
  { name: 'Address', value: item.address || '-' },
  { name: 'Subscribers', value: item.subscriberCount },
]);

const SubscriptionDetails = makeDetailsComponent(KnativeSubscription, item => [
  { name: 'Ready', value: readyValue(item) },
  { name: 'Channel', value: formatDestination({ ref: item.spec?.channel }) || '-' },
  { name: 'Subscriber', value: formatDestination(item.spec?.subscriber) || '-' },
  { name: 'Reply', value: formatDestination(item.spec?.reply) || '-' },
]);

const discoveredKindDetails = new WeakMap<object, NonNullable<MapNode['detailsComponent']>>();

/**
 * Gives the details panel for the nodes of one kind of a family, building it the first time, so
 * each kind keeps the same panel component.
 *
 * @param resourceType - The kind's class.
 * @param rows - Builds the rows shown below the resource's metadata.
 * @returns The details panel.
 */
function getDiscoveredKindDetails<T extends KubeObject>(
  resourceType: KindClass<T>,
  rows: (item: T) => NameValueTableRow[]
): NonNullable<MapNode['detailsComponent']> {
  const existing = discoveredKindDetails.get(resourceType);
  if (existing) return existing;
  const component = makeDetailsComponent(resourceType, rows);
  discoveredKindDetails.set(resourceType, component);
  return component;
}

/**
 * Builds the map nodes of the objects of several kinds of a family, each with its kind's
 * details panel.
 *
 * @param lists - The objects by kind.
 * @param rows - Builds the rows of an object's details panel.
 * @returns The nodes.
 */
function makeKindNodes<T extends KubeObject>(
  lists: KindList<T>[],
  rows: (item: T) => NameValueTableRow[]
): MapNode[] {
  return lists.flatMap(({ resourceClass, items }) =>
    items.map(item => makeNode(item, resourceClass, getDiscoveredKindDetails(resourceClass, rows)))
  );
}

const knativeBrokerSource: GraphSource = {
  ...eventingConfig.sources.broker,
  icon: sourceIcon,
  useData() {
    const list = useEventingList(KnativeBroker, useEventingClusters());
    const destinations = useEventDestinations();
    const { lists: channelImplementations } = useChannelImplementations();
    const [services] = Service.useList();
    return useMemo(() => {
      if (!list) return null;
      const { items } = list;
      const brokerChannels = (channelImplementations ?? [])
        .flatMap(channels => channels.items)
        .filter(channel => isOwnedBy(channel, KnativeBroker));
      return {
        nodes: [
          ...items.map(broker => makeNode(broker, KnativeBroker, BrokerDetails)),
          ...makeListErrorNodes('Brokers', list.errors),
        ],
        edges: [
          ...makeIndirectOwnerEdges(services, brokerChannels, 'broker-channel-service'),
          ...makeDestinationEdges(items, destinations, broker => [
            deadLetterSink('broker-dead-letter-sink', broker.spec?.delivery),
          ]),
        ],
      };
    }, [list, destinations, channelImplementations, services]);
  },
};

const knativeTriggerSource: GraphSource = {
  ...eventingConfig.sources.trigger,
  icon: sourceIcon,
  useData() {
    const list = useEventingList(KnativeTrigger, useEventingClusters());
    const destinations = useEventDestinations();
    return useMemo(() => {
      if (!list) return null;
      const { items } = list;
      return {
        nodes: [
          ...items.map(trigger => makeNode(trigger, KnativeTrigger, TriggerDetails)),
          ...makeListErrorNodes('Triggers', list.errors),
        ],
        edges: [
          ...makeReferrerEdges(
            items,
            destinations,
            'broker-trigger',
            trigger =>
              trigger.broker && {
                apiVersion: KnativeBroker.apiVersion,
                kind: KnativeBroker.kind,
                ...trigger.broker,
              }
          ),
          ...makeDestinationEdges(items, destinations, trigger => [
            { relationship: 'trigger-subscriber', ref: trigger.subscriber?.ref },
            deadLetterSink('trigger-dead-letter-sink', trigger.spec?.delivery),
          ]),
        ],
      };
    }, [list, destinations]);
  },
};

const knativeChannelSource: GraphSource = {
  ...eventingConfig.sources.channel,
  icon: sourceIcon,
  useData() {
    const list = useEventingList(KnativeChannel, useEventingClusters());
    const destinations = useEventDestinations();
    return useMemo(() => {
      if (!list) return null;
      const { items } = list;
      return {
        nodes: [
          ...items.map(channel => makeNode(channel, KnativeChannel, ChannelDetails)),
          ...makeListErrorNodes('Channels', list.errors),
        ],
        edges: makeDestinationEdges(items, destinations, channel => [
          deadLetterSink('channel-dead-letter-sink', channel.spec?.delivery),
        ]),
      };
    }, [list, destinations]);
  },
};

/**
 * Builds the map's channel implementation nodes and edges: either the channels that Brokers
 * created for their own use, which the map shows only with Eventing Internals, or all the others,
 * each with an edge to the Kubernetes Service it owns.
 *
 * @param brokerChannels - Whether to build the channels that Brokers created.
 * @returns The nodes and edges, or null while they load.
 */
function useChannelImplementationGraph(brokerChannels: boolean): MapGraph {
  const { lists: channelImplementations, familyCrds } = useChannelImplementations();
  const destinations = useEventDestinations();
  const [services] = Service.useList();
  return useMemo(() => {
    if (!channelImplementations) return null;
    const lists = channelImplementations.map(list => ({
      ...list,
      items: list.items.filter(item => isOwnedBy(item, KnativeBroker) === brokerChannels),
    }));
    const items = lists.flatMap(list => list.items);
    return {
      nodes: [
        ...makeKindNodes(lists, item => [
          { name: 'Ready', value: readyValue(item) },
          { name: 'Address', value: item.address || '-' },
          { name: 'Subscribers', value: item.subscriberCount },
        ]),
        ...(brokerChannels
          ? []
          : makeFamilyErrorNodes(channelImplementations, familyCrds, 'Channel CRDs')),
      ],
      edges: [
        ...makeOwnerEdges(items, 'channel-implementation-owner'),
        ...makeOwnerEdgesFrom(services, items, 'channel-service'),
        ...makeDestinationEdges(items, destinations, channel => [
          deadLetterSink('channel-implementation-dead-letter-sink', channel.spec?.delivery),
        ]),
      ],
    };
  }, [channelImplementations, familyCrds, destinations, services, brokerChannels]);
}

const knativeChannelImplementationSource: GraphSource = {
  ...eventingConfig.sources.channelImplementation,
  icon: sourceIcon,
  useData() {
    return useChannelImplementationGraph(false);
  },
};

const knativeBrokerChannelSource: GraphSource = {
  ...eventingInternalsConfig.sources.brokerChannel,
  icon: sourceIcon,
  useData() {
    return useChannelImplementationGraph(true);
  },
};

/**
 * Builds the map's Subscription nodes and edges: either the Subscriptions that Triggers created to
 * deliver their events, which the map shows only with Eventing Internals, or all the others.
 *
 * @param triggerSubscriptions - Whether to build the Subscriptions that Triggers created.
 * @returns The nodes and edges, or null while they load.
 */
function useSubscriptionGraph(triggerSubscriptions: boolean): MapGraph {
  const list = useEventingList(KnativeSubscription, useEventingClusters());
  const destinations = useEventDestinations();
  return useMemo(() => {
    if (!list) return null;
    const items = list.items.filter(
      item => isOwnedBy(item, KnativeTrigger) === triggerSubscriptions
    );
    return {
      nodes: [
        ...items.map(subscription =>
          makeNode(subscription, KnativeSubscription, SubscriptionDetails)
        ),
        ...(triggerSubscriptions ? [] : makeListErrorNodes('Subscriptions', list.errors)),
      ],
      edges: [
        ...makeOwnerEdges(items, 'subscription-owner'),
        ...makeSubscriptionEdges(items, destinations),
      ],
    };
  }, [list, destinations, triggerSubscriptions]);
}

const knativeSubscriptionSource: GraphSource = {
  ...eventingConfig.sources.subscription,
  icon: sourceIcon,
  useData() {
    return useSubscriptionGraph(false);
  },
};

const knativeTriggerSubscriptionSource: GraphSource = {
  ...eventingInternalsConfig.sources.triggerSubscription,
  icon: sourceIcon,
  useData() {
    return useSubscriptionGraph(true);
  },
};

/**
 * Builds the edges of Subscriptions to the objects they reference: from the channel to each
 * Subscription, and from each Subscription to its subscriber, reply and dead letter sink.
 *
 * @param subscriptions - The Subscriptions.
 * @param destinations - The objects the references can point to.
 * @returns The edges.
 */
function makeSubscriptionEdges(
  subscriptions: KnativeSubscription[],
  destinations: ReferenceIndex
): GraphEdge[] {
  return [
    ...makeReferrerEdges(
      subscriptions,
      destinations,
      'channel-subscription',
      subscription => subscription.spec?.channel
    ),
    ...makeDestinationEdges(subscriptions, destinations, subscription => [
      { relationship: 'subscription-subscriber', ref: subscription.spec?.subscriber?.ref },
      { relationship: 'subscription-reply', ref: subscription.spec?.reply?.ref, label: 'reply' },
      deadLetterSink('subscription-dead-letter-sink', subscription.spec?.delivery),
    ]),
  ];
}

const knativeSourceSource: GraphSource = {
  ...eventingConfig.sources.source,
  icon: sourceIcon,
  useData() {
    const { lists: sources, familyCrds } = useSources();
    const destinations = useEventDestinations();
    const [deployments] = Deployment.useList();
    return useMemo(() => {
      if (!sources) return null;
      const items = sources.flatMap(list => list.items);
      return {
        nodes: [
          ...makeKindNodes(sources, item => [
            { name: 'Ready', value: readyValue(item) },
            { name: 'Sink', value: formatDestination(item.sink) || '-' },
            { name: 'Sink URI', value: item.status?.sinkUri || '-' },
          ]),
          ...makeFamilyErrorNodes(sources, familyCrds, 'Source CRDs'),
        ],
        edges: [
          ...makeOwnerEdges(items, 'source-owner'),
          ...makeOwnerEdgesFrom(deployments, items, 'source-deployment'),
          ...makeDestinationEdges(items, destinations, source => [
            { relationship: 'source-sink', ref: source.sink?.ref },
          ]),
        ],
      };
    }, [sources, familyCrds, destinations, deployments]);
  },
};

const eventingSource: GraphSource = {
  id: eventingConfig.id,
  label: eventingConfig.label,
  icon: sourceIcon,
  isEnabledByDefault: eventingConfig.isEnabledByDefault,
  sources: [
    knativeBrokerSource,
    knativeTriggerSource,
    knativeChannelSource,
    knativeChannelImplementationSource,
    knativeSubscriptionSource,
    knativeSourceSource,
  ],
};

const eventingInternalsSource: GraphSource = {
  id: eventingInternalsConfig.id,
  label: eventingInternalsConfig.label,
  icon: sourceIcon,
  isEnabledByDefault: eventingInternalsConfig.isEnabledByDefault,
  sources: [knativeBrokerChannelSource, knativeTriggerSubscriptionSource],
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
  sources: [servingApiSource, servingInternalsSource, eventingSource, eventingInternalsSource],
};

type GlanceFact = { label: string; value: unknown };

const glanceFactsByClass: Array<[KnativeResourceClass, (resource: any) => GlanceFact[]]> = [
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

/**
 * Lists the facts that the glance of a Knative internal resource shows.
 *
 * @param resource - The resource.
 * @returns The facts for its class, or null when the resource is not one of those classes.
 */
function internalGlanceFacts(resource: KubeObject): GlanceFact[] | null {
  const entry = glanceFactsByClass.find(([resourceClass]) =>
    matchesResourceClass(resource, resourceClass)
  );
  return entry ? entry[1](resource) : null;
}

/**
 * Shows the glance of an internal Knative resource on the map: its readiness and key facts.
 *
 * @param props - The map node of the resource.
 * @returns The glance, or null for a resource that has none.
 */
export function KnativeInternalResourceGlance({ node }: { node: GraphNode }) {
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
