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
import {
  registerKindIcon,
  registerKubeObjectGlance,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CertificatesList } from './components/certificates/List';
import { ClusterDomainClaimsList } from './components/clusterdomainclaims/List';
import { ConfigurationsList } from './components/configurations/List';
import { DomainMappingsList } from './components/domainmappings/List';
import { ImagesList } from './components/images/List';
import { IngressesList } from './components/ingresses/List';
import { KServiceDetail } from './components/kservices/Detail';
import { KServicesList } from './components/kservices/List';
import { MetricsList } from './components/metrics/List';
import { NetworkingConfiguration } from './components/networking/Configuration';
import { PodAutoscalersList } from './components/podautoscalers/List';
import { RevisionDetail } from './components/revisions/Detail';
import { RevisionsList } from './components/revisions/List';
import { RoutesList } from './components/routes/List';
import { ServerlessServicesList } from './components/serverlessservices/List';
import { isKnativeInstalled } from './isKnativeInstalled';
import { registerKnativeIcon } from './knativeIcon';
import { knativePluginSource } from './mapView';
import type { KnativeListRouteName } from './navigation';
import { knativeNavigationItems, knativeNavigationSections } from './navigation';

registerKnativeIcon();

const queryClient = new QueryClient();

const knativeSidebarParents = new Set([
  'knative',
  ...knativeNavigationSections.map(section => section.name),
]);

function withQueryClient(Component: React.ComponentType) {
  return React.memo(function WithQueryClient() {
    return (
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>
    );
  });
}

// Track whether Knative CRDs exist per cluster to hide sidebar.
const knativeInstalledByCluster: Record<string, boolean> = {};
const lastCheckedAt: Record<string, number> = {};
const inFlight: Record<string, boolean> = {};
const CHECK_TTL_MS = 30 * 1000;

/**
 * Checks if Knative is installed on the given cluster using the shared
 * installed check.
 *
 * @param cluster The name of the cluster to check.
 */
async function checkKnativeInstalled(cluster: string) {
  const now = Date.now();
  const fresh = now - (lastCheckedAt[cluster] ?? 0) < CHECK_TTL_MS;
  if (inFlight[cluster] || fresh) {
    return;
  }
  inFlight[cluster] = true;
  knativeInstalledByCluster[cluster] = await isKnativeInstalled([cluster]);
  lastCheckedAt[cluster] = Date.now();
  inFlight[cluster] = false;
}

registerSidebarEntryFilter(entry => {
  if (entry.name !== 'knative' && !knativeSidebarParents.has(entry.parent ?? '')) {
    return entry;
  }

  const cluster = Utils.getCluster() ?? '';
  void checkKnativeInstalled(cluster);

  if (knativeInstalledByCluster[cluster] === false) {
    return null;
  }
  return entry;
});

registerSidebarEntry({
  parent: null,
  name: 'knative',
  label: 'Knative',
  icon: 'custom:knative',
  url: '/knative/services',
});

knativeNavigationSections.forEach(section => {
  registerSidebarEntry({
    parent: 'knative',
    name: section.name,
    label: section.label,
    entryType: 'subheader',
    sx: { opacity: 0.65 },
  });

  section.items.forEach(item => {
    registerSidebarEntry({
      parent: section.name,
      name: item.name,
      label: item.label,
      url: item.path,
    });
  });
});

registerRoute({
  path: '/knative/services/:namespace/:name',
  sidebar: 'knative-services',
  name: 'kserviceDetails',
  component: withQueryClient(KServiceDetail),
});

registerRoute({
  path: '/knative/revisions/:namespace/:name',
  sidebar: 'knative-revisions',
  name: 'revisionDetails',
  component: withQueryClient(RevisionDetail),
});

const listRouteComponents: Record<KnativeListRouteName, React.ComponentType> = {
  kservices: KServicesList,
  revisions: RevisionsList,
  domainMappingList: DomainMappingsList,
  clusterDomainClaimsList: ClusterDomainClaimsList,
  knativeConfigurations: ConfigurationsList,
  knativeRoutes: RoutesList,
  knativeImages: ImagesList,
  knativePodAutoscalers: PodAutoscalersList,
  knativeMetrics: MetricsList,
  knativeIngresses: IngressesList,
  knativeServerlessServices: ServerlessServicesList,
  knativeCertificates: CertificatesList,
  knetworking: NetworkingConfiguration,
};

knativeNavigationItems.forEach(item => {
  const routeName = item.routeName as KnativeListRouteName;
  registerRoute({
    path: item.path,
    sidebar: item.name,
    name: routeName,
    component: withQueryClient(listRouteComponents[routeName]),
  });
});

registerMapSource(knativePluginSource);

const knativeKindIconKinds = [
  'serving.knative.dev/Service',
  'Revision',
  'DomainMapping',
  'serving.knative.dev/Configuration',
  'serving.knative.dev/Route',
  'autoscaling.internal.knative.dev/PodAutoscaler',
  'autoscaling.internal.knative.dev/Metric',
  'caching.internal.knative.dev/Image',
  'networking.internal.knative.dev/Ingress',
  'networking.internal.knative.dev/ServerlessService',
  'networking.internal.knative.dev/Certificate',
];

knativeKindIconKinds.forEach(kind => {
  registerKindIcon(kind, {
    icon: <Icon icon="custom:knative" width="70%" height="70%" />,
    color: 'rgb(7, 102, 174)',
  });
});

registerKindIcon('ClusterDomainClaim', {
  icon: <Icon icon="custom:knative" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

// Register on-hover "glance" tooltips for the map view
import { ClusterDomainClaimGlance } from './components/clusterdomainclaims/Glance';
import { DomainMappingGlance } from './components/domainmappings/Glance';
import { KServiceGlance } from './components/kservices/Glance';
import { RevisionGlance } from './components/revisions/Glance';
registerKubeObjectGlance({ id: 'knative-kservice-glance', component: KServiceGlance });
registerKubeObjectGlance({ id: 'knative-revision-glance', component: RevisionGlance });
registerKubeObjectGlance({ id: 'knative-domain-mapping-glance', component: DomainMappingGlance });
registerKubeObjectGlance({
  id: 'knative-cluster-domain-claim-glance',
  component: ClusterDomainClaimGlance,
});
