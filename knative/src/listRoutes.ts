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

import type React from 'react';
import { CertificatesList } from './components/certificates/List';
import { ClusterDomainClaimsList } from './components/clusterdomainclaims/List';
import { ConfigurationsList } from './components/configurations/List';
import { DomainMappingsList } from './components/domainmappings/List';
import { ImagesList } from './components/images/List';
import { IngressesList } from './components/ingresses/List';
import { KServicesList } from './components/kservices/List';
import { MetricsList } from './components/metrics/List';
import { NetworkingConfiguration } from './components/networking/Configuration';
import { PodAutoscalersList } from './components/podautoscalers/List';
import { RevisionsList } from './components/revisions/List';
import { RoutesList } from './components/routes/List';
import { ServerlessServicesList } from './components/serverlessservices/List';
import type { KnativeListRouteName } from './navigation';

/** Components registered for every list route declared by `knativeNavigationSections`. */
export const knativeListRouteComponents = {
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
} satisfies Record<KnativeListRouteName, React.ComponentType>;

function isKnativeListRouteName(routeName: string): routeName is KnativeListRouteName {
  return Object.prototype.hasOwnProperty.call(knativeListRouteComponents, routeName);
}

/**
 * Returns the component registered for a Knative list route.
 *
 * The registry's `satisfies` constraint catches navigation/component drift during type-checking.
 * This guard also gives a direct error if an untyped caller supplies an unknown route at runtime.
 */
export function getKnativeListRouteComponent(routeName: string): React.ComponentType {
  if (!isKnativeListRouteName(routeName)) {
    throw new Error(`No list component is registered for Knative route "${routeName}".`);
  }

  return knativeListRouteComponents[routeName];
}
