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

import { describe, expect, it } from 'vitest';
import { knativeMapSourceConfig } from './mapSourceConfig';

describe('Knative map source configuration', () => {
  it('enables the Serving API overview and keeps generated internals opt-in', () => {
    expect(knativeMapSourceConfig.groups.servingApi.isEnabledByDefault).toBe(true);
    expect(knativeMapSourceConfig.groups.servingInternals.isEnabledByDefault).toBe(false);
  });

  it('defines the expected groups and sources', () => {
    const { servingApi, servingInternals } = knativeMapSourceConfig.groups;

    expect(servingApi).toMatchObject({
      id: 'knative-serving-api',
      label: 'Serving API',
    });
    expect(servingApi.sources).toEqual({
      service: { id: 'knative-service', label: 'Services' },
      configuration: { id: 'knative-configuration', label: 'Configurations' },
      revision: { id: 'knative-revision', label: 'Revisions' },
      route: { id: 'knative-route', label: 'Routes' },
      domainMapping: { id: 'knative-domain-mapping', label: 'Domain Mappings' },
      clusterDomainClaim: {
        id: 'knative-cluster-domain-claim',
        label: 'Cluster Domain Claims',
      },
    });

    expect(servingInternals).toMatchObject({
      id: 'knative-serving-internals',
      label: 'Serving Internals',
    });
    expect(servingInternals.sources).toEqual({
      image: { id: 'knative-image', label: 'Images' },
      podAutoscaler: { id: 'knative-pod-autoscaler', label: 'Pod Autoscalers' },
      metric: { id: 'knative-metric', label: 'Metrics' },
      ingress: { id: 'knative-ingress', label: 'KIngresses' },
      serverlessService: {
        id: 'knative-serverless-service',
        label: 'Serverless Services',
      },
      certificate: { id: 'knative-certificate', label: 'Certificates' },
    });
  });

  it('uses a unique ID for every source and group', () => {
    const groups = Object.values(knativeMapSourceConfig.groups);
    const ids = [
      knativeMapSourceConfig.id,
      ...groups.flatMap(group => [
        group.id,
        ...Object.values(group.sources).map(source => source.id),
      ]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
