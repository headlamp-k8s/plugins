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
  registerDetailsViewHeaderActionsProcessor,
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
import { BrokerDetail } from './components/brokers/Detail';
import { KServiceDetail } from './components/kservices/Detail';
import { RevisionDetail } from './components/revisions/Detail';
import { TriggerDetail } from './components/triggers/Detail';
import { isKnativeComponentInstalled } from './isKnativeInstalled';
import { registerKnativeIcon } from './knativeIcon';
import { getKnativeListRouteComponent } from './listRoutes';
import { KnativeInternalResourceGlance, knativePluginSource } from './mapView';
import { knativeNavigationItems, knativeNavigationSections } from './navigation';
import { filterReadOnlyKnativeHeaderActions } from './readOnlyResources';
import { KnativeBroker, KnativeTrigger } from './resources/knative';
import { createSidebarGate } from './sidebarGating';

registerKnativeIcon();
registerDetailsViewHeaderActionsProcessor((resource, actions) =>
  filterReadOnlyKnativeHeaderActions(resource, actions)
);

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

// Hide Knative sidebar entries whose component is not installed on the cluster.
registerSidebarEntryFilter(
  createSidebarGate({
    getCluster: () => Utils.getCluster() ?? '',
    isInstalled: isKnativeComponentInstalled,
  })
);

registerSidebarEntry({
  parent: null,
  name: 'knative',
  label: 'Knative',
  icon: 'custom:knative',
  url: knativeNavigationItems[0].path,
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

registerRoute({
  path: '/knative/brokers/:namespace/:name',
  sidebar: 'knative-brokers',
  name: KnativeBroker.detailsRoute,
  component: withQueryClient(BrokerDetail),
});

registerRoute({
  path: '/knative/triggers/:namespace/:name',
  sidebar: 'knative-triggers',
  name: KnativeTrigger.detailsRoute,
  component: withQueryClient(TriggerDetail),
});

knativeNavigationItems.forEach(item => {
  const component = getKnativeListRouteComponent(item.routeName);
  registerRoute({
    path: item.path,
    sidebar: item.name,
    name: item.routeName,
    component: withQueryClient(component),
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
  'eventing.knative.dev/Broker',
  'eventing.knative.dev/Trigger',
  'messaging.knative.dev/Channel',
  'messaging.knative.dev/Subscription',
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
registerKubeObjectGlance({
  id: 'knative-serving-internal-resource-glance',
  component: KnativeInternalResourceGlance,
});
