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

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;
type Column = {
  id: string;
  accessorFn: (row: Row) => unknown;
  Cell?: (cell: { row: { original: Row } }) => React.ReactNode;
};

const testState = vi.hoisted(() => ({
  selectedNamespaces: new Set<string>(),
  allowedNamespaces: [] as string[],
  listReleases: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {},
  K8s: {
    useCluster: () => 'main',
    cluster: { getAllowedNamespaces: () => testState.allowedNamespaces },
  },
  Router: { createRouteURL: () => '/c/main/helm-releases' },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: (props: { title: React.ReactNode; children: React.ReactNode }) => (
    <section>
      {props.title}
      {props.children}
    </section>
  ),
  SectionFilterHeader: (props: { title: string; actions: React.ReactNode[] }) => (
    <header>
      <h1>{props.title}</h1>
      {props.actions}
    </header>
  ),
  Table: (props: { columns: Column[]; data: Row[]; loading: boolean; emptyMessage: string }) => {
    if (props.loading) return <p>Loading</p>;
    if (props.data.length === 0) return <p>{props.emptyMessage}</p>;
    return (
      <table>
        <tbody>
          {props.data.map((row, index) => (
            <tr key={index}>
              {props.columns.map(column => (
                <td key={column.id}>
                  {column.Cell
                    ? column.Cell({ row: { original: row } })
                    : `${column.accessorFn(row)}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
  Link: (props: { routeName: string; params: Row; children: React.ReactNode }) => (
    <a href={`/${props.routeName}/${props.params.namespace}/${props.params.name}`}>
      {props.children}
    </a>
  ),
  StatusLabel: (props: { status: string; children: React.ReactNode }) => (
    <span data-status={props.status}>{props.children}</span>
  ),
  DateLabel: (props: { date: string }) => <time>{props.date}</time>,
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ filter: { namespaces: testState.selectedNamespaces } }),
}));

vi.mock('../helm/releaseStore', async importOriginal => ({
  ...(await importOriginal<typeof import('../helm/releaseStore')>()),
  listReleases: testState.listReleases,
}));

import { HelmAccessError, ReleaseListResult } from '../helm/releaseStore';
import { registerEmbeddedIcons } from '../icons';
import { ReleaseList } from './ReleaseList';

// Iconify would otherwise ask its API for the icons.
registerEmbeddedIcons();

function listResult(overrides: Partial<ReleaseListResult> = {}): ReleaseListResult {
  return {
    releases: [],
    clusterWideDenied: false,
    deniedNamespaces: [],
    failedNamespaces: [],
    unreadable: 0,
    ...overrides,
  };
}

const certManager = {
  namespace: 'cert-manager',
  name: 'cert-manager',
  revision: 5,
  status: 'deployed',
  updated: '2026-11-17T10:38:29.273Z',
  chartName: 'cert-manager',
  chartVersion: 'v1.21.3',
  appVersion: 'v1.21.3',
  description: 'Upgrade complete',
};

describe('ReleaseList', () => {
  beforeEach(() => {
    testState.selectedNamespaces = new Set();
    testState.allowedNamespaces = [];
    testState.listReleases.mockReset();
  });

  it('lists the releases of the whole cluster like helm ls -A', async () => {
    testState.listReleases.mockResolvedValue(listResult({ releases: [certManager] }));

    render(<ReleaseList />);

    const link = await screen.findByRole('link', { name: 'cert-manager' });
    expect(link.getAttribute('href')).toBe('/helm-releases-detail/cert-manager/cert-manager');
    const cells = [...link.closest('tr')!.querySelectorAll('td')].map(cell => cell.textContent);
    expect(cells).toEqual([
      'cert-manager',
      'cert-manager',
      '5',
      '2026-11-17T10:38:29.273Z',
      'deployed',
      'cert-manager-v1.21.3',
      'v1.21.3',
    ]);
    expect(screen.getByText('deployed').getAttribute('data-status')).toBe('success');
    expect(testState.listReleases).toHaveBeenCalledWith(expect.anything(), 'main', []);
  });

  it('summarises the releases by status and makes what is not deployed stand out', async () => {
    const release = (name: string, status: string) => ({ ...certManager, name, status });
    testState.listReleases.mockResolvedValue(
      listResult({
        releases: [
          release('a', 'deployed'),
          release('b', 'failed'),
          release('c', 'deployed'),
          release('d', 'pending-upgrade'),
          release('e', 'failed'),
        ],
      })
    );

    render(<ReleaseList />);

    const summary = within(await screen.findByRole('list', { name: 'Releases by status' }));
    expect(summary.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      '5 releases:',
      '2 failed',
      '1 pending-upgrade',
      '2 deployed',
    ]);
    expect(summary.getByText('2 failed').getAttribute('data-status')).toBe('error');
    expect(summary.getByText('1 pending-upgrade').getAttribute('data-status')).toBe('warning');
    expect(summary.getByText('2 deployed').getAttribute('data-status')).toBe('');
  });

  it('shows no summary when there is no release to count', async () => {
    testState.listReleases.mockResolvedValue(listResult());

    render(<ReleaseList />);

    await screen.findByText('No Helm release found.');
    expect(screen.queryByRole('list', { name: 'Releases by status' })).toBeNull();
  });

  describe('chart icon', () => {
    const icon = 'https://charts.example.org/cert-manager/logo.png';

    async function renderRows() {
      testState.listReleases.mockResolvedValue(
        listResult({
          releases: [
            { ...certManager, chartIcon: icon },
            { ...certManager, name: 'no-icon' },
          ],
        })
      );
      render(<ReleaseList />);
      return {
        withIcon: (await screen.findByRole('link', { name: 'cert-manager' })).closest('tr')!,
        withoutIcon: screen.getByRole('link', { name: 'no-icon' }).closest('tr')!,
      };
    }

    function slotWidth(row: HTMLElement) {
      return getComputedStyle(row.querySelector('[aria-hidden]')!).width;
    }

    it('paints nothing until the image is loaded, then shows it', async () => {
      const { withIcon, withoutIcon } = await renderRows();

      const image = withIcon.querySelector('img')!;
      expect(image.getAttribute('src')).toBe(icon);
      expect(image.getAttribute('referrerpolicy')).toBe('no-referrer');
      // A network without Internet access can leave the request pending for minutes.
      expect(image.style.opacity).toBe('0');
      expect(withoutIcon.querySelector('img')).toBeNull();

      fireEvent.load(image);

      expect(withIcon.querySelector('img')!.style.opacity).toBe('1');
    });

    it('leaves an empty slot of the same size when the image cannot be loaded', async () => {
      const { withIcon, withoutIcon } = await renderRows();

      fireEvent.error(withIcon.querySelector('img')!);

      expect(withIcon.querySelector('img')).toBeNull();
      expect(slotWidth(withIcon)).toBe('20px');
      expect(slotWidth(withoutIcon)).toBe('20px');
      expect(screen.getByRole('link', { name: 'cert-manager' })).toBeTruthy();
    });
  });

  it('asks for namespaces when the user has no cluster-wide access', async () => {
    testState.listReleases.mockResolvedValue(listResult({ clusterWideDenied: true }));

    render(<ReleaseList />);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'You do not have cluster-wide access to Helm releases. Select your namespaces in the Namespaces filter above to list their releases.'
    );
    expect(screen.queryByText('No Helm release found.')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Releases by status' })).toBeNull();
  });

  it('reads the namespaces selected in the Headlamp filter', async () => {
    testState.selectedNamespaces = new Set(['team-b', 'team-a']);
    testState.listReleases.mockResolvedValue(
      listResult({
        releases: [{ ...certManager, namespace: 'team-a' }],
        deniedNamespaces: ['team-b'],
      })
    );

    render(<ReleaseList />);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'You do not have access to the Helm releases of: team-b.'
    );
    expect(screen.getByRole('link', { name: 'cert-manager' })).toBeTruthy();
    expect(testState.listReleases).toHaveBeenCalledWith(expect.anything(), 'main', [
      'team-a',
      'team-b',
    ]);
  });

  it('reads the allowed namespaces of the cluster settings when none is selected', async () => {
    testState.allowedNamespaces = ['team-c'];
    testState.listReleases.mockResolvedValue(listResult());

    render(<ReleaseList />);

    expect(await screen.findByText('No Helm release found.')).toBeTruthy();
    expect(testState.listReleases).toHaveBeenCalledWith(expect.anything(), 'main', ['team-c']);
  });

  it('tells what is missing from the list', async () => {
    testState.selectedNamespaces = new Set(['team-a']);
    testState.listReleases.mockResolvedValue(
      listResult({ failedNamespaces: ['team-a'], unreadable: 2 })
    );

    render(<ReleaseList />);

    await waitFor(() =>
      expect(screen.getAllByRole('alert').map(alert => alert.textContent)).toEqual([
        'The Helm releases could not be loaded from: team-a.',
        '2 release records could not be read and are not listed.',
      ])
    );
  });

  it('shows a bounded message on failure, then loads again on retry', async () => {
    testState.listReleases.mockRejectedValueOnce(
      Object.assign(new Error('Internal error - secrets "sh.helm.release.v1.web.v1" leaked'), {
        status: 503,
      })
    );
    testState.listReleases.mockResolvedValue(listResult({ releases: [certManager] }));

    render(<ReleaseList />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'The Helm releases could not be loaded. The cluster API is unavailable.'
    );
    expect(alert.textContent).not.toContain('leaked');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('link', { name: 'cert-manager' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('loads the releases again on refresh', async () => {
    testState.listReleases.mockResolvedValue(listResult({ releases: [certManager] }));

    render(<ReleaseList />);
    await screen.findByRole('link', { name: 'cert-manager' });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(testState.listReleases).toHaveBeenCalledTimes(2));
  });

  it('reports the kind of a failure classified by the store', async () => {
    testState.listReleases.mockRejectedValue(new HelmAccessError('unauthorized'));

    render(<ReleaseList />);

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The session is not authorised. Sign in again.'
    );
  });
});
