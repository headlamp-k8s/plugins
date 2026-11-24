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
import { vi } from 'vitest';
import type { DiscoveredKindsList } from '../common/DiscoveredKindsList';

/** The props of `DiscoveredKindsList`. */
type ListProps = React.ComponentProps<typeof DiscoveredKindsList>;

const lists = vi.hoisted(() => [] as ListProps[]);

vi.mock('../common/DiscoveredKindsList', () => ({
  DiscoveredKindsList: (props: ListProps) => {
    lists.push(props);
    return null;
  },
}));

vi.mock('../../resources/knative', () => ({
  CHANNEL_IMPLEMENTATION_FAMILY: { labelKey: 'messaging.knative.dev/subscribable' },
}));

vi.mock('../common/OwnerLink', () => ({ ownerColumn: () => ({ id: 'owner', label: 'Owner' }) }));

vi.mock('../common/ResourceListCells', () => ({ getReadinessColumns: () => [] }));

import { CHANNEL_IMPLEMENTATION_FAMILY } from '../../resources/knative';
import { ChannelImplementationsList } from './List';

/**
 * Renders the list and returns the props it gave `DiscoveredKindsList`.
 *
 * @returns The props.
 */
function listProps(): ListProps {
  lists.length = 0;
  render(<ChannelImplementationsList />);
  return lists[0];
}

describe('ChannelImplementationsList', () => {
  it('lists the channel implementation family', () => {
    const props = listProps();

    expect(props.family).toBe(CHANNEL_IMPLEMENTATION_FAMILY);
    expect(props.kindLabel).toBe('channel');
  });

  it('shows the kind, address, Subscriptions and owner, and the cluster when needed', () => {
    const { columns } = listProps();
    const ids = (showClusterColumn: boolean) =>
      columns(showClusterColumn).map(column => (typeof column === 'string' ? column : column.id));

    expect(ids(false)).toEqual([
      'name',
      'namespace',
      'kind',
      'address',
      'subscribers',
      'owner',
      'age',
    ]);
    expect(ids(true)).toContain('cluster');
  });
});
