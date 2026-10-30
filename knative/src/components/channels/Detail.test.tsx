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

import { render } from '@testing-library/react';
import type React from 'react';
import { Fragment } from 'react';
import { vi } from 'vitest';
import type { KnativeChannel } from '../../resources/knative';

/** The props of Headlamp's `Link` that the test records. */
type LinkProps = {
  /** The route to link to. */
  routeName: string;
  /** The route's parameters. */
  params: Record<string, string>;
  /** The cluster the route is in. */
  activeCluster?: string;
};

/** The props of the Channel page's `EventingResourceDetail` that the test records. */
type DetailProps = {
  /** Builds the rows shown below the metadata, for the loaded Channel. */
  extraInfo?: (channel: unknown) => {
    /** The row's heading. */
    name: string;
    /** The row's content. */
    value: React.ReactNode;
  }[];
};

const links = vi.hoisted(() => [] as LinkProps[]);
const destinationLink = vi.hoisted(() => vi.fn().mockReturnValue(null));
const detail = vi.hoisted(() => ({} as DetailProps));
const subscriptions = vi.hoisted(() => ({
  items: [] as Array<{ metadata: { uid: string }; getName: () => string }>,
  error: null as Error | null,
  lists: 0,
}));

/**
 * Renders the children of a mocked wrapper component.
 *
 * @param props - The wrapper's children.
 * @returns The children.
 */
function Children({ children }: { children?: React.ReactNode }) {
  return children;
}

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({
    routeName,
    params,
    activeCluster,
    children,
  }: LinkProps & { children?: React.ReactNode }) => {
    links.push({ routeName, params, activeCluster });
    return children;
  },
  EmptyContent: Children,
  LightTooltip: Children,
  SectionBox: Children,
  StatusLabel: Children,
  SimpleTable: ({
    data,
    columns,
  }: {
    data: unknown[];
    columns: Array<{ getter: (row: unknown) => React.ReactNode }>;
  }) =>
    data.map((row, index) => (
      <div key={index}>
        {columns.map((column, cell) => (
          <span key={cell}>{column.getter(row)}</span>
        ))}
      </div>
    )),
}));

vi.mock('../../resources/knative', () => ({
  KnativeChannel: {},
  KnativeSubscription: {
    detailsRoute: 'knativeSubscriptionDetails',
    useList: () => {
      subscriptions.lists += 1;
      return [subscriptions.items, subscriptions.error];
    },
  },
}));

vi.mock('../common/DestinationLink', () => ({ DestinationLink: destinationLink }));

vi.mock('../common/EventingResourceDetail', () => ({
  EventingResourceDetail: (props: DetailProps) => {
    detail.extraInfo = props.extraInfo;
    return null;
  },
}));

import { ChannelSubscribers } from './ChannelSubscribers';
import { ChannelDetail } from './Detail';

/**
 * Builds a Channel in namespace `orders` of `cluster-a` with the given subscriber states.
 *
 * @param subscribers - The subscriber states the Channel reports.
 * @returns The Channel.
 */
function channel(subscribers: NonNullable<KnativeChannel['status']>['subscribers']) {
  const stub = {
    cluster: 'cluster-a',
    getNamespace: () => 'orders',
    status: { subscribers },
  } satisfies Pick<KnativeChannel, 'cluster' | 'getNamespace' | 'status'>;
  return stub as unknown as KnativeChannel;
}

beforeEach(() => {
  links.length = 0;
  destinationLink.mockClear();
  subscriptions.lists = 0;
  subscriptions.error = null;
  subscriptions.items = [{ metadata: { uid: 'uid-1' }, getName: () => 'orders-to-display' }];
});

describe('ChannelDetail', () => {
  it('shows the backing Channel and the address', () => {
    render(<ChannelDetail />);

    const rows = detail.extraInfo?.({
      cluster: 'cluster-a',
      getNamespace: () => 'orders',
      address: 'http://orders-kn-channel.orders.svc.cluster.local',
      status: {
        channel: {
          apiVersion: 'messaging.knative.dev/v1',
          kind: 'InMemoryChannel',
          name: 'orders',
        },
      },
    });

    expect(rows?.map(row => row.name)).toEqual(['Backing Channel', 'Address']);
    const { container } = render(
      <>
        {rows?.map(row => (
          <Fragment key={row.name}>{row.value}</Fragment>
        ))}
      </>
    );
    expect(container.textContent).toBe('http://orders-kn-channel.orders.svc.cluster.local');
    expect(destinationLink.mock.calls.map(([props]) => props)).toEqual([
      {
        destination: {
          ref: { apiVersion: 'messaging.knative.dev/v1', kind: 'InMemoryChannel', name: 'orders' },
        },
        namespace: 'orders',
        cluster: 'cluster-a',
      },
    ]);
  });
});

describe('ChannelSubscribers', () => {
  it("links each subscriber to its Subscription's page by UID", () => {
    const { container } = render(
      <ChannelSubscribers channel={channel([{ uid: 'uid-1', ready: 'True' }])} />
    );

    expect(container.textContent).toContain('orders-to-display');
    expect(container.textContent).toContain('Ready');
    expect(links).toEqual([
      {
        routeName: 'knativeSubscriptionDetails',
        params: { namespace: 'orders', name: 'orders-to-display' },
        activeCluster: 'cluster-a',
      },
    ]);
  });

  it('shows the UID of a subscriber whose Subscription it cannot find', () => {
    const { container } = render(
      <ChannelSubscribers channel={channel([{ uid: 'uid-2', ready: 'False', message: 'gone' }])} />
    );

    expect(container.textContent).toContain('uid-2');
    expect(container.textContent).toContain('Not Ready');
    expect(container.textContent).toContain('gone');
    expect(links).toEqual([]);
  });

  it('says so when the Subscriptions cannot be loaded, and shows the UIDs', () => {
    subscriptions.error = new Error('forbidden');
    subscriptions.items = [];
    const { container } = render(
      <ChannelSubscribers channel={channel([{ uid: 'uid-1', ready: 'True' }])} />
    );

    expect(container.textContent).toContain(
      'Subscription names could not be loaded, so subscribers are shown by UID.'
    );
    expect(container.textContent).toContain('uid-1');
    expect(links).toEqual([]);
  });

  it('does not say the Subscriptions could not be loaded when they could', () => {
    const { container } = render(
      <ChannelSubscribers channel={channel([{ uid: 'uid-1', ready: 'True' }])} />
    );

    expect(container.textContent).not.toContain('could not be loaded');
  });

  it('says when the Channel reports no subscribers, without listing Subscriptions', () => {
    const { container } = render(<ChannelSubscribers channel={channel([])} />);

    expect(container.textContent).toBe('This channel reports no subscribers.');
    expect(subscriptions.lists).toBe(0);
  });
});
