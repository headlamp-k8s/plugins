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

import { render } from '@testing-library/react';
import type React from 'react';
import { generatePath, matchPath } from 'react-router-dom';
import { vi } from 'vitest';
import type { DiscoveredKindDetail } from '../common/DiscoveredKindDetail';

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

/** The props of `DiscoveredKindDetail`. */
type DiscoveredProps = React.ComponentProps<typeof DiscoveredKindDetail>;

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
  detail: [] as DiscoveredProps[],
  pages: [] as DetailProps[],
  deliveryArgs: [] as unknown[][],
  yaml: [] as { value: string; ariaLabel: string }[],
}));

vi.mock('../../resources/knative', () => ({
  CHANNEL_IMPLEMENTATION_FAMILY: { labelKey: 'messaging.knative.dev/subscribable' },
}));

vi.mock('../common/DiscoveredKindDetail', () => ({
  DiscoveredKindDetail: (props: DiscoveredProps) => {
    context.detail.push(props);
    return null;
  },
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

import { CHANNEL_IMPLEMENTATION_FAMILY } from '../../resources/knative';
import { CHANNEL_IMPLEMENTATION_DETAILS_PATH, ChannelImplementationDetail } from './Detail';

const kafkaChannelClass = { kind: 'KafkaChannel' };

/**
 * Renders the page and returns the props it gave `DiscoveredKindDetail`.
 *
 * @returns The recorded props.
 */
function renderDetail() {
  context.detail.length = 0;
  render(<ChannelImplementationDetail />);
  return context.detail[context.detail.length - 1];
}

/**
 * Renders the page for a KafkaChannel and returns the props it gave `EventingResourceDetail`.
 *
 * @returns The recorded props.
 */
function renderPage() {
  context.pages.length = 0;
  context.deliveryArgs.length = 0;
  context.yaml.length = 0;
  const Page = renderDetail().page;
  render(<Page kindClass={kafkaChannelClass} />);
  return context.pages[context.pages.length - 1];
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
  it('finds the kind in the channel implementation family', () => {
    expect(renderDetail()).toMatchObject({
      family: CHANNEL_IMPLEMENTATION_FAMILY,
      kindLabel: 'channel implementation',
    });
  });

  it('loads the channel with the class of its kind', () => {
    expect(renderPage().resourceType).toBe(kafkaChannelClass);
  });

  it('shows the address, delivery settings and the settings of its kind', () => {
    const rows = renderPage().extraInfo(
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
      .extraInfo(kafkaChannel())
      .find(row => row.name === 'Settings');

    expect(settings?.hide).toBe(true);
  });

  it("adds the channel's Subscriptions", () => {
    expect(
      renderPage()
        .extraSections(kafkaChannel())
        .map(section => section.id)
    ).toEqual(['knative.channel-implementation-subscriptions']);
  });
});

describe('CHANNEL_IMPLEMENTATION_DETAILS_PATH', () => {
  it.each([
    [
      'a channel in a namespace',
      { namespace: 'shop', name: 'orders' },
      '/knative/channel-implementations/shop/orders',
    ],
    [
      'a channel of a cluster-scoped kind',
      { name: 'orders' },
      '/knative/channel-implementations/orders',
    ],
  ])('links to and opens %s', (_case, params, url) => {
    expect(generatePath(CHANNEL_IMPLEMENTATION_DETAILS_PATH, params)).toBe(url);
    expect(
      matchPath(url, { path: CHANNEL_IMPLEMENTATION_DETAILS_PATH, exact: true })?.params
    ).toEqual(params);
  });
});
