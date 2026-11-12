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
  indexReferenceTargets,
  indexRevisionTraffic,
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

describe('Knative Eventing map topology', () => {
  const knativeService = { apiVersion: 'serving.knative.dev/v1', kind: 'Service' };
  const kubernetesService = { apiVersion: 'v1', kind: 'Service' };
  const broker = { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker' };
  const kafkaChannel = { apiVersion: 'messaging.knative.dev/v1beta1', kind: 'KafkaChannel' };
  const owned = (kind: string, name: string, ownerKind: string, ownerName: string) =>
    resource(kind, name, {
      metadata: {
        ownerReferences: controllerOwner(
          ownerKind,
          ownerName,
          `${ownerKind.toLowerCase()}-${ownerName}`,
          'v1'
        ),
      },
    });

  it('links each destination to the object of its API group, kind, namespace and name', () => {
    const display = resource('Service', 'display');
    const dlq = resource('Service', 'dlq', { metadata: { namespace: 'errors' } });
    const sameNamedKubernetesService = resource('Service', 'display', {
      metadata: { uid: 'kubernetes-display' },
    });
    const trigger = resource('Trigger', 'orders', {
      spec: {
        subscriber: {
          ref: { apiVersion: 'serving.knative.dev/v1beta1', kind: 'Service', name: 'display' },
        },
        delivery: {
          deadLetterSink: {
            ref: { apiVersion: 'v1', kind: 'Service', name: 'dlq', namespace: 'errors' },
          },
        },
      },
    });

    expect(
      makeDestinationEdges(
        [trigger],
        indexReferenceTargets([
          { resourceClass: knativeService, items: [display] },
          { resourceClass: kubernetesService, items: [sameNamedKubernetesService, dlq] },
        ]),
        item => [
          { relationship: 'trigger-subscriber', ref: item.spec.subscriber.ref },
          {
            relationship: 'trigger-dead-letter-sink',
            ref: item.spec.delivery.deadLetterSink.ref,
            label: 'dead letter sink',
          },
        ]
      )
    ).toEqual([
      {
        id: 'trigger-subscriber:trigger-orders:service-display',
        source: 'trigger-orders',
        target: 'service-display',
      },
      {
        id: 'trigger-dead-letter-sink:trigger-orders:service-dlq',
        source: 'trigger-orders',
        target: 'service-dlq',
        label: 'dead letter sink',
      },
    ]);
  });

  it('draws no edge for a URI destination, a missing object or another cluster', () => {
    const display = resource('Service', 'display', { cluster: 'production' });
    const source = resource('PingSource', 'beat', {
      spec: { sink: { uri: 'https://example.com/events' } },
    });
    const otherClusterSink = resource('PingSource', 'other', {
      spec: { sink: { ref: { apiVersion: 'v1', kind: 'Service', name: 'display' } } },
    });
    const missingSink = resource('PingSource', 'missing', {
      spec: { sink: { ref: { apiVersion: 'v1', kind: 'Service', name: 'does-not-exist' } } },
    });

    expect(
      makeDestinationEdges(
        [source, otherClusterSink, missingSink],
        indexReferenceTargets([{ resourceClass: kubernetesService, items: [display] }]),
        item => [{ relationship: 'source-sink', ref: item.spec.sink.ref }]
      )
    ).toEqual([]);
  });

  it('links a resource to its owner only when the owner is one of the given owners', () => {
    expect(
      makeOwnerEdgesFrom(
        [
          owned('Deployment', 'apiserversource-events', 'ApiServerSource', 'events'),
          owned('Deployment', 'display-00001-deployment', 'Revision', 'display-00001'),
          resource('Deployment', 'standalone'),
        ],
        [resource('ApiServerSource', 'events')],
        'source-deployment'
      )
    ).toEqual([
      {
        id: 'source-deployment:apiserversource-events:deployment-apiserversource-events',
        source: 'apiserversource-events',
        target: 'deployment-apiserversource-events',
      },
    ]);
  });

  it("links a resource to its owner's owner, leaving out the owner in between", () => {
    const brokerChannel = owned('InMemoryChannel', 'default-kne-trigger', 'Broker', 'default');
    const userChannel = resource('InMemoryChannel', 'orders');

    expect(
      makeIndirectOwnerEdges(
        [
          owned(
            'Service',
            'default-kne-trigger-kn-channel',
            'InMemoryChannel',
            'default-kne-trigger'
          ),
          owned('Service', 'orders-kn-channel', 'InMemoryChannel', 'orders'),
        ],
        [brokerChannel, userChannel],
        'broker-channel-service'
      )
    ).toEqual([
      {
        id: 'broker-channel-service:broker-default:service-default-kne-trigger-kn-channel',
        source: 'broker-default',
        target: 'service-default-kne-trigger-kn-channel',
      },
    ]);
  });

  it('draws no edge for a reference without an API version', () => {
    const display = resource('Service', 'display');
    const source = resource('PingSource', 'beat', {
      spec: { sink: { ref: { kind: 'Service', name: 'display' } } },
    });

    expect(
      makeDestinationEdges(
        [source],
        indexReferenceTargets([{ resourceClass: kubernetesService, items: [display] }]),
        item => [{ relationship: 'source-sink', ref: item.spec.sink.ref }]
      )
    ).toEqual([]);
  });

  it('links the object a resource references to the resource, in the direction events flow', () => {
    const defaultBroker = resource('Broker', 'default');
    const orders = resource('KafkaChannel', 'orders');
    const trigger = resource('Trigger', 'catch-all', { spec: { broker: 'default' } });
    const subscription = resource('Subscription', 'to-display', {
      spec: {
        channel: { apiVersion: 'messaging.knative.dev/v1', kind: 'KafkaChannel', name: 'orders' },
      },
    });
    const danglingSubscription = resource('Subscription', 'dangling', {
      spec: {
        channel: { apiVersion: 'messaging.knative.dev/v1', kind: 'Channel', name: 'orders' },
      },
    });

    expect(
      makeReferrerEdges(
        [trigger],
        indexReferenceTargets([{ resourceClass: broker, items: [defaultBroker] }]),
        'broker-trigger',
        item => ({ ...broker, name: item.spec.broker })
      )
    ).toEqual([
      {
        id: 'broker-trigger:broker-default:trigger-catch-all',
        source: 'broker-default',
        target: 'trigger-catch-all',
      },
    ]);
    expect(
      makeReferrerEdges(
        [subscription, danglingSubscription],
        indexReferenceTargets([{ resourceClass: kafkaChannel, items: [orders] }]),
        'channel-subscription',
        item => item.spec.channel
      )
    ).toEqual([
      {
        id: 'channel-subscription:kafkachannel-orders:subscription-to-display',
        source: 'kafkachannel-orders',
        target: 'subscription-to-display',
      },
    ]);
  });
});
