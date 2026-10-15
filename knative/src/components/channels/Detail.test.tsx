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

const links = vi.hoisted(() => [] as LinkProps[]);
const subscriptions = vi.hoisted(() => ({
  items: [] as Array<{ metadata: { uid: string }; getName: () => string }>,
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
      return [subscriptions.items, null];
    },
  },
}));

vi.mock('../common/DestinationLink', () => ({ DestinationLink: () => null }));

vi.mock('../common/EventingResourceDetail', () => ({ EventingResourceDetail: () => null }));

import { ChannelSubscribers } from './Detail';

/**
 * Builds a Channel in namespace `orders` of `cluster-a` with the given subscriber states.
 *
 * @param subscribers - The subscriber states the Channel reports.
 * @returns The Channel.
 */
function channel(subscribers: Array<{ uid?: string; ready?: string; message?: string }>) {
  return {
    cluster: 'cluster-a',
    getNamespace: () => 'orders',
    status: { subscribers },
  } as unknown as KnativeChannel;
}

describe('ChannelSubscribers', () => {
  beforeEach(() => {
    links.length = 0;
    subscriptions.lists = 0;
    subscriptions.items = [{ metadata: { uid: 'uid-1' }, getName: () => 'orders-to-display' }];
  });

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

  it('says when the Channel reports no subscribers, without listing Subscriptions', () => {
    const { container } = render(<ChannelSubscribers channel={channel([])} />);

    expect(container.textContent).toBe('This Channel reports no subscribers.');
    expect(subscriptions.lists).toBe(0);
  });
});
