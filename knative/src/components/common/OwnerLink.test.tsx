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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { render } from '@testing-library/react';
import type React from 'react';
import { vi } from 'vitest';

/** The props of Headlamp's `Link` that the test records. */
type LinkProps = {
  /** The route to link to. */
  routeName: string;
  /** The route's parameters. */
  params: Record<string, string>;
  /** The query of the link, when it has one. */
  search?: Record<string, string>;
};

/** A channel CRD as the test lists it: its name, group and kind. */
type ChannelCrd = {
  /** The CRD's metadata. */
  metadata: {
    /** The CRD's name, `<plural>.<group>`. */
    name: string;
  };
  /** The CRD as Kubernetes returns it. */
  jsonData: {
    /** The parts of the CRD's spec that OwnerLink reads. */
    spec: {
      /** The API group. */
      group: string;
      /** The kind. */
      names: {
        /** The kind's name. */
        kind: string;
      };
    };
  };
};

const links = vi.hoisted(() => [] as LinkProps[]);
const channelCrds = vi.hoisted(() => ({
  items: [] as ChannelCrd[] | null,
  listOptions: [] as unknown[],
}));

vi.mock('../../resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    useList: (options: unknown) => {
      channelCrds.listOptions.push(options);
      return [channelCrds.items && [...channelCrds.items], null];
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ routeName, params, search, children }: LinkProps & { children?: React.ReactNode }) => {
    links.push({ routeName, params, ...(search && { search }) });
    return children;
  },
}));

vi.mock('../../resources/knative', () => {
  /**
   * Builds the static side of a resource class, as OwnerLink reads it.
   *
   * @param apiVersion - API version of the kind.
   * @param kind - The kind.
   * @param detailsRoute - The class's detail route; Headlamp's default is the kind.
   * @returns A stand-in for the class.
   */
  const resourceClass = (apiVersion: string, kind: string, detailsRoute = kind) => ({
    apiVersion,
    kind,
    apiName: `${kind.toLowerCase()}s`,
    detailsRoute,
  });
  return {
    CHANNEL_API_GROUP: 'messaging.knative.dev',
    CHANNEL_CRD_LABEL_SELECTOR: 'messaging.knative.dev/subscribable=true',
    GENERIC_CHANNEL_CRD_NAME: 'channels.messaging.knative.dev',
    KnativeChannelImplementation: { detailsRoute: 'knativeChannelImplementationDetails' },
    getKnativeCrdName: (cls: { apiVersion: string; apiName: string }) =>
      `${cls.apiName}.${cls.apiVersion.split('/')[0]}`,
    KnativeBroker: resourceClass('eventing.knative.dev/v1', 'Broker', 'knativeBrokerDetails'),
    KnativeCertificate: resourceClass('networking.internal.knative.dev/v1alpha1', 'Certificate'),
    KnativeChannel: resourceClass('messaging.knative.dev/v1', 'Channel', 'knativeChannelDetails'),
    KnativeConfiguration: resourceClass('serving.knative.dev/v1', 'Configuration'),
    KnativeImage: resourceClass('caching.internal.knative.dev/v1alpha1', 'Image'),
    KnativeIngress: resourceClass('networking.internal.knative.dev/v1alpha1', 'Ingress'),
    KnativeMetric: resourceClass('autoscaling.internal.knative.dev/v1alpha1', 'Metric'),
    KnativePodAutoscaler: resourceClass(
      'autoscaling.internal.knative.dev/v1alpha1',
      'PodAutoscaler'
    ),
    KnativeRoute: resourceClass('serving.knative.dev/v1', 'Route'),
    KnativeServerlessService: resourceClass(
      'networking.internal.knative.dev/v1alpha1',
      'ServerlessService'
    ),
    KnativeSubscription: resourceClass(
      'messaging.knative.dev/v1',
      'Subscription',
      'knativeSubscriptionDetails'
    ),
    KnativeTrigger: resourceClass('eventing.knative.dev/v1', 'Trigger', 'knativeTriggerDetails'),
  };
});

import { ownerColumn, OwnerLink } from './OwnerLink';

/**
 * Renders a link to an object of the given kind and returns the route it links to.
 *
 * @param apiVersion - API version of the object.
 * @param kind - Kind of the object.
 * @returns The route name and parameters of the link, or undefined when it renders no link.
 */
function linkTo(apiVersion: string, kind: string): LinkProps | undefined {
  links.length = 0;
  channelCrds.listOptions.length = 0;
  render(<OwnerLink owner={{ apiVersion, kind, name: 'item' }} namespace="ns" />);
  return links[0];
}

/**
 * Builds a channel CRD as the test lists it.
 *
 * @param name - The CRD's name.
 * @param group - The API group.
 * @param kind - The kind.
 * @returns The CRD.
 */
function channelCrd(name: string, group: string, kind: string): ChannelCrd {
  return { metadata: { name }, jsonData: { spec: { group, names: { kind } } } };
}

describe('OwnerLink', () => {
  beforeEach(() => {
    channelCrds.items = [
      channelCrd('kafkachannels.messaging.knative.dev', 'messaging.knative.dev', 'KafkaChannel'),
    ];
  });

  it.each([
    ['eventing.knative.dev/v1', 'Broker', 'knativeBrokerDetails'],
    ['eventing.knative.dev/v1', 'Trigger', 'knativeTriggerDetails'],
    ['messaging.knative.dev/v1', 'Channel', 'knativeChannelDetails'],
    ['messaging.knative.dev/v1', 'Subscription', 'knativeSubscriptionDetails'],
    ['serving.knative.dev/v1', 'Service', 'kserviceDetails'],
    ['v1', 'Secret', 'Secret'],
    ['v1', 'ConfigMap', 'ConfigMap'],
  ])('links %s %s to its own page', (apiVersion, kind, routeName) => {
    expect(linkTo(apiVersion, kind)).toEqual({
      routeName,
      params: { namespace: 'ns', name: 'item' },
    });
  });

  it('links a Knative kind without its own page to the Custom Resource view', () => {
    expect(linkTo('serving.knative.dev/v1', 'Configuration')).toEqual({
      routeName: 'customresource',
      params: { crd: 'configurations.serving.knative.dev', namespace: 'ns', crName: 'item' },
    });
  });

  it("links a channel implementation to the plugin's page, naming its CRD", () => {
    expect(linkTo('messaging.knative.dev/v1beta1', 'KafkaChannel')).toEqual({
      routeName: 'knativeChannelImplementationDetails',
      params: { namespace: 'ns', name: 'item' },
      search: { crd: 'kafkachannels.messaging.knative.dev' },
    });
    expect(channelCrds.listOptions[0]).toEqual({
      cluster: undefined,
      labelSelector: 'messaging.knative.dev/subscribable=true',
    });
  });

  it("links Knative's own InMemoryChannel without listing CRDs", () => {
    expect(linkTo('messaging.knative.dev/v1', 'InMemoryChannel')).toEqual({
      routeName: 'knativeChannelImplementationDetails',
      params: { namespace: 'ns', name: 'item' },
      search: { crd: 'inmemorychannels.messaging.knative.dev' },
    });
    expect(channelCrds.listOptions).toEqual([]);
  });

  it.each<[string, string, ChannelCrd[] | null]>([
    ['no channel CRD defines it', 'KafkaChannel', []],
    [
      'the same kind is in another group',
      'KafkaChannel',
      [channelCrd('kafkachannels.other.io', 'other.io', 'KafkaChannel')],
    ],
    ['the channel CRDs are loading or cannot be listed', 'KafkaChannel', null],
    [
      'it is the generic Channel at another version',
      'Channel',
      [channelCrd('channels.messaging.knative.dev', 'messaging.knative.dev', 'Channel')],
    ],
  ])('shows the name of a messaging kind it cannot link when %s', (_case, kind, crds) => {
    channelCrds.items = crds;

    expect(linkTo('messaging.knative.dev/v1beta1', kind)).toBeUndefined();
  });

  it.each([
    ['a core kind', 'v1', 'Pod'],
    ['a kind it already knows', 'eventing.knative.dev/v1', 'Broker'],
    ['a kind outside messaging.knative.dev', 'flows.knative.dev/v1', 'Sequence'],
    ['a kind of another project', 'example.com/v1', 'Widget'],
  ])('does not list channel CRDs for %s', (_case, apiVersion, kind) => {
    linkTo(apiVersion, kind);

    expect(channelCrds.listOptions).toEqual([]);
  });
});

/** A list row with an owner, standing in for a Subscription or a channel implementation. */
type Row = KubeObject & {
  /** The object that created the row. */
  owner?: { apiVersion: string; kind: string; name: string };
};

describe('ownerColumn', () => {
  it('sorts by the owner name and links the owner from the row', () => {
    const column = ownerColumn<Row>();
    const row = {
      owner: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' },
      metadata: { namespace: 'orders' },
      cluster: 'cluster-a',
    } as Row;
    if (!('getValue' in column) || !column.getValue || !column.render) {
      throw new Error('The column has no getValue and render.');
    }

    expect(column.getValue(row)).toBe('default');
    links.length = 0;
    render(<>{column.render(row)}</>);
    expect(links).toEqual([
      { routeName: 'knativeBrokerDetails', params: { namespace: 'orders', name: 'default' } },
    ]);
  });
});
