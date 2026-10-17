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
import type { OwnerLink } from './OwnerLink';

const ownerLinks = vi.hoisted(() => [] as React.ComponentProps<typeof OwnerLink>[]);

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({}));

vi.mock('./OwnerLink', () => ({
  OwnerLink: (props: (typeof ownerLinks)[number]) => {
    ownerLinks.push(props);
    return null;
  },
}));

import { DestinationLink } from './DestinationLink';

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
