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

/** One row of the page's details, as the test reads it. */
type InfoRow = {
  /** The row's heading. */
  name: string;
  /** The row's content. */
  value: React.ReactNode;
};

/** The props of the Subscription page's `EventingResourceDetail` that the test records. */
type DetailProps = {
  /** Builds the rows shown below the metadata, for the loaded Subscription. */
  extraInfo?: (subscription: unknown) => InfoRow[];
};

const detail = vi.hoisted(() => ({} as DetailProps));
const destinations = vi.hoisted(() => [] as unknown[]);

vi.mock('../../resources/knative', () => ({ KnativeSubscription: {} }));

vi.mock('../common/DestinationLink', () => ({
  DestinationLink: (props: unknown) => {
    destinations.push(props);
    return null;
  },
}));

vi.mock('../common/EventingResourceDetail', () => ({
  EventingResourceDetail: (props: DetailProps) => {
    detail.extraInfo = props.extraInfo;
    return null;
  },
}));

vi.mock('../common/ResourceListCells', () => ({
  TextValue: ({ value }: { value?: string }) => value ?? '-',
}));

import { SubscriptionDetail } from './Detail';

/**
 * Renders the content of a row.
 *
 * @param row - The row to render.
 * @returns The text the row shows.
 */
function textOf(row: InfoRow) {
  return render(<>{row.value}</>).container.textContent;
}

describe('SubscriptionDetail', () => {
  beforeEach(() => {
    destinations.length = 0;
  });

  it('shows the Channel, subscriber, reply and the endpoints Knative resolved', () => {
    const channel = { apiVersion: 'messaging.knative.dev/v1', kind: 'Channel', name: 'orders' };
    const subscriber = { ref: { apiVersion: 'v1', kind: 'Service', name: 'event-display' } };
    const reply = { uri: 'https://example.com/replies' };
    render(<SubscriptionDetail />);

    const rows =
      detail.extraInfo?.({
        cluster: 'cluster-a',
        getNamespace: () => 'orders',
        spec: { channel, subscriber, reply },
        status: {
          physicalSubscription: {
            subscriberUri: 'http://event-display.orders.svc.cluster.local',
            replyUri: 'https://example.com/replies',
            deadLetterSinkUri: 'http://dead-letters.orders.svc.cluster.local',
          },
        },
      }) ?? [];

    expect(rows.map(row => row.name)).toEqual([
      'Channel',
      'Subscriber',
      'Reply',
      'Subscriber URI',
      'Reply URI',
      'Dead Letter Sink URI',
    ]);
    expect(rows.map(textOf).slice(3)).toEqual([
      'http://event-display.orders.svc.cluster.local',
      'https://example.com/replies',
      'http://dead-letters.orders.svc.cluster.local',
    ]);
    expect(destinations).toEqual(
      [{ ref: channel }, subscriber, reply].map(destination => ({
        destination,
        namespace: 'orders',
        cluster: 'cluster-a',
      }))
    );
  });

  it('shows `-` for what the Subscription does not have yet', () => {
    render(<SubscriptionDetail />);

    const rows =
      detail.extraInfo?.({ cluster: 'cluster-a', getNamespace: () => 'orders', spec: {} }) ?? [];

    expect(rows.map(textOf).slice(3)).toEqual(['-', '-', '-']);
  });
});
