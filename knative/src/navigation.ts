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

export interface KnativeNavigationItem {
  name: string;
  label: string;
  path: string;
  routeName: string;
}

export interface KnativeNavigationSection {
  name: string;
  label: string;
  items: readonly KnativeNavigationItem[];
}

/** The visible order and route metadata for the Knative sidebar. */
export const knativeNavigationSections = [
  {
    name: 'knative-serving',
    label: 'Serving',
    items: [
      {
        name: 'knative-services',
        label: 'Services',
        path: '/knative/services',
        routeName: 'kservices',
      },
      {
        name: 'knative-revisions',
        label: 'Revisions',
        path: '/knative/revisions',
        routeName: 'revisions',
      },
      {
        name: 'knative-domain-mappings',
        label: 'Domain Mappings',
        path: '/knative/domain-mappings',
        routeName: 'domainMappingList',
      },
      {
        name: 'knative-cluster-domain-claims',
        label: 'Cluster Domain Claims',
        path: '/knative/cluster-domain-claims',
        routeName: 'clusterDomainClaimsList',
      },
    ],
  },
  {
    name: 'knative-serving-internals',
    label: 'Serving Internals',
    items: [
      {
        name: 'knative-configurations',
        label: 'Configurations',
        path: '/knative/configurations',
        routeName: 'knativeConfigurations',
      },
      {
        name: 'knative-routes',
        label: 'Routes',
        path: '/knative/routes',
        routeName: 'knativeRoutes',
      },
      {
        name: 'knative-images',
        label: 'Images',
        path: '/knative/images',
        routeName: 'knativeImages',
      },
      {
        name: 'knative-pod-autoscalers',
        label: 'Pod Autoscalers',
        path: '/knative/pod-autoscalers',
        routeName: 'knativePodAutoscalers',
      },
      {
        name: 'knative-metrics',
        label: 'Metrics',
        path: '/knative/metrics',
        routeName: 'knativeMetrics',
      },
      {
        name: 'knative-ingresses',
        label: 'KIngresses',
        path: '/knative/ingresses',
        routeName: 'knativeIngresses',
      },
      {
        name: 'knative-serverless-services',
        label: 'Serverless Services',
        path: '/knative/serverless-services',
        routeName: 'knativeServerlessServices',
      },
      {
        name: 'knative-certificates',
        label: 'Certificates',
        path: '/knative/certificates',
        routeName: 'knativeCertificates',
      },
    ],
  },
  {
    name: 'knative-configuration',
    label: 'Configuration',
    items: [
      {
        name: 'knative-networking-configuration',
        label: 'Networking',
        path: '/knative/networking',
        routeName: 'knetworking',
      },
    ],
  },
] as const satisfies readonly KnativeNavigationSection[];

export type KnativeListRouteName =
  (typeof knativeNavigationSections)[number]['items'][number]['routeName'];

export const knativeNavigationItems: readonly KnativeNavigationItem[] =
  knativeNavigationSections.reduce<KnativeNavigationItem[]>(
    (items, section) => [...items, ...section.items],
    []
  );
