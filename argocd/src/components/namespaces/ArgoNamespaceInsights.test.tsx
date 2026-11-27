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

import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArgoApplication, type ArgoApplicationSpec } from '../../resources/application';
import ArgoNamespaceInsights from './ArgoNamespaceInsights';

const { useList } = vi.hoisted(() => ({ useList: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    cluster: {
      KubeObject: class {
        static useList = useList;
        jsonData: any;
        metadata: any;

        constructor(jsonData: any) {
          this.jsonData = jsonData;
          this.metadata = jsonData.metadata;
        }
      },
    },
  },
}));

vi.mock('@iconify/react', () => ({ Icon: () => null }));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  StatusLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  SimpleTable: ({
    data,
    columns,
  }: {
    data: ArgoApplication[];
    columns: { label: string; getter: (app: ArgoApplication) => ReactNode }[];
  }) => (
    <table>
      <tbody>
        {data.map(app => (
          <tr key={`${app.metadata.namespace}/${app.metadata.name}`}>
            {columns.map(column => (
              <td key={column.label}>{column.getter(app)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

function application(
  name: string,
  destination: ArgoApplicationSpec['destination'],
  namespace = 'argocd'
) {
  return new ArgoApplication({
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      name,
      namespace,
      uid: name,
      creationTimestamp: '2025-01-01T00:00:00Z',
    },
    spec: { project: 'default', destination },
    status: { sync: { status: 'Synced' }, health: { status: 'Healthy' } },
  });
}

function showNamespace(apps: ArgoApplication[], namespace = 'team-a') {
  useList.mockReturnValue([apps, null]);
  render(<ArgoNamespaceInsights resource={{ kind: 'Namespace', metadata: { name: namespace } }} />);
}

function expectCount(title: string, count: number) {
  const card = screen.getByText(title).parentElement!;
  expect(within(card).getByRole('heading', { name: String(count) })).toBeTruthy();
}

afterEach(cleanup);

describe('ArgoNamespaceInsights destination matching', () => {
  it.each([{ server: 'https://kubernetes.default.svc' }, { name: 'in-cluster' }])(
    'includes an explicit local destination %j',
    destination => {
      showNamespace([application('local-app', { ...destination, namespace: 'team-a' })]);

      expect(screen.getByRole('table').textContent).toContain('local-app');
      expect(screen.getByRole('table').textContent).toContain('Deploys here');
      expectCount('Stored Here', 0);
      expectCount('Deploying Here', 1);
    }
  );

  it.each([
    { server: 'https://remote.example.com' },
    { name: 'remote-cluster' },
    {},
    { name: 'in-cluster', server: 'https://remote.example.com' },
    { name: 'remote-cluster', server: 'https://kubernetes.default.svc' },
  ])('excludes an unverified or remote destination %j', destination => {
    showNamespace([application('remote-app', { ...destination, namespace: 'team-a' })]);

    expect(screen.queryByRole('table')).toBeNull();
    expect(
      screen.getByText('No Argo CD Applications are stored in or targeting this namespace.')
    ).toBeTruthy();
  });

  it('keeps remote Applications stored here without counting them as deploying here', () => {
    showNamespace([
      application('remote-app', { name: 'remote-cluster', namespace: 'team-a' }, 'team-a'),
    ]);

    expect(screen.getByRole('table').textContent).toContain('remote-app');
    expect(screen.getByRole('table').textContent).toContain('Stored here');
    expect(screen.queryByText('Stored and deploys here')).toBeNull();
    expectCount('Stored Here', 1);
    expectCount('Deploying Here', 0);
  });

  it('keeps Applications stored here when the destination namespace is missing', () => {
    showNamespace([application('stored-app', {}, 'team-a')]);

    expect(screen.getByRole('table').textContent).toContain('stored-app');
    expect(screen.getByRole('table').textContent).toContain('Stored here');
    expectCount('Stored Here', 1);
    expectCount('Deploying Here', 0);
  });

  it('counts a local Application stored here once in the table and in both summaries', () => {
    showNamespace([
      application('local-app', { name: 'in-cluster', namespace: 'team-a' }, 'team-a'),
    ]);

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getByText('Stored and deploys here')).toBeTruthy();
    expectCount('Stored Here', 1);
    expectCount('Deploying Here', 1);
  });

  it.each([undefined, ''])('does not infer default for destination namespace %j', namespace => {
    showNamespace([application('unspecified-app', { name: 'in-cluster', namespace })], 'default');

    expect(screen.queryByRole('table')).toBeNull();
    expect(
      screen.getByText('No Argo CD Applications are stored in or targeting this namespace.')
    ).toBeTruthy();
  });

  it('counts an explicit local destination in the default namespace', () => {
    showNamespace(
      [application('default-app', { name: 'in-cluster', namespace: 'default' })],
      'default'
    );

    expect(screen.getByRole('table').textContent).toContain('default-app');
    expect(screen.getByRole('table').textContent).toContain('Deploys here');
    expectCount('Stored Here', 0);
    expectCount('Deploying Here', 1);
  });

  it('shows the loading state while Applications have not loaded', () => {
    useList.mockReturnValue([null, null]);
    render(
      <ArgoNamespaceInsights resource={{ kind: 'Namespace', metadata: { name: 'team-a' } }} />
    );

    expect(screen.getByText('Loading Argo CD Applications...')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows the error state when Applications fail to load', () => {
    useList.mockReturnValue([null, new Error('request failed')]);
    render(
      <ArgoNamespaceInsights resource={{ kind: 'Namespace', metadata: { name: 'team-a' } }} />
    );

    expect(
      screen.getByText('Unable to load Argo CD Applications for this namespace.')
    ).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('excludes unrelated Applications from the table and attention count', () => {
    const remote = application('remote-app', { name: 'remote-cluster', namespace: 'team-a' });
    remote.jsonData.status = { sync: { status: 'OutOfSync' }, health: { status: 'Degraded' } };
    showNamespace([
      remote,
      application('local-app', { name: 'in-cluster', namespace: 'team-a' }),
      application('other-namespace', { name: 'in-cluster', namespace: 'team-b' }),
    ]);

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getByRole('table').textContent).toContain('local-app');
    expectCount('Deploying Here', 1);
    expectCount('All Healthy', 0);
  });
});
