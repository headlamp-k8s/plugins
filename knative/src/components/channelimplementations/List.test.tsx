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
import { vi } from 'vitest';
import type { DiscoveredKindsColumns } from '../common/DiscoveredKindsList';

/** The props of `DiscoveredKindsList` that the test reads. */
type ListProps = {
  /** The label that marks the CRDs of the kinds to list. */
  labelSelector: string;
  /** Names of labelled CRDs to leave out. */
  excludedCrds?: string[];
  /** Knative's own kinds, listed where the CRDs cannot be listed. */
  fallbackKinds: { kind: string }[];
  /** Gives the class that lists one kind. */
  getKindClass: unknown;
  /** What the kinds are called in the note. */
  kindLabel: string;
  /** Builds the columns. */
  columns: (showClusterColumn: boolean) => DiscoveredKindsColumns<never>;
};

const lists = vi.hoisted(() => [] as ListProps[]);

vi.mock('../common/DiscoveredKindsList', () => ({
  DiscoveredKindsList: (props: ListProps) => {
    lists.push(props);
    return null;
  },
}));

vi.mock('../../resources/knative', () => ({
  CHANNEL_CRD_LABEL_SELECTOR: 'messaging.knative.dev/subscribable=true',
  GENERIC_CHANNEL_CRD_NAME: 'channels.messaging.knative.dev',
  getKnativeChannelImplementationClass: vi.fn(),
}));

vi.mock('../common/OwnerLink', () => ({ ownerColumn: () => ({ id: 'owner', label: 'Owner' }) }));

vi.mock('../common/ResourceListCells', () => ({ getReadinessColumns: () => [] }));

import { getKnativeChannelImplementationClass } from '../../resources/knative';
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
  it('finds every channel kind by its label, but not the generic Channel', () => {
    const props = listProps();

    expect(props.labelSelector).toBe('messaging.knative.dev/subscribable=true');
    expect(props.excludedCrds).toEqual(['channels.messaging.knative.dev']);
    expect(props.getKindClass).toBe(getKnativeChannelImplementationClass);
    expect(props.kindLabel).toBe('channel');
  });

  it("lists Knative's own InMemoryChannel where the CRDs cannot be listed", () => {
    expect(listProps().fallbackKinds.map(kind => kind.kind)).toEqual(['InMemoryChannel']);
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
