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
} from '@kinvolk/headlamp-plugin/lib';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClusterDomainClaimsList } from './components/clusterdomainclaims/List';
import { DomainMappingsList } from './components/domainmappings/List';
import { KServiceDetail } from './components/kservices/Detail';
import { KServicesList } from './components/kservices/List';
import { NetworkingOverview } from './components/networking/Overview';
import { RevisionDetail } from './components/revisions/Detail';
import { RevisionsList } from './components/revisions/List';
import { registerKnativeIcon } from './knativeIcon';
import { knativePluginSource } from './mapView';

registerKnativeIcon();

const queryClient = new QueryClient();

function withQueryClient(Component: React.ComponentType) {
  return React.memo(function WithQueryClient() {
    return (
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>
    );
  });
}

// Sidebar entries for Knative
registerSidebarEntry({
  parent: null,
  name: 'knative',
  label: 'Knative',
  icon: 'custom:knative',
  url: '/knative/services',
});

registerSidebarEntry({
  parent: 'knative',
  name: 'kservices',
  label: 'KServices',
  url: '/knative/services',
});

registerSidebarEntry({
  parent: 'knative',
  name: 'revisions',
  label: 'Revisions',
  url: '/knative/revisions',
});

registerSidebarEntry({
  parent: 'knative',
  name: 'domain-mappings',
  label: 'Domain Mapping',
  url: '/knative/domain-mappings',
});

registerSidebarEntry({
  parent: 'knative',
  name: 'cluster-domain-claims',
  label: 'Cluster Domain Claims',
  url: '/knative/cluster-domain-claims',
});

registerSidebarEntry({
  parent: 'knative',
  name: 'knetworking',
  label: 'Networking',
  url: '/knative/networking',
});

registerRoute({
  path: '/knative/services/:namespace/:name',
  sidebar: 'kservices',
  name: 'kserviceDetails',
  component: withQueryClient(KServiceDetail),
});

registerRoute({
  path: '/knative/services',
  sidebar: 'kservices',
  name: 'kservices',
  component: withQueryClient(KServicesList),
});

registerRoute({
  path: '/knative/revisions/:namespace/:name',
  sidebar: 'revisions',
  name: 'revisionDetails',
  component: withQueryClient(RevisionDetail),
});

registerRoute({
  path: '/knative/revisions',
  sidebar: 'revisions',
  name: 'revisions',
  component: withQueryClient(RevisionsList),
});

registerRoute({
  path: '/knative/domain-mappings',
  sidebar: 'domain-mappings',
  name: 'domainMappingList',
  component: withQueryClient(DomainMappingsList),
});

registerRoute({
  path: '/knative/cluster-domain-claims',
  sidebar: 'cluster-domain-claims',
  name: 'clusterDomainClaimsList',
  component: withQueryClient(ClusterDomainClaimsList),
});

registerRoute({
  path: '/knative/networking',
  sidebar: 'knetworking',
  name: 'knetworking',
  component: withQueryClient(NetworkingOverview),
});

registerMapSource(knativePluginSource);

registerKindIcon('Revision', {
  icon: <Icon icon="custom:knative" width="70%" height="70%" />,
  color: 'rgb(7, 102, 174)',
});

registerKindIcon('DomainMapping', {
  icon: <Icon icon="custom:knative" width="70%" height="70%" />,
  color: 'rgb(7, 102, 174)',
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
