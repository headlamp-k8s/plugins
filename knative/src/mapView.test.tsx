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

import type { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import type { KubeMetadata } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { GraphSource } from '@kinvolk/headlamp-plugin/lib/plugin/registry';
import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';
import type { KnativeSource, KnativeTrigger } from './resources/knative';
import type { KnativeResourceClass } from './resources/knative/customResourceLinks';

/** An object as a list test double returns it. */
type Item = {
  /** The object's cluster. */
  cluster: string;
  /** The object's metadata. */
  metadata: Pick<KubeMetadata, 'name' | 'namespace' | 'uid' | 'ownerReferences'>;
  /** The object's spec, if it has one. */
  spec?: Record<string, unknown>;
  /** The Trigger's Broker, as the class's getter gives it. */
  broker?: KnativeTrigger['broker'];
  /** The Trigger's subscriber, as the class's getter gives it. */
  subscriber?: KnativeTrigger['subscriber'];
  /** The Source's sink, as the class's getter gives it. */
  sink?: KnativeSource['sink'];
  /** The object as Kubernetes returns it, which a node's details panel reads. */
  jsonData?: {
    /** The object's metadata. */
    metadata: Pick<KubeMetadata, 'name' | 'namespace'>;
  };
};

const context = vi.hoisted(() => ({
  lists: {} as Record<string, Item[] | null>,
  errors: {} as Record<string, Pick<ApiError, 'message' | 'cluster' | 'status'>>,
  clusters: ['dev'],
  crdPendingClusters: [] as string[],
  crds: [] as Pick<CustomResourceDefinition, 'cluster'>[],
  crdErrors: null as Pick<ApiError, 'message' | 'cluster'>[] | null,
  clustersWithoutEventing: [] as string[],
  isEventingCheckPending: false,
  listedClusters: {} as Record<string, string[]>,
  details: [] as unknown[],
}));

/**
 * Builds a test double for a resource class whose list returns the objects in `context.lists`.
 *
 * @param kind - The class's kind, plural name and API version.
 * @param listKey - The key of its objects in `context.lists`; the kind when not given.
 * @returns The class.
 */
function stubClass(kind: KnativeResourceClass, listKey = kind.kind) {
  return {
    ...kind,
    detailsRoute: kind.kind,
    useList: (options?: { clusters?: string[] }) => {
      React.useRef(options);
      if (options?.clusters) context.listedClusters[listKey] = options.clusters;
      const items = context.lists[listKey];
      const error = context.errors[listKey] ?? null;
      return Object.assign([items === null || items === undefined ? null : [...items], error], {
        errors: error ? [error] : null,
      });
    },
  };
}

vi.mock('@iconify/react', () => ({ Icon: () => null }));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DetailsGrid: (props: unknown) => {
    context.details.push(props);
    return null;
  },
  SectionBox: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
  NameValueTable: ({ rows }: { rows: { name: string; value: React.ReactNode }[] }) => (
    <dl>
      {rows.map(row => (
        <div key={row.name}>
          <dt>{row.name}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  ),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({ StatusLabel: () => null }));
vi.mock('./hooks/useClusters', () => ({ useClusters: () => context.clusters }));
vi.mock('./hooks/useClustersServingGroup', () => ({
  useClustersServingGroup: (group: string, clusters: string[]) => {
    React.useRef(group);
    if (clusters.length > 0 && context.isEventingCheckPending) return null;
    return clusters.filter(cluster => !context.clustersWithoutEventing.includes(cluster));
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => {
  const kind = (k: string, apiName: string, apiVersion: string) =>
    stubClass({ kind: k, apiName, apiVersion, isNamespaced: true });
  return {
    K8s: {
      ResourceClasses: {
        Deployment: kind('Deployment', 'deployments', 'apps/v1'),
        Secret: kind('Secret', 'secrets', 'v1'),
        Service: stubClass(
          { kind: 'Service', apiName: 'services', apiVersion: 'v1', isNamespaced: true },
          'KubernetesService'
        ),
        ServiceAccount: kind('ServiceAccount', 'serviceaccounts', 'v1'),
      },
    },
  };
});

vi.mock('./resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    useList: (options: { clusters: string[] }) => {
      React.useRef(options);
      const answered = options.clusters.filter(
        cluster =>
          !context.crdPendingClusters.includes(cluster) &&
          !context.crdErrors?.some(error => error.cluster === cluster)
      );
      const crds = context.crds.filter(crd => answered.includes(crd.cluster));
      return {
        items: options.clusters.every(cluster => context.crdPendingClusters.includes(cluster))
          ? null
          : crds,
        errors: context.crdErrors,
        clusterResults: Object.fromEntries(
          answered.map(cluster => [cluster, { items: crds.filter(crd => crd.cluster === cluster) }])
        ),
      };
    },
  },
}));

vi.mock('./resources/knative', async () => {
  const links = await vi.importActual<typeof import('./resources/knative/customResourceLinks')>(
    './resources/knative/customResourceLinks'
  );
  const kind = (k: string, apiName: string, apiVersion: string) =>
    stubClass({ kind: k, apiName, apiVersion, isNamespaced: true });
  const family = (labelKey: string, fallbackKinds: KnativeResourceClass[]) => ({
    labelKey,
    fallbackKinds,
    getKindClass: (info: KnativeResourceClass) => stubClass(info),
  });
  return {
    getKnativeCrdName: links.getKnativeCrdName,
    ClusterDomainClaim: kind(
      'ClusterDomainClaim',
      'clusterdomainclaims',
      'networking.internal.knative.dev/v1alpha1'
    ),
    KnativeCertificate: kind(
      'Certificate',
      'certificates',
      'networking.internal.knative.dev/v1alpha1'
    ),
    KnativeConfiguration: kind('Configuration', 'configurations', 'serving.knative.dev/v1'),
    KnativeDomainMapping: kind('DomainMapping', 'domainmappings', 'serving.knative.dev/v1beta1'),
    KnativeImage: kind('Image', 'images', 'caching.internal.knative.dev/v1alpha1'),
    KnativeIngress: kind('Ingress', 'ingresses', 'networking.internal.knative.dev/v1alpha1'),
    KnativeMetric: kind('Metric', 'metrics', 'autoscaling.internal.knative.dev/v1alpha1'),
    KnativePodAutoscaler: kind(
      'PodAutoscaler',
      'podautoscalers',
      'autoscaling.internal.knative.dev/v1alpha1'
    ),
    KnativeRoute: kind('Route', 'routes', 'serving.knative.dev/v1'),
    KnativeServerlessService: kind(
      'ServerlessService',
      'serverlessservices',
      'networking.internal.knative.dev/v1alpha1'
    ),
    KRevision: kind('Revision', 'revisions', 'serving.knative.dev/v1'),
    KService: stubClass(
      {
        kind: 'Service',
        apiName: 'services',
        apiVersion: 'serving.knative.dev/v1',
        isNamespaced: true,
      },
      'KnativeService'
    ),
    KnativeBroker: kind('Broker', 'brokers', 'eventing.knative.dev/v1'),
    KnativeTrigger: kind('Trigger', 'triggers', 'eventing.knative.dev/v1'),
    KnativeChannel: kind('Channel', 'channels', 'messaging.knative.dev/v1'),
    KnativeSubscription: kind('Subscription', 'subscriptions', 'messaging.knative.dev/v1'),
    CHANNEL_IMPLEMENTATION_FAMILY: family('messaging.knative.dev/subscribable', [
      {
        kind: 'InMemoryChannel',
        apiName: 'inmemorychannels',
        apiVersion: 'messaging.knative.dev/v1',
        isNamespaced: true,
      },
    ]),
    SOURCE_FAMILY: family('duck.knative.dev/source', [
      {
        kind: 'PingSource',
        apiName: 'pingsources',
        apiVersion: 'sources.knative.dev/v1',
        isNamespaced: true,
      },
      {
        kind: 'ContainerSource',
        apiName: 'containersources',
        apiVersion: 'sources.knative.dev/v1',
        isNamespaced: true,
      },
      {
        kind: 'SinkBinding',
        apiName: 'sinkbindings',
        apiVersion: 'sources.knative.dev/v1',
        isNamespaced: true,
      },
    ]),
  };
});

import { knativePluginSource } from './mapView';

/**
 * Builds an object as a list test double returns it.
 *
 * @param kind - The object's kind, which also prefixes its UID.
 * @param name - The object's name.
 * @param fields - Fields that replace the defaults; `metadata` is merged into the default one.
 * @returns The object.
 */
function item(
  kind: string,
  name: string,
  {
    metadata,
    ...fields
  }: Omit<Partial<Item>, 'metadata'> & { metadata?: Partial<Item['metadata']> } = {}
): Item {
  return {
    cluster: 'dev',
    metadata: { name, namespace: 'shop', uid: `${kind}-${name}`, ...metadata },
    ...fields,
  };
}

/**
 * Builds the fields of an object that another object owns, for `item`.
 *
 * @param apiVersion - The owner's API version.
 * @param kind - The owner's kind, which also prefixes its UID.
 * @param name - The owner's name.
 * @returns The fields.
 */
function ownedBy(apiVersion: string, kind: string, name: string) {
  return {
    metadata: {
      ownerReferences: [
        {
          apiVersion,
          kind,
          name,
          uid: `${kind}-${name}`,
          controller: true,
          blockOwnerDeletion: true,
        },
      ],
    },
  };
}

/**
 * Builds a CRD of a channel or Source kind, served at one version, as the CRD list returns it.
 *
 * @param plural - The kind's plural name.
 * @param group - The kind's API group.
 * @param kind - The kind.
 * @param version - The served version.
 * @returns The CRD.
 */
function crd(plural: string, group: string, kind: string, version: string) {
  return {
    cluster: 'dev',
    jsonData: {
      metadata: { name: `${plural}.${group}` },
      spec: {
        group,
        names: { plural, kind },
        scope: 'Namespaced',
        versions: [{ name: version, served: true, storage: true }],
      },
    },
  };
}

/**
 * Finds a source of the map's Eventing or Eventing Internals group.
 *
 * @param id - The source's ID.
 * @returns The source.
 */
function eventingSource(id: string): Extract<GraphSource, { useData: unknown }> {
  const groups = 'sources' in knativePluginSource ? knativePluginSource.sources : [];
  const source = groups
    .filter(group => group.id === 'knative-eventing' || group.id === 'knative-eventing-internals')
    .flatMap(group => ('sources' in group ? group.sources : []))
    .find(child => child.id === id);
  if (!source || !('useData' in source)) throw new Error(`No map source ${id}`);
  return source;
}

/**
 * Runs a source's data hook under React.StrictMode.
 *
 * @param id - The source's ID.
 * @returns What the hook returned.
 */
function sourceData(id: string) {
  const source = eventingSource(id);
  return renderHook(() => source.useData(), { wrapper: React.StrictMode }).result.current;
}

/**
 * Lists the edges of a source's data as `source -> target` strings.
 *
 * @param data - The source's data.
 * @returns The edges.
 */
function edgeList(data: ReturnType<typeof sourceData>): string[] {
  return (data?.edges ?? []).map(
    edge => `${edge.source} -> ${edge.target}${edge.label ? ` (${edge.label})` : ''}`
  );
}

const display = item('KnativeService', 'display');
const dlq = item('KubernetesService', 'dlq');

describe('Knative Eventing map sources', () => {
  beforeEach(() => {
    context.clusters = ['dev'];
    context.crdPendingClusters = [];
    context.clustersWithoutEventing = [];
    context.isEventingCheckPending = false;
    context.crds = [
      crd('channels', 'messaging.knative.dev', 'Channel', 'v1'),
      crd('kafkachannels', 'messaging.knative.dev', 'KafkaChannel', 'v1beta1'),
    ];
    context.errors = {};
    context.crdErrors = null;
    context.listedClusters = {};
    context.lists = {
      KnativeService: [display],
      KubernetesService: [dlq],
      Broker: [item('Broker', 'default')],
      Channel: [],
      InMemoryChannel: [],
      KafkaChannel: [],
      NatsJetStreamChannel: [],
      Trigger: [],
      Subscription: [],
    };
  });

  it('links a Broker to its Triggers, and a Trigger to its subscriber and dead letter sink', () => {
    context.lists.Trigger = [
      item('Trigger', 'orders', {
        broker: { name: 'default' },
        subscriber: {
          ref: { apiVersion: 'serving.knative.dev/v1', kind: 'Service', name: 'display' },
        },
        spec: {
          delivery: { deadLetterSink: { ref: { apiVersion: 'v1', kind: 'Service', name: 'dlq' } } },
        },
      }),
      item('Trigger', 'no-spec'),
    ];
    const data = sourceData('knative-trigger');

    expect(data?.nodes?.map(node => node.id)).toEqual(['Trigger-orders', 'Trigger-no-spec']);
    expect(edgeList(data)).toEqual([
      'Broker-default -> Trigger-orders',
      'Trigger-orders -> KnativeService-display',
      'Trigger-orders -> KubernetesService-dlq (dead letter sink)',
    ]);
  });

  it('links any kind of channel to its Subscriptions, and each to its subscriber and reply', () => {
    context.lists.KafkaChannel = [item('KafkaChannel', 'orders')];
    context.lists.Subscription = [
      item('Subscription', 'to-display', {
        spec: {
          channel: { apiVersion: 'messaging.knative.dev/v1', kind: 'KafkaChannel', name: 'orders' },
          subscriber: {
            ref: { apiVersion: 'serving.knative.dev/v1', kind: 'Service', name: 'display' },
          },
          reply: {
            ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' },
          },
        },
        ...ownedBy('flows.knative.dev/v1', 'Sequence', 'pipeline'),
      }),
    ];

    expect(edgeList(sourceData('knative-subscription'))).toEqual([
      'Sequence-pipeline -> Subscription-to-display',
      'KafkaChannel-orders -> Subscription-to-display',
      'Subscription-to-display -> KnativeService-display',
      'Subscription-to-display -> Broker-default (reply)',
    ]);
  });

  it("shows a Broker's channels and its Triggers' Subscriptions only in Eventing Internals", () => {
    context.crds.push(crd('inmemorychannels', 'messaging.knative.dev', 'InMemoryChannel', 'v1'));
    context.lists.InMemoryChannel = [
      item(
        'InMemoryChannel',
        'default-kne-trigger',
        ownedBy('eventing.knative.dev/v1', 'Broker', 'default')
      ),
      item('InMemoryChannel', 'orders'),
    ];
    context.lists.Subscription = [
      item(
        'Subscription',
        'default-orders',
        ownedBy('eventing.knative.dev/v1', 'Trigger', 'default')
      ),
      item('Subscription', 'to-display'),
    ];
    context.lists.KubernetesService = [
      dlq,
      item(
        'KubernetesService',
        'default-kne-trigger-kn-channel',
        ownedBy('messaging.knative.dev/v1', 'InMemoryChannel', 'default-kne-trigger')
      ),
    ];
    const nodeIds = (id: string) => sourceData(id)?.nodes?.map(node => node.id);

    expect(nodeIds('knative-channel-implementation')).toEqual(['InMemoryChannel-orders']);
    expect(nodeIds('knative-subscription')).toEqual(['Subscription-to-display']);
    expect(nodeIds('knative-broker-channel')).toEqual(['InMemoryChannel-default-kne-trigger']);
    expect(nodeIds('knative-trigger-subscription')).toEqual(['Subscription-default-orders']);
    expect(edgeList(sourceData('knative-broker-channel'))).toEqual([
      'Broker-default -> InMemoryChannel-default-kne-trigger',
      'InMemoryChannel-default-kne-trigger -> KubernetesService-default-kne-trigger-kn-channel',
    ]);
    expect(edgeList(sourceData('knative-broker'))).toEqual([
      'Broker-default -> KubernetesService-default-kne-trigger-kn-channel',
    ]);
    expect(edgeList(sourceData('knative-trigger-subscription'))).toEqual([
      'Trigger-default -> Subscription-default-orders',
    ]);
  });

  it('links a Source to its Deployment, and a channel to its Service', () => {
    context.crds.push(crd('apiserversources', 'sources.knative.dev', 'ApiServerSource', 'v1'));
    context.lists.ApiServerSource = [item('ApiServerSource', 'events')];
    context.lists.KafkaChannel = [item('KafkaChannel', 'events')];
    context.lists.Deployment = [
      item(
        'Deployment',
        'apiserversource-events',
        ownedBy('sources.knative.dev/v1', 'ApiServerSource', 'events')
      ),
    ];
    context.lists.KubernetesService = [
      dlq,
      item(
        'KubernetesService',
        'events-kn-channel',
        ownedBy('messaging.knative.dev/v1beta1', 'KafkaChannel', 'events')
      ),
    ];

    expect(edgeList(sourceData('knative-source'))).toContain(
      'ApiServerSource-events -> Deployment-apiserversource-events'
    );
    expect(edgeList(sourceData('knative-channel-implementation'))).toContain(
      'KafkaChannel-events -> KubernetesService-events-kn-channel'
    );
  });

  it('lists a channel kind at its served version, and requests no kind not installed', () => {
    context.lists.InMemoryChannel = [
      item('InMemoryChannel', 'orders', ownedBy('messaging.knative.dev/v1', 'Channel', 'orders')),
    ];
    context.crds = [
      crd('channels', 'messaging.knative.dev', 'Channel', 'v1'),
      crd('inmemorychannels', 'messaging.knative.dev', 'InMemoryChannel', 'v1'),
      crd('kafkachannels', 'messaging.knative.dev', 'KafkaChannel', 'v1beta1'),
    ];
    const data = sourceData('knative-channel-implementation');

    expect(data?.nodes?.map(node => node.id)).toEqual(['InMemoryChannel-orders']);
    expect(edgeList(data)).toEqual(['Channel-orders -> InMemoryChannel-orders']);
    expect(context.listedClusters).toMatchObject({
      InMemoryChannel: ['dev'],
      KafkaChannel: ['dev'],
      NatsJetStreamChannel: [],
    });
  });

  it('links each Source to its sink and to the Source that created it', () => {
    context.crds = [
      crd('channels', 'messaging.knative.dev', 'Channel', 'v1'),
      crd('pingsources', 'sources.knative.dev', 'PingSource', 'v1'),
      crd('sinkbindings', 'sources.knative.dev', 'SinkBinding', 'v1'),
      crd('containersources', 'sources.knative.dev', 'ContainerSource', 'v1'),
    ];
    context.lists.PingSource = [
      item('PingSource', 'beat', {
        sink: { ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' } },
      }),
    ];
    context.lists.ContainerSource = [item('ContainerSource', 'heartbeats')];
    context.lists.SinkBinding = [
      item('SinkBinding', 'heartbeats-sinkbinding', {
        sink: { uri: 'https://example.com/events' },
        ...ownedBy('sources.knative.dev/v1', 'ContainerSource', 'heartbeats'),
      }),
    ];
    const data = sourceData('knative-source');

    expect(data?.nodes?.map(node => node.id).sort()).toEqual([
      'ContainerSource-heartbeats',
      'PingSource-beat',
      'SinkBinding-heartbeats-sinkbinding',
    ]);
    expect(edgeList(data)).toEqual([
      'ContainerSource-heartbeats -> SinkBinding-heartbeats-sinkbinding',
      'PingSource-beat -> Broker-default',
    ]);
    expect(context.listedClusters.KafkaSource).toEqual([]);
  });

  it('waits while the CRDs load', () => {
    context.crdPendingClusters = ['dev'];
    expect(sourceData('knative-source')).toBeNull();
  });

  it('waits for the CRDs of every cluster, even when the list says it has loaded', () => {
    context.clusters = ['dev', 'staging'];
    context.crdPendingClusters = ['staging'];

    expect(sourceData('knative-trigger')).toBeNull();
    expect(context.listedClusters.Trigger).toEqual([]);
  });

  it('shows a node that says which list failed, with the reason in its details', () => {
    context.lists.Broker = null;
    context.errors.Broker = {
      message: 'brokers.eventing.knative.dev is forbidden',
      cluster: 'dev',
      status: 403,
    };
    const data = sourceData('knative-broker');

    expect(data?.nodes).toEqual([
      expect.objectContaining({
        id: 'knative-list-error:Brokers:dev',
        label: 'Brokers could not be listed',
        subtitle: 'dev',
        status: 'error',
      }),
    ]);
    const node = data?.nodes?.[0];
    const Details = node?.detailsComponent;
    if (!node || !Details) throw new Error('The error node has no details panel');
    const { container } = render(<Details node={node} />);
    expect(container.textContent).toBe(
      'ClusterdevStatus Code403Messagebrokers.eventing.knative.dev is forbidden'
    );
  });

  it("warns when the CRDs cannot be listed, and still shows Knative's own kinds", () => {
    context.crds = [];
    context.crdErrors = [{ message: 'customresourcedefinitions is forbidden', cluster: 'dev' }];
    context.lists.PingSource = [item('PingSource', 'beat')];
    context.lists.ApiServerSource = [];
    context.lists.ContainerSource = [];
    context.lists.SinkBinding = [];
    const nodes = sourceData('knative-source')?.nodes;

    expect(nodes?.map(node => [node.id, node.status, node.label])).toEqual([
      ['PingSource-beat', 'warning', undefined],
      ['knative-list-error:Source CRDs:dev', 'warning', 'Source CRDs could not be listed'],
    ]);
    expect(nodes?.[1]).toMatchObject({
      listError: {
        message: "customresourcedefinitions is forbidden Only Knative's own kinds are shown.",
      },
    });
    expect(context.listedClusters.KafkaSource).toEqual([]);
  });

  it('shows nothing about Eventing in a cluster without it whose CRDs cannot be listed', () => {
    context.crds = [];
    context.crdErrors = [{ message: 'customresourcedefinitions is forbidden', cluster: 'dev' }];
    context.clustersWithoutEventing = ['dev'];

    expect(sourceData('knative-source')).toEqual({ nodes: [], edges: [] });
    expect(sourceData('knative-broker')).toEqual({ nodes: [], edges: [] });
    expect(context.listedClusters.PingSource).toEqual([]);
    expect(context.listedClusters.Broker).toEqual([]);
  });

  it('waits while it checks whether a cluster whose CRDs cannot be listed has Eventing', () => {
    context.crds = [];
    context.crdErrors = [{ message: 'customresourcedefinitions is forbidden', cluster: 'dev' }];
    context.isEventingCheckPending = true;

    expect(sourceData('knative-source')).toBeNull();
    expect(context.listedClusters.PingSource).toEqual([]);
  });

  it('names the cluster it leaves out when the clusters share no version of a kind', () => {
    context.clusters = ['dev', 'staging'];
    context.crds.push({
      ...crd('kafkachannels', 'messaging.knative.dev', 'KafkaChannel', 'v1'),
      cluster: 'staging',
    });
    const nodes = sourceData('knative-channel-implementation')?.nodes;

    expect(context.listedClusters.KafkaChannel).toEqual(['staging']);
    expect(nodes).toEqual([
      expect.objectContaining({
        id: 'knative-list-error:KafkaChannels:dev',
        label: 'KafkaChannels could not be listed',
        listError: expect.objectContaining({
          cluster: 'dev',
          message: 'Its CRD does not serve the version that the map lists in the other clusters.',
        }),
      }),
    ]);
  });

  it('lists in a cluster whose name has a comma', () => {
    context.clusters = ['prod,eu'];
    context.crds = [];
    context.crdErrors = [{ message: 'customresourcedefinitions is forbidden', cluster: 'prod,eu' }];
    sourceData('knative-trigger');
    sourceData('knative-source');

    expect(context.listedClusters.Trigger).toEqual(['prod,eu']);
    expect(context.listedClusters.PingSource).toEqual(['prod,eu']);
  });

  it('shows the nodes before the objects they point to have loaded', () => {
    context.lists.KnativeService = null;
    context.lists.Broker = [
      item('Broker', 'default', {
        spec: {
          delivery: { deadLetterSink: { ref: { apiVersion: 'v1', kind: 'Service', name: 'dlq' } } },
        },
      }),
    ];

    expect(sourceData('knative-broker')).toEqual({
      nodes: [expect.objectContaining({ id: 'Broker-default' })],
      edges: [],
    });
  });

  it("loads a node's details from the node's own cluster", () => {
    context.lists.Broker = [
      item('Broker', 'default', {
        cluster: 'staging',
        jsonData: { metadata: { name: 'default', namespace: 'shop' } },
      }),
    ];
    const node = sourceData('knative-broker')?.nodes?.[0];
    const Details = node?.detailsComponent;
    if (!node || !Details) throw new Error('The Broker node has no details panel');
    context.details.length = 0;
    render(<Details node={node} />);

    expect(context.details).toEqual([
      expect.objectContaining({ name: 'default', namespace: 'shop', cluster: 'staging' }),
    ]);
  });

  it('sends no request for Eventing kinds to a cluster without Knative Eventing', () => {
    context.crds = [];
    context.lists.Broker = [item('Broker', 'default')];

    expect(sourceData('knative-broker')).toEqual({ nodes: [], edges: [] });
    expect(context.listedClusters.Broker).toEqual([]);
  });
});
