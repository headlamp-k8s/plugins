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
import {
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

function resource(
  kind: string,
  name: string,
  options: Partial<TopologyResource> = {}
): TopologyResource {
  return {
    apiVersion: options.apiVersion,
    cluster: options.cluster ?? 'development',
    kind,
    metadata: {
      name,
      namespace: 'default',
      uid: `${kind.toLowerCase()}-${name}`,
      ...options.metadata,
    },
    parentService: options.parentService,
    readyCondition: options.readyCondition,
    spec: options.spec,
    status: options.status,
    targetNamespace: options.targetNamespace,
  };
}

const kserviceClass = { apiVersion: 'serving.knative.dev/v1', kind: 'Service' };

function controllerOwner(
  kind: string,
  name: string,
  uid: string,
  apiVersion: string
): TopologyResource['metadata']['ownerReferences'] {
  return [{ apiVersion, controller: true, kind, name, uid }];
}

describe('Knative map topology', () => {
  it('builds the Serving ownership chain and moves traffic edges to Route', () => {
    const service = resource('Service', 'checkout');
    const configuration = resource('Configuration', 'checkout', {
      metadata: {
        ownerReferences: controllerOwner(
          'Service',
          'checkout',
          service.metadata.uid!,
          'serving.knative.dev/v1'
        ),
      },
    });
    const revision = resource('Revision', 'checkout-00002', {
      metadata: {
        ownerReferences: controllerOwner(
          'Configuration',
          'checkout',
          configuration.metadata.uid!,
          'serving.knative.dev/v1'
        ),
      },
    });
    const route = resource('Route', 'checkout', {
      parentService: 'checkout',
      status: {
        traffic: [
          { percent: 100, revisionName: 'checkout-00002' },
          { percent: 0, revisionName: 'checkout-00002', tag: 'candidate' },
        ],
      },
    });

    expect(
      makeOwnerEdges([configuration], 'owns-configuration', ownerFilterFor(kserviceClass))
    ).toEqual([
      {
        id: `owns-configuration:${service.metadata.uid}:${configuration.metadata.uid}`,
        source: service.metadata.uid,
        target: configuration.metadata.uid,
      },
    ]);
    expect(makeOwnerEdges([revision], 'owns-revision')).toHaveLength(1);
    expect(makeRouteTrafficEdges([route], [revision], [configuration])).toEqual([
      {
        id: `route-traffic:${route.metadata.uid}:${revision.metadata.uid}`,
        label: '100%, 0% (candidate)',
        source: route.metadata.uid,
        target: revision.metadata.uid,
      },
    ]);
    expect(getRevisionTraffic(revision, indexRevisionTraffic([route]))).toHaveLength(2);
  });

  it('falls back from unresolved Route traffic to Configuration', () => {
    const configuration = resource('Configuration', 'checkout');
    const route = resource('Route', 'checkout', {
      parentService: 'checkout',
      spec: { traffic: [{ latestRevision: true, percent: 100 }] },
    });

    expect(makeRouteTrafficEdges([route], [], [configuration])).toEqual([
      expect.objectContaining({
        label: '100%',
        source: route.metadata.uid,
        target: configuration.metadata.uid,
      }),
    ]);
  });

  it('connects claims and DomainMappings without linking core Service targets', () => {
    const claim = resource('ClusterDomainClaim', 'shop.example.com', {
      metadata: { namespace: undefined },
      targetNamespace: 'store',
    });
    const domainMapping = resource('DomainMapping', 'shop.example.com', {
      metadata: { namespace: 'store' },
      spec: {
        ref: {
          apiVersion: 'serving.knative.dev/v1',
          kind: 'Service',
          name: 'checkout',
        },
      },
    });
    const service = resource('Service', 'checkout', { metadata: { namespace: 'store' } });
    const coreTarget = resource('DomainMapping', 'core.example.com', {
      spec: { ref: { apiVersion: 'v1', kind: 'Service', name: 'checkout' } },
    });

    expect(makeClusterDomainClaimEdges([claim], [domainMapping])).toHaveLength(1);
    expect(makeDomainMappingTargetEdges([domainMapping, coreTarget], [service])).toEqual([
      expect.objectContaining({
        source: domainMapping.metadata.uid,
        target: service.metadata.uid,
      }),
    ]);
  });

  it('connects autoscaling, networking, image, and certificate references to Kubernetes resources', () => {
    const deployment = resource('Deployment', 'checkout-00002-deployment');
    const publicService = resource('Service', 'checkout-00002');
    const privateService = resource('Service', 'checkout-00002-private');
    const serviceAccount = resource('ServiceAccount', 'default');
    const secret = resource('Secret', 'checkout-cert');
    const podAutoscaler = resource('PodAutoscaler', 'checkout-00002', {
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: deployment.metadata.name,
        },
      },
    });
    const metric = resource('Metric', 'checkout-00002', {
      spec: { scrapeTarget: privateService.metadata.name },
    });
    const image = resource('Image', 'checkout-00002-cache-user-container', { spec: {} });
    const ingress = resource('Ingress', 'checkout', {
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  splits: [
                    { percent: 100, serviceName: publicService.metadata.name },
                    { percent: 100, serviceName: publicService.metadata.name },
                  ],
                },
              ],
            },
          },
        ],
        tls: [{ secretName: secret.metadata.name }],
      },
    });
    const serverlessService = resource('ServerlessService', 'checkout-00002', {
      spec: {
        objectRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: deployment.metadata.name,
        },
      },
      status: {
        privateServiceName: privateService.metadata.name,
        serviceName: publicService.metadata.name,
      },
    });
    const certificate = resource('Certificate', 'checkout-cert', {
      spec: { secretName: secret.metadata.name },
    });

    expect(makePodAutoscalerTargetEdges([podAutoscaler], [deployment])).toHaveLength(1);
    expect(makeMetricTargetEdges([metric], [publicService, privateService])).toHaveLength(1);
    expect(makeImageServiceAccountEdges([image], [serviceAccount])).toHaveLength(1);
    expect(makeIngressBackendEdges([ingress], [publicService])).toEqual([
      expect.objectContaining({ label: '100%' }),
    ]);
    expect(makeIngressSecretEdges([ingress], [secret])).toHaveLength(1);
    expect(
      makeServerlessServiceTargetEdges(
        [serverlessService],
        [deployment],
        [publicService, privateService]
      )
    ).toHaveLength(3);
    expect(makeCertificateSecretEdges([certificate], [secret])).toHaveLength(1);
  });

  it('does not cross cluster or namespace boundaries and tolerates missing targets', () => {
    const source = resource('Metric', 'checkout', {
      cluster: 'development',
      metadata: { namespace: 'store' },
      spec: { scrapeTarget: 'checkout-private' },
    });
    const wrongCluster = resource('Service', 'checkout-private', {
      cluster: 'production',
      metadata: { namespace: 'store' },
    });
    const wrongNamespace = resource('Service', 'checkout-private', {
      cluster: 'development',
      metadata: { namespace: 'other' },
    });

    expect(makeMetricTargetEdges([source], [wrongCluster, wrongNamespace])).toEqual([]);
  });

  it('derives owner filters from resource class metadata', () => {
    expect(ownerFilterFor(kserviceClass)).toEqual({
      apiVersionPrefix: 'serving.knative.dev/',
      kind: 'Service',
    });
    expect(
      ownerFilterFor({ apiVersion: ['networking.internal.knative.dev/v1alpha1'], kind: 'Ingress' })
    ).toEqual({
      apiVersionPrefix: 'networking.internal.knative.dev/',
      kind: 'Ingress',
    });
  });

  it('matches Headlamp resource instances using jsonData', () => {
    class HeadlampResource {
      constructor(readonly jsonData: { apiVersion: string; kind: string }) {}

      get kind() {
        return this.jsonData.kind;
      }
    }

    const configuration = new HeadlampResource({
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Configuration',
    });
    const configurationClass = {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Configuration',
    };

    expect((configuration as { apiVersion?: string }).apiVersion).toBeUndefined();
    expect(matchesResourceClass(configuration, configurationClass)).toBe(true);
  });

  it('matches raw resource data and rejects other resource identities', () => {
    const configurationClass = {
      apiVersion: ['serving.knative.dev/v1'],
      kind: 'Configuration',
    };

    expect(
      matchesResourceClass(
        { apiVersion: 'serving.knative.dev/v1', kind: 'Configuration' },
        configurationClass
      )
    ).toBe(true);
    expect(
      matchesResourceClass(
        { apiVersion: 'example.dev/v1', kind: 'Configuration' },
        configurationClass
      )
    ).toBe(false);
    expect(
      matchesResourceClass(
        { apiVersion: 'serving.knative.dev/v1', kind: 'Service' },
        configurationClass
      )
    ).toBe(false);
  });

  it('maps Ready conditions to graph status', () => {
    expect(
      getReadyNodeStatus(resource('Route', 'ready', { readyCondition: { status: 'True' } }))
    ).toBe('success');
    expect(
      getReadyNodeStatus(resource('Route', 'failed', { readyCondition: { status: 'False' } }))
    ).toBe('error');
    expect(
      getReadyNodeStatus(resource('Route', 'pending', { readyCondition: { status: 'Unknown' } }))
    ).toBe('warning');
    expect(getReadyNodeStatus(resource('Route', 'unreported'))).toBe('warning');
  });
});
