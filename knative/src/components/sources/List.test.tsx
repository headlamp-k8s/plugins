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
import React from 'react';
import { vi } from 'vitest';

/** What a list hook returns in these tests. */
type ListResult = {
  /** The listed items, or null while loading. */
  items: unknown[] | null;
  /** The errors of the list, if any. */
  errors:
    | {
        /** What went wrong. */
        message: string;
        /** The cluster the error came from. */
        cluster?: string;
      }[]
    | null;
  /** Whether a request is still waiting for its first answer. */
  isLoading: boolean;
};

/** The props of `ResourceListView` that the tests read. */
type ListViewProps = {
  /** The rows, or null while loading. */
  data: unknown[] | null;
  /** The errors shown with the table. */
  errors?: { message: string }[] | null;
  /** What the view shows below the table. */
  children?: React.ReactNode;
  /** The table's columns: Headlamp's built-in ones by name, and the view's own. */
  columns?: (
    | string
    | {
        /** Identifies the column. */
        id?: string;
        /** The column's heading. */
        label?: string;
        /** The value the column sorts and filters by. */
        getValue?: (item: unknown) => unknown;
      }
  )[];
};

const context = vi.hoisted(() => ({
  installed: true,
  banners: [] as unknown[],
  clusters: ['cluster-a'],
  namespaces: undefined as string[] | undefined,
  crds: { items: null, errors: null, isLoading: true } as ListResult,
  sources: {} as Record<string, ListResult>,
  crdListOptions: [] as unknown[],
  sourceListOptions: [] as { kind: string; options: unknown }[],
  views: [] as ListViewProps[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: (props: ListViewProps) => {
    context.views.push(props);
    return props.children ?? null;
  },
}));

vi.mock('../../hooks/useClusters', () => ({ useClusters: () => context.clusters }));

vi.mock('../../hooks/useKnativeInstalled', () => ({
  useKnativeInstalled: () => ({
    isKnativeInstalled: context.installed,
    isKnativeCheckLoading: false,
  }),
}));

vi.mock('../common/NotInstalledBanner', () => ({
  NotInstalledBanner: (props: unknown) => {
    context.banners.push(props);
    return null;
  },
}));

vi.mock('../../hooks/useSelectedNamespaces', () => ({
  useSelectedNamespaces: () => context.namespaces,
}));

vi.mock('../../resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    useList: (options: unknown) => {
      context.crdListOptions.push(options);
      return context.crds;
    },
  },
}));

vi.mock('../../resources/knative', async () => ({
  getKnativeCrdName: (
    await vi.importActual<typeof import('../../resources/knative/customResourceLinks')>(
      '../../resources/knative/customResourceLinks'
    )
  ).getKnativeCrdName,
  SOURCE_CRD_LABEL_SELECTOR: 'duck.knative.dev/source=true',
  getKnativeSourceClass: (info: { kind: string }) => ({
    kind: info.kind,
    useList: (options: unknown): ListResult => {
      React.useRef(options);
      context.sourceListOptions.push({ kind: info.kind, options });
      const list = context.sources[info.kind] ?? { items: [], errors: null, isLoading: false };
      return {
        items: list.items && [...list.items],
        errors: list.errors && [...list.errors],
        isLoading: list.isLoading,
      };
    },
  }),
}));

vi.mock('../common/DestinationLink', () => ({
  destinationColumn: (id: string, label: string, getDestination: (item: unknown) => unknown) => ({
    id,
    label,
    getValue: getDestination,
  }),
}));

vi.mock('../common/ResourceListCells', () => ({ getReadinessColumns: () => [] }));

import { getSourceKinds, SourcesList } from './List';

/**
 * Builds a Source CRD as `CustomResourceDefinition.useList` returns it.
 *
 * @param plural - The plural name of the kind.
 * @param kind - The kind.
 * @param options - The cluster the CRD was found in and whether its version is served.
 * @returns The CRD with its cluster.
 */
function sourceCrd(
  plural: string,
  kind: string,
  {
    cluster = 'cluster-a',
    served = true,
  }: {
    /** The cluster the CRD was found in. */
    cluster?: string;
    /** Whether the CRD's version is served. */
    served?: boolean;
  } = {}
) {
  const jsonData: KubeCRD = {
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: {
      name: `${plural}.sources.knative.dev`,
      uid: plural,
      creationTimestamp: '',
    },
    spec: {
      group: 'sources.knative.dev',
      version: 'v1',
      names: { plural, singular: kind.toLowerCase(), kind, listKind: `${kind}List` },
      scope: 'Namespaced',
      versions: [{ name: 'v1', served, storage: true, additionalPrinterColumns: [] }],
    },
  };
  return { cluster, jsonData };
}

/**
 * Renders the Sources list the way Headlamp does in development, so that it runs twice.
 *
 * @returns What `render` returns.
 */
function renderSourcesList() {
  return render(
    <React.StrictMode>
      <SourcesList />
    </React.StrictMode>
  );
}

/**
 * Returns the props of the last `ResourceListView` rendered.
 *
 * @returns The props.
 */
function lastView(): ListViewProps | undefined {
  return context.views[context.views.length - 1];
}

describe('SourcesList', () => {
  beforeEach(() => {
    context.installed = true;
    context.banners.length = 0;
    context.clusters = ['cluster-a'];
    context.namespaces = undefined;
    context.crds = {
      items: [
        sourceCrd('pingsources', 'PingSource'),
        sourceCrd('apiserversources', 'ApiServerSource'),
      ],
      errors: null,
      isLoading: false,
    };
    context.sources = {
      PingSource: { items: [{ name: 'heartbeat' }], errors: null, isLoading: false },
      ApiServerSource: { items: [{ name: 'k8s-events' }], errors: null, isLoading: false },
    };
    context.crdListOptions.length = 0;
    context.sourceListOptions.length = 0;
    context.views.length = 0;
  });

  it('lists the Sources of every kind in one table', () => {
    context.namespaces = ['orders'];
    renderSourcesList();

    expect(context.crdListOptions[0]).toEqual({
      clusters: ['cluster-a'],
      labelSelector: 'duck.knative.dev/source=true',
    });
    expect(context.sourceListOptions).toContainEqual({
      kind: 'PingSource',
      options: { cluster: 'cluster-a', namespace: ['orders'] },
    });
    expect(lastView()?.data).toEqual([{ name: 'k8s-events' }, { name: 'heartbeat' }]);
    expect(lastView()?.errors).toEqual([]);
  });

  it('waits while the Source kinds are being found', () => {
    context.crds = { items: null, errors: null, isLoading: true };
    renderSourcesList();

    expect(lastView()?.data).toBeNull();
    expect(context.sourceListOptions).toEqual([]);
  });

  it('waits until every kind has been listed', () => {
    context.sources.PingSource = { items: [], errors: null, isLoading: true };
    renderSourcesList();

    expect(lastView()?.data).toBeNull();
  });

  it('shows the error of a kind it could not list and still lists the others', () => {
    context.sources.PingSource = {
      items: [],
      errors: [{ message: 'forbidden' }],
      isLoading: false,
    };
    renderSourcesList();

    expect(lastView()?.data).toEqual([{ name: 'k8s-events' }]);
    expect(lastView()?.errors).toEqual([{ message: 'forbidden' }]);
  });

  it("lists Knative's own kinds when the Source CRDs cannot be listed", () => {
    context.crds = {
      items: [],
      errors: [{ message: 'forbidden', cluster: 'cluster-a' }],
      isLoading: false,
    };
    context.sources.ContainerSource = {
      items: [],
      errors: [{ message: 'containersources is forbidden' }],
      isLoading: false,
    };
    const { container } = renderSourcesList();

    expect(container.textContent).toBe(
      "The Source CustomResourceDefinitions could not be listed, so only Knative's own kinds of " +
        'Source are shown.'
    );
    expect([...new Set(context.sourceListOptions.map(call => call.kind))].sort()).toEqual([
      'ApiServerSource',
      'ContainerSource',
      'PingSource',
      'SinkBinding',
    ]);
    expect(lastView()?.data).toEqual([{ name: 'k8s-events' }, { name: 'heartbeat' }]);
    expect(lastView()?.errors).toEqual([{ message: 'containersources is forbidden' }]);
  });

  it('names the clusters whose Source CRDs could not be listed when several are selected', () => {
    context.clusters = ['cluster-a', 'cluster-b'];
    context.crds = {
      items: [sourceCrd('pingsources', 'PingSource', { cluster: 'cluster-a' })],
      errors: [{ message: 'forbidden', cluster: 'cluster-b' }],
      isLoading: false,
    };
    const { container } = renderSourcesList();

    expect(container.textContent).toBe(
      'The Source CustomResourceDefinitions could not be listed in cluster-b, so only ' +
        "Knative's own kinds of Source are shown."
    );
  });

  it('shows no note when the Source CRDs are listed', () => {
    const { container } = renderSourcesList();

    expect(container.textContent).toBe('');
  });

  it('lists a kind whose CRD appears after the first render', () => {
    const { rerender } = renderSourcesList();
    context.crds = {
      items: [...(context.crds.items ?? []), sourceCrd('sinkbindings', 'SinkBinding')],
      errors: null,
      isLoading: false,
    };
    context.sources.SinkBinding = { items: [{ name: 'bind' }], errors: null, isLoading: false };
    rerender(
      <React.StrictMode>
        <SourcesList />
      </React.StrictMode>
    );

    expect(lastView()?.data).toEqual([
      { name: 'k8s-events' },
      { name: 'heartbeat' },
      { name: 'bind' },
    ]);
  });

  it('shows the banner, and lists nothing, when Knative Eventing is not installed', () => {
    context.installed = false;
    renderSourcesList();

    expect(context.banners).toContainEqual({ isLoading: false, component: 'eventing' });
    expect(context.crdListOptions).toEqual([]);
    expect(context.views).toEqual([]);
  });

  it('shows the cluster column only when more than one cluster is selected', () => {
    renderSourcesList();
    expect(lastView()?.columns).not.toContain('cluster');

    context.clusters = ['cluster-a', 'cluster-b'];
    renderSourcesList();
    expect(lastView()?.columns).toContain('cluster');
  });

  it("builds the Sink column from each Source's sink", () => {
    renderSourcesList();
    const sinkColumn = lastView()?.columns?.find(
      column => typeof column !== 'string' && column.id === 'sink'
    );
    const sink = {
      ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' },
    };
    if (!sinkColumn || typeof sinkColumn === 'string') throw new Error('No Sink column');

    expect(sinkColumn.label).toBe('Sink');
    expect(sinkColumn.getValue?.({ sink })).toBe(sink);
  });
});

describe('getSourceKinds', () => {
  it('orders the kinds by cluster and CRD name', () => {
    const kinds = getSourceKinds(
      [
        sourceCrd('pingsources', 'PingSource', { cluster: 'cluster-b' }),
        sourceCrd('sinkbindings', 'SinkBinding'),
        sourceCrd('apiserversources', 'ApiServerSource'),
      ],
      []
    );

    expect(kinds.map(kind => kind.key)).toEqual([
      'cluster-a/apiserversources.sources.knative.dev',
      'cluster-a/sinkbindings.sources.knative.dev',
      'cluster-b/pingsources.sources.knative.dev',
    ]);
    expect(kinds.map(kind => kind.cluster)).toEqual(['cluster-a', 'cluster-a', 'cluster-b']);
  });

  it('leaves out a CRD that serves no version', () => {
    const kinds = getSourceKinds(
      [
        sourceCrd('pingsources', 'PingSource'),
        sourceCrd('oldsources', 'OldSource', { served: false }),
      ],
      []
    );

    expect(kinds.map(kind => kind.key)).toEqual(['cluster-a/pingsources.sources.knative.dev']);
  });

  it("adds Knative's own kinds in a cluster whose Source CRDs could not be listed", () => {
    const kinds = getSourceKinds([sourceCrd('pingsources', 'PingSource')], ['cluster-b']);

    expect(kinds.map(kind => kind.key)).toEqual([
      'cluster-a/pingsources.sources.knative.dev',
      'cluster-b/apiserversources.sources.knative.dev',
      'cluster-b/containersources.sources.knative.dev',
      'cluster-b/pingsources.sources.knative.dev',
      'cluster-b/sinkbindings.sources.knative.dev',
    ]);
  });
});
