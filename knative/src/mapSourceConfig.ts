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

export const knativeMapSourceConfig = {
  id: 'knative',
  label: 'Knative',
  groups: {
    servingApi: {
      id: 'knative-serving-api',
      label: 'Serving API',
      isEnabledByDefault: true,
      sources: {
        service: { id: 'knative-service', label: 'Services' },
        configuration: { id: 'knative-configuration', label: 'Configurations' },
        revision: { id: 'knative-revision', label: 'Revisions' },
        route: { id: 'knative-route', label: 'Routes' },
        domainMapping: { id: 'knative-domain-mapping', label: 'Domain Mappings' },
        clusterDomainClaim: { id: 'knative-cluster-domain-claim', label: 'Cluster Domain Claims' },
      },
    },
    servingInternals: {
      id: 'knative-serving-internals',
      label: 'Serving Internals',
      isEnabledByDefault: false,
      sources: {
        image: { id: 'knative-image', label: 'Images' },
        podAutoscaler: { id: 'knative-pod-autoscaler', label: 'Pod Autoscalers' },
        metric: { id: 'knative-metric', label: 'Metrics' },
        ingress: { id: 'knative-ingress', label: 'KIngresses' },
        serverlessService: { id: 'knative-serverless-service', label: 'Serverless Services' },
        certificate: { id: 'knative-certificate', label: 'Certificates' },
      },
    },
  },
} as const;
