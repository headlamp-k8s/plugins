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
import type { SourceCloudEventAttributes } from '../../resources/knative/source';
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

/** A Source as the page's rows read it. */
type SourceStub = {
  /** The Source's cluster. */
  cluster: string;
  /** Gives the Source's namespace. */
  getNamespace: () => string;
  /** Where the Source sends its events. */
  sink?: unknown;
  /** The rest of the Source's spec. */
  settings?: Record<string, unknown>;
  /** The Source's status. */
  status?: {
    /** The resolved sink. */
    sinkUri?: string;
    /** The attributes of the events the Source sends. */
    ceAttributes?: SourceCloudEventAttributes[];
  };
};

/** The props of `DiscoveredKindDetail`. */
type DiscoveredProps = React.ComponentProps<typeof DiscoveredKindDetail>;

/** The props of `EventingResourceDetail` that the test records. */
type DetailProps = {
  /** The class the page loads. */
  resourceType: unknown;
  /** Builds the rows shown below the metadata. */
  extraInfo: (source: SourceStub) => InfoRow[];
  /** Builds the sections shown after the conditions. */
  extraSections: (source: SourceStub) => {
    /** Identifies the section. */
    id: string;
    /** The section. */
    section: React.ReactNode;
  }[];
};

/** A column of the stand-in `SimpleTable`. */
type Column = {
  /** The column's heading. */
  label: string;
  /** Gives the cell of one row. */
  getter: (item: SourceCloudEventAttributes) => React.ReactNode;
};

const context = vi.hoisted(() => ({
  detail: [] as DiscoveredProps[],
  pages: [] as DetailProps[],
  destinations: [] as unknown[],
  yaml: [] as { value: string; ariaLabel: string }[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  EmptyContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SectionBox: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
  SimpleTable: ({ data, columns }: { data: SourceCloudEventAttributes[]; columns: Column[] }) => (
    <table>
      <tbody>
        {data.map(item => (
          <tr key={JSON.stringify(item)}>
            {columns.map(column => (
              <td key={column.label}>{column.getter(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('../../resources/knative', () => ({
  SOURCE_FAMILY: { labelKey: 'duck.knative.dev/source' },
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

vi.mock('../common/DestinationLink', () => ({
  DestinationLink: (props: unknown) => {
    context.destinations.push(props);
    return null;
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

import { SOURCE_FAMILY } from '../../resources/knative';
import { SOURCE_DETAILS_PATH, SourceDetail } from './Detail';

const pingSourceClass = { kind: 'PingSource' };

const sink = { ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' } };

/**
 * Renders the page and returns the props it gave `DiscoveredKindDetail`.
 *
 * @returns The recorded props.
 */
function renderDetail() {
  context.detail.length = 0;
  render(<SourceDetail />);
  return context.detail[context.detail.length - 1];
}

/**
 * Renders the page for a PingSource and returns the props it gave `EventingResourceDetail`.
 *
 * @returns The recorded props.
 */
function renderPage() {
  context.pages.length = 0;
  context.destinations.length = 0;
  context.yaml.length = 0;
  const Page = renderDetail().page;
  render(<Page kindClass={pingSourceClass} />);
  return context.pages[context.pages.length - 1];
}

/**
 * Builds a PingSource as the page's rows read it.
 *
 * @param settings - The rest of the Source's spec.
 * @param ceAttributes - The attributes of the events it sends.
 * @returns The Source.
 */
function pingSource(
  settings?: Record<string, unknown>,
  ceAttributes?: NonNullable<SourceStub['status']>['ceAttributes']
): SourceStub {
  return {
    cluster: 'cluster-a',
    getNamespace: () => 'shop',
    sink,
    settings,
    status: { sinkUri: 'http://broker-ingress.knative-eventing.svc/shop/default', ceAttributes },
  };
}

describe('SourceDetail', () => {
  it('finds the kind in the Source family', () => {
    expect(renderDetail()).toMatchObject({ family: SOURCE_FAMILY, kindLabel: 'Source' });
  });

  it('loads the Source with the class of its kind', () => {
    expect(renderPage().resourceType).toBe(pingSourceClass);
  });

  it('shows the sink, the resolved sink URI and the settings of its kind', () => {
    const rows = renderPage().extraInfo(
      pingSource({ schedule: '*/1 * * * *', data: '{"message": "hi"}' })
    );
    const { container } = render(
      <>
        {rows.map(row => (
          <p key={row.name}>{row.value}</p>
        ))}
      </>
    );

    expect(rows.map(row => [row.name, row.hide])).toEqual([
      ['Sink', undefined],
      ['Sink URI', undefined],
      ['Settings', false],
    ]);
    expect([...container.querySelectorAll('p')].map(p => p.textContent)).toEqual([
      '',
      'http://broker-ingress.knative-eventing.svc/shop/default',
      '',
    ]);
    expect(context.destinations).toEqual([
      { destination: sink, namespace: 'shop', cluster: 'cluster-a' },
    ]);
    expect(context.yaml).toEqual([
      {
        value: 'schedule: "*/1 * * * *"\ndata: \'{"message": "hi"}\'\n',
        ariaLabel: 'PingSource settings YAML',
      },
    ]);
  });

  it('hides the settings when the Source has nothing but its sink', () => {
    const settings = renderPage()
      .extraInfo(pingSource())
      .find(row => row.name === 'Settings');

    expect(settings?.hide).toBe(true);
  });

  it('lists the type and source of the events it sends', () => {
    const sections = renderPage().extraSections(
      pingSource(undefined, [
        { type: 'dev.knative.sources.ping', source: '/apis/v1/namespaces/shop/pingsources/beat' },
      ])
    );
    const { container } = render(<>{sections[0].section}</>);

    expect(sections.map(section => section.id)).toEqual(['knative.source-cloudevent-attributes']);
    expect(container.querySelector('section')?.getAttribute('aria-label')).toBe(
      'CloudEvent Attributes'
    );
    expect([...container.querySelectorAll('td')].map(cell => cell.textContent)).toEqual([
      'dev.knative.sources.ping',
      '/apis/v1/namespaces/shop/pingsources/beat',
    ]);
  });

  it('says so when the Source reports no event attributes', () => {
    const { container } = render(<>{renderPage().extraSections(pingSource())[0].section}</>);

    expect(container.textContent).toBe('This Source reports no CloudEvent attributes.');
  });
});

describe('SOURCE_DETAILS_PATH', () => {
  it.each([
    ['a Source in a namespace', { namespace: 'shop', name: 'beat' }, '/knative/sources/shop/beat'],
    ['a Source of a cluster-scoped kind', { name: 'beat' }, '/knative/sources/beat'],
  ])('links to and opens %s', (_case, params, url) => {
    expect(generatePath(SOURCE_DETAILS_PATH, params)).toBe(url);
    expect(matchPath(url, { path: SOURCE_DETAILS_PATH, exact: true })?.params).toEqual(params);
  });
});
