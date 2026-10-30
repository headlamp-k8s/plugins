/*
 * Copyright 2026 The Kubernetes Authors
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

import type { KubeCRD } from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { render } from '@testing-library/react';
import type React from 'react';
import { vi } from 'vitest';

/** One row of the page's details, as the test reads it. */
type InfoRow = {
  /** The row's heading. */
  name: string;
  /** The row's content. */
  value: React.ReactNode;
  /** Whether the row is hidden. */
  hide?: boolean;
};

/** A channel as the page's rows read it. */
type ChannelStub = {
  /** The channel's cluster. */
  cluster: string;
  /** Gives the channel's namespace. */
  getNamespace: () => string;
  /** The channel's address. */
  address?: string;
  /** The settings of the channel's own kind. */
  settings?: Record<string, unknown>;
  /** The channel's spec. */
  spec?: {
    /** The channel's delivery settings. */
    delivery?: unknown;
  };
  /** The channel's status. */
  status?: {
    /** The resolved dead letter sink. */
    deadLetterSinkUri?: string;
  };
};

/** The props of `EventingResourceDetail` that the test records. */
type DetailProps = {
  /** The class the page loads. */
  resourceType: unknown;
  /** Builds the rows shown below the metadata. */
  extraInfo: (channel: ChannelStub) => InfoRow[];
  /** Builds the sections shown after the conditions. */
  extraSections: (channel: ChannelStub) => {
    /** Identifies the section. */
    id: string;
    /** The section. */
    section: React.ReactNode;
  }[];
};

const context = vi.hoisted(() => ({
  crd: 'kafkachannels.messaging.knative.dev',
  crdResult: [null, null] as [unknown, unknown],
  gets: [] as unknown[][],
  pages: [] as DetailProps[],
  deliveryArgs: [] as unknown[][],
  yaml: [] as { value: string; ariaLabel: string }[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ K8s: { useCluster: () => 'cluster-a' } }));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  EmptyContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Loader: ({ title }: { title: string }) => <>{title}</>,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: `?crd=${context.crd}` }),
}));

vi.mock('../../resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    useGet: (...args: unknown[]) => {
      context.gets.push(args);
      return context.crdResult;
    },
  },
}));

vi.mock('../../resources/knative', async () => ({
  getKnativeCrdName: (
    await vi.importActual<typeof import('../../resources/knative/customResourceLinks')>(
      '../../resources/knative/customResourceLinks'
    )
  ).getKnativeCrdName,
  CHANNEL_CRD_LABEL_KEY: 'messaging.knative.dev/subscribable',
  GENERIC_CHANNEL_CRD_NAME: 'channels.messaging.knative.dev',
  getKnativeChannelImplementationClass: (info: object) => ({ classFor: info }),
}));

vi.mock('../common/EventingResourceDetail', () => ({
  EventingResourceDetail: (props: DetailProps) => {
    context.pages.push(props);
    return null;
  },
}));

vi.mock('../common/DeliveryRows', () => ({
  getDeliveryRows: (...args: unknown[]) => {
    context.deliveryArgs.push(args);
    return [{ name: 'Retry', value: '3' }];
  },
}));

vi.mock('../common/ReadOnlyYaml', () => ({
  ReadOnlyYaml: (props: { value: string; ariaLabel: string }) => {
    context.yaml.push(props);
    return null;
  },
}));

vi.mock('../common/ResourceListCells', () => ({
  TextValue: ({ value }: { value?: string }) => <>{value ?? '-'}</>,
}));

vi.mock('../channels/ChannelSubscribers', () => ({ ChannelSubscribers: () => null }));

import { ChannelImplementationDetail } from './Detail';

const kafkaCrd: KubeCRD = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'kafkachannels.messaging.knative.dev',
    uid: 'uid-1',
    creationTimestamp: '',
    labels: { 'messaging.knative.dev/subscribable': 'true' },
  },
  spec: {
    group: 'messaging.knative.dev',
    version: 'v1beta1',
    names: {
      plural: 'kafkachannels',
      singular: 'kafkachannel',
      kind: 'KafkaChannel',
      listKind: 'KafkaChannelList',
    },
    scope: 'Namespaced',
    versions: [
      { name: 'v1beta1', served: true, storage: true, additionalPrinterColumns: [] },
      { name: 'v1', served: true, storage: false, additionalPrinterColumns: [] },
    ],
  },
};

/**
 * Renders the page and returns the props it gave `EventingResourceDetail`.
 *
 * @returns The page's text and the recorded props, if the page was shown.
 */
function renderPage() {
  context.pages.length = 0;
  context.gets.length = 0;
  context.deliveryArgs.length = 0;
  context.yaml.length = 0;
  const { container } = render(<ChannelImplementationDetail />);
  return { text: container.textContent, page: context.pages[context.pages.length - 1] };
}

/**
 * Builds a KafkaChannel as the page's rows read it.
 *
 * @param settings - The settings of the channel's own kind.
 * @returns The channel.
 */
function kafkaChannel(settings?: Record<string, unknown>): ChannelStub {
  return {
    cluster: 'cluster-a',
    getNamespace: () => 'shop',
    address: 'http://orders.shop.svc',
    settings,
    spec: { delivery: { retry: 3 } },
    status: { deadLetterSinkUri: 'http://dlq.shop.svc' },
  };
}

describe('ChannelImplementationDetail', () => {
  beforeEach(() => {
    context.crd = 'kafkachannels.messaging.knative.dev';
    context.crdResult = [{ metadata: kafkaCrd.metadata, jsonData: kafkaCrd }, null];
  });

  it('loads the kind named by the CRD in the URL, at the version the CRD stores', () => {
    const { page } = renderPage();

    expect(context.gets[0]).toEqual([
      'kafkachannels.messaging.knative.dev',
      undefined,
      { cluster: 'cluster-a' },
    ]);
    expect(page.resourceType).toEqual({
      classFor: {
        kind: 'KafkaChannel',
        apiName: 'kafkachannels',
        apiVersion: 'messaging.knative.dev/v1beta1',
        isNamespaced: true,
      },
    });
  });

  it('shows the kind, address, delivery settings and the settings of its kind', () => {
    const rows = renderPage().page.extraInfo(
      kafkaChannel({ numPartitions: 3, retentionDuration: 'PT24H' })
    );
    render(
      <>
        {rows.map(row => (
          <p key={row.name}>{row.value}</p>
        ))}
      </>
    );

    expect(rows.map(row => [row.name, row.hide])).toEqual([
      ['Kind', undefined],
      ['Address', undefined],
      ['Retry', undefined],
      ['Settings', false],
    ]);
    expect(context.deliveryArgs).toEqual([
      [{ retry: 3 }, 'http://dlq.shop.svc', 'shop', 'cluster-a'],
    ]);
    expect(context.yaml).toEqual([
      {
        value: 'numPartitions: 3\nretentionDuration: PT24H\n',
        ariaLabel: 'KafkaChannel settings YAML',
      },
    ]);
  });

  it('hides the settings when its kind has none', () => {
    const settings = renderPage()
      .page.extraInfo(kafkaChannel())
      .find(row => row.name === 'Settings');

    expect(settings?.hide).toBe(true);
  });

  it("adds the channel's Subscriptions", () => {
    expect(
      renderPage()
        .page.extraSections(kafkaChannel())
        .map(section => section.id)
    ).toEqual(['knative.channel-implementation-subscriptions']);
  });

  it('waits while the CRD loads', () => {
    context.crdResult = [null, null];
    const { text, page } = renderPage();

    expect(text).toBe("Loading the channel's CustomResourceDefinition");
    expect(page).toBeUndefined();
  });

  it("still shows Knative's own InMemoryChannel when its CRD cannot be read", () => {
    context.crd = 'inmemorychannels.messaging.knative.dev';
    context.crdResult = [null, new Error('forbidden')];

    expect(renderPage().page.resourceType).toEqual({
      classFor: {
        kind: 'InMemoryChannel',
        apiName: 'inmemorychannels',
        apiVersion: 'messaging.knative.dev/v1',
        isNamespaced: true,
      },
    });
  });

  it('says so when the CRD of another kind cannot be read', () => {
    context.crdResult = [null, new Error('forbidden')];
    const { text, page } = renderPage();

    expect(text).toBe(
      'The CustomResourceDefinition kafkachannels.messaging.knative.dev could not be read, ' +
        'so this channel cannot be shown.'
    );
    expect(page).toBeUndefined();
  });

  it('says so when the CRD in the URL is not a channel implementation', () => {
    context.crd = 'pingsources.sources.knative.dev';
    context.crdResult = [
      { metadata: { name: 'pingsources.sources.knative.dev', labels: {} } },
      null,
    ];
    const { text, page } = renderPage();

    expect(text).toBe(
      'The CustomResourceDefinition pingsources.sources.knative.dev is not a channel ' +
        'implementation, so this channel cannot be shown.'
    );
    expect(page).toBeUndefined();
  });

  it('does not show the generic Channel as a channel implementation', () => {
    context.crd = 'channels.messaging.knative.dev';
    context.crdResult = [
      {
        metadata: {
          name: 'channels.messaging.knative.dev',
          labels: { 'messaging.knative.dev/subscribable': 'true' },
        },
      },
      null,
    ];

    expect(renderPage().page).toBeUndefined();
  });

  it('says so when the CRD serves no version', () => {
    const versions = kafkaCrd.spec.versions.map(version => ({ ...version, served: false }));
    context.crdResult = [
      {
        metadata: kafkaCrd.metadata,
        jsonData: { ...kafkaCrd, spec: { ...kafkaCrd.spec, versions } },
      },
      null,
    ];
    const { text, page } = renderPage();

    expect(text).toBe(
      'The CustomResourceDefinition kafkachannels.messaging.knative.dev serves no version, so ' +
        'this channel cannot be shown.'
    );
    expect(page).toBeUndefined();
  });

  it('says so, without reading any CRD, when the link names no CRD', () => {
    context.crd = '';
    const { text, page } = renderPage();

    expect(text).toBe(
      'The link names no CustomResourceDefinition, so this channel cannot be shown.'
    );
    expect(context.gets).toEqual([]);
    expect(page).toBeUndefined();
  });
});
