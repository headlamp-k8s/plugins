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

import type { ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { render } from '@testing-library/react';
import type React from 'react';
import { vi } from 'vitest';
import type { Destination } from '../../resources/knative/common';
import type { OwnerLink } from './OwnerLink';

const ownerLinks = vi.hoisted(() => [] as React.ComponentProps<typeof OwnerLink>[]);

vi.mock('./OwnerLink', () => ({
  OwnerLink: (props: (typeof ownerLinks)[number]) => {
    ownerLinks.push(props);
    return null;
  },
}));

import { destinationColumn, DestinationLink } from './DestinationLink';

describe('DestinationLink', () => {
  beforeEach(() => {
    ownerLinks.length = 0;
  });

  it('links a complete reference in its own namespace', () => {
    render(
      <DestinationLink
        destination={{
          ref: { apiVersion: 'v1', kind: 'Service', name: 'display', namespace: 'shared' },
          uri: '/events',
        }}
        namespace="orders"
        cluster="cluster-a"
      />
    );

    expect(ownerLinks).toEqual([
      {
        owner: { apiVersion: 'v1', kind: 'Service', name: 'display' },
        namespace: 'shared',
        cluster: 'cluster-a',
        label: 'Service/display (/events)',
      },
    ]);
  });

  it('links a reference without a namespace in the namespace of the resource that names it', () => {
    render(
      <DestinationLink
        destination={{ ref: { apiVersion: 'v1', kind: 'Service', name: 'display' } }}
        namespace="orders"
      />
    );

    expect(ownerLinks[0]?.namespace).toBe('orders');
  });

  it('shows text for a URI, an incomplete reference, or no destination', () => {
    const { container, rerender } = render(
      <DestinationLink destination={{ uri: 'https://example.com/events' }} namespace="orders" />
    );
    expect(container.textContent).toBe('https://example.com/events');

    rerender(<DestinationLink destination={{ ref: { kind: 'Service', name: 'display' } }} />);
    expect(container.textContent).toBe('Service/display');

    rerender(<DestinationLink />);
    expect(container.textContent).toBe('-');
    expect(ownerLinks).toEqual([]);
  });
});

/** A list row with a destination, standing in for a Subscription or Trigger. */
type Row = KubeObject & { destination?: Destination };

/**
 * Builds a row in namespace `orders` of `cluster-a` that names the given destination.
 *
 * @param destination - The destination the row names.
 * @returns The row.
 */
function row(destination?: Destination) {
  return { destination, metadata: { namespace: 'orders' }, cluster: 'cluster-a' } as Row;
}

/**
 * Reads the functions that sort, filter and render the cells of a column.
 *
 * @param column - The column built by `destinationColumn`.
 * @returns The column's `getValue` and `render`.
 */
function cellsOf(column: ResourceTableColumn<Row>) {
  if (!('getValue' in column) || !column.getValue || !column.render) {
    throw new Error('The column has no getValue and render.');
  }
  return { getValue: column.getValue, render: column.render };
}

describe('destinationColumn', () => {
  const column = destinationColumn<Row>('subscriber', 'Subscriber', item => item.destination);

  it('names the column', () => {
    expect(column).toMatchObject({ id: 'subscriber', label: 'Subscriber' });
  });

  it.each([
    [undefined, ''],
    [{ uri: 'https://example.com/events' }, 'https://example.com/events'],
    [{ ref: { kind: 'Service', name: 'display' } }, 'Service/display'],
    [{ ref: { kind: 'Service', name: 'display' }, uri: '/events' }, 'Service/display (/events)'],
  ])('sorts and filters %j by %j', (destination, text) => {
    expect(cellsOf(column).getValue(row(destination))).toBe(text);
  });

  it('links the destination from the namespace and cluster of the row', () => {
    const destination = { ref: { apiVersion: 'v1', kind: 'Service', name: 'display' } };
    render(<>{cellsOf(column).render(row(destination))}</>);

    expect(ownerLinks).toEqual([
      {
        owner: destination.ref,
        namespace: 'orders',
        cluster: 'cluster-a',
        label: 'Service/display',
      },
    ]);
  });
});
