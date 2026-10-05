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

import { vi } from 'vitest';

vi.mock('./components/certificates/List', () => ({ CertificatesList: () => null }));
vi.mock('./components/clusterdomainclaims/List', () => ({
  ClusterDomainClaimsList: () => null,
}));
vi.mock('./components/configurations/List', () => ({ ConfigurationsList: () => null }));
vi.mock('./components/domainmappings/List', () => ({ DomainMappingsList: () => null }));
vi.mock('./components/images/List', () => ({ ImagesList: () => null }));
vi.mock('./components/ingresses/List', () => ({ IngressesList: () => null }));
vi.mock('./components/kservices/List', () => ({ KServicesList: () => null }));
vi.mock('./components/metrics/List', () => ({ MetricsList: () => null }));
vi.mock('./components/networking/Configuration', () => ({
  NetworkingConfiguration: () => null,
}));
vi.mock('./components/podautoscalers/List', () => ({ PodAutoscalersList: () => null }));
vi.mock('./components/revisions/List', () => ({ RevisionsList: () => null }));
vi.mock('./components/routes/List', () => ({ RoutesList: () => null }));
vi.mock('./components/serverlessservices/List', () => ({ ServerlessServicesList: () => null }));

import { getKnativeListRouteComponent, knativeListRouteComponents } from './listRoutes';
import { knativeNavigationItems } from './navigation';

describe('Knative list route components', () => {
  it('registers exactly one component for every navigation route', () => {
    expect(Object.keys(knativeListRouteComponents).sort()).toEqual(
      knativeNavigationItems.map(item => item.routeName).sort()
    );

    knativeNavigationItems.forEach(item => {
      expect(getKnativeListRouteComponent(item.routeName)).toBe(
        knativeListRouteComponents[item.routeName]
      );
    });
  });

  it.each(['missing-route', 'toString'])(
    'rejects unknown or inherited route name %s with a useful error',
    routeName => {
      expect(() => getKnativeListRouteComponent(routeName)).toThrow(
        `No list component is registered for Knative route "${routeName}".`
      );
    }
  );
});
