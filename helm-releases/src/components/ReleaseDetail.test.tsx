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

import { fireEvent, render, screen, within } from '@testing-library/react';
import { useId } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  listRevisions: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {},
  K8s: { useCluster: () => 'main' },
  Router: { createRouteURL: () => '/c/main/helm-releases' },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  // Like Headlamp, wraps a text title in a header and renders any other title as it is.
  SectionBox: (props: {
    title: React.ReactNode;
    backLink?: unknown;
    children: React.ReactNode;
  }) => {
    const titleId = useId();
    return (
      <section aria-labelledby={titleId} data-back-link={String(props.backLink)}>
        <div id={titleId}>
          {typeof props.title === 'string' ? <h2>{props.title}</h2> : props.title}
        </div>
        {props.children}
      </section>
    );
  },
  SectionHeader: (props: { title: React.ReactNode }) => <h2>{props.title}</h2>,
  NameValueTable: (props: { rows: { name: string; value: React.ReactNode; hide?: boolean }[] }) => (
    <dl>
      {props.rows
        .filter(row => !row.hide)
        .map(row => (
          <div key={row.name}>
            <dt>{row.name}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
    </dl>
  ),
  Loader: (props: { title: string }) => <p>{props.title}</p>,
  StatusLabel: (props: { status: string; children: React.ReactNode }) => (
    <span data-status={props.status}>{props.children}</span>
  ),
  DateLabel: (props: { date: string }) => <time>{props.date}</time>,
}));

vi.mock('../helm/releaseStore', async importOriginal => ({
  ...(await importOriginal<typeof import('../helm/releaseStore')>()),
  listRevisions: testState.listRevisions,
}));

import { MASK } from '../helm/masking';
import { HelmRevision, parseRevision } from '../helm/release';
import { HelmAccessError } from '../helm/releaseStore';
import { registerEmbeddedIcons } from '../icons';
import { rawRelease, ReleaseFixture } from '../test/fixtures';
import { ReleaseDetail } from './ReleaseDetail';

// Iconify would otherwise ask its API for the icons.
registerEmbeddedIcons();

function revision(fixture: ReleaseFixture): HelmRevision {
  return parseRevision(rawRelease(fixture), { namespace: 'team-a' })!;
}

const SECRET_MANIFEST = [
  '# Source: web/templates/secret.yaml',
  'apiVersion: v1',
  'kind: Secret',
  'metadata:',
  '  name: web-auth',
  'stringData:',
  '  password: hunter2',
  '',
].join('\n');

const history = [
  revision({
    revision: 2,
    status: 'deployed',
    chartVersion: '1.3.0',
    userValues: { replicaCount: 3, auth: { password: 'hunter2' } },
    manifest: SECRET_MANIFEST,
  }),
  revision({
    revision: 1,
    status: 'superseded',
    userValues: { replicaCount: 2, auth: { password: 'old-secret' } },
  }),
];

function renderDetail(url: string = '/c/main/helm-releases/team-a/web') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Route path="/c/:cluster/helm-releases/:namespace/:name">
        <ReleaseDetail />
      </Route>
    </MemoryRouter>
  );
}

function valuesBlock(name: string) {
  return screen.getByRole('region', { name }).textContent;
}

describe('ReleaseDetail', () => {
  beforeEach(() => {
    testState.listRevisions.mockReset();
    testState.listRevisions.mockResolvedValue({ revisions: history, unreadable: 0 });
  });

  describe('chart icon', () => {
    async function renderTitle(icon?: string) {
      testState.listRevisions.mockResolvedValue({
        revisions: [revision({ revision: 1, icon })],
        unreadable: 0,
      });
      renderDetail();
      // The title has the same text while the release loads: wait for the release itself.
      await screen.findByRole('table', { name: 'Revision history' });
      const title = screen.getByRole('heading', { name: 'web' });
      return { title, slot: title.querySelector('[aria-hidden]')! };
    }

    it('shows the icon of the chart before the title once it is loaded', async () => {
      const icon = 'https://charts.example.org/web/logo.svg';
      const { title, slot } = await renderTitle(icon);

      const image = title.querySelector('img')!;
      expect(image.getAttribute('src')).toBe(icon);
      // Until then the icon takes no room: the title is not pushed aside by an empty slot.
      expect(image.style.opacity).toBe('0');
      expect(getComputedStyle(slot).width).toBe('0px');

      fireEvent.load(image);

      expect(title.querySelector('img')!.style.opacity).toBe('1');
      expect(getComputedStyle(slot).width).toBe('40px');
      expect(title.textContent).toBe('web');
      // The icon stands by the title only, not in the properties of the release.
      expect(document.querySelectorAll('img')).toHaveLength(1);
    });

    it('leaves the title alone when the icon cannot be loaded', async () => {
      const { title, slot } = await renderTitle('https://charts.example.org/web/logo.svg');

      fireEvent.error(title.querySelector('img')!);

      expect(document.querySelector('img')).toBeNull();
      expect(getComputedStyle(slot).width).toBe('0px');
      expect(screen.getByRole('heading', { name: 'web' })).toBeTruthy();
    });

    it('leaves the title alone for a chart that declares no icon', async () => {
      const { slot } = await renderTitle();

      expect(document.querySelector('img')).toBeNull();
      expect(getComputedStyle(slot).width).toBe('0px');
    });
  });

  it('shows the current state of the release and its history', async () => {
    renderDetail();

    const summary = within(await screen.findByRole('region', { name: 'web' }));
    expect(summary.getByText('team-a')).toBeTruthy();
    expect(summary.getByText('web-1.3.0')).toBeTruthy();
    expect(summary.getByText('deployed').getAttribute('data-status')).toBe('success');
    expect(screen.getByRole('region', { name: 'web' }).getAttribute('data-back-link')).toBe(
      '/c/main/helm-releases'
    );

    const rows = within(screen.getByRole('table', { name: 'Revision history' })).getAllByRole(
      'row'
    );
    expect(rows.slice(1).map(row => row.textContent)).toEqual([
      '22026-11-17T10:38:29.273Zdeployedweb-1.3.04.5.6Upgrade complete',
      '12026-11-17T10:38:29.273Zsupersededweb-1.2.34.5.6Install complete',
    ]);
    expect(testState.listRevisions).toHaveBeenCalledWith(
      expect.anything(),
      'main',
      'team-a',
      'web'
    );
  });

  it('opens on the user values of the current revision, sensitive values hidden', async () => {
    renderDetail();

    await screen.findByRole('region', { name: 'Revision 2' });
    const values = valuesBlock('User-supplied values');
    expect(values).toContain('replicaCount: 3');
    expect(values).toContain(`password: "${MASK}"`);
    expect(values).not.toContain('hunter2');
    expect(screen.getByText(/1 sensitive value hidden\./)).toBeTruthy();
  });

  it('reveals the sensitive values on request', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show sensitive values' }));

    expect(valuesBlock('User-supplied values')).toContain('password: hunter2');
    expect(screen.queryByText(/sensitive value hidden/)).toBeNull();
  });

  it('shows the chart defaults and the computed values in their own tabs', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    fireEvent.click(screen.getByRole('tab', { name: 'Chart default values' }));
    expect(valuesBlock('Chart default values')).toBe('image:\n  tag: stable\nreplicaCount: 1\n');

    fireEvent.click(screen.getByRole('tab', { name: 'Computed values' }));
    expect(valuesBlock('Computed values')).toBe(
      `auth:\n  password: "${MASK}"\nimage:\n  tag: stable\nreplicaCount: 3\n`
    );
  });

  it('explores another revision of the history', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    fireEvent.click(screen.getByRole('radio', { name: 'Explore revision 1' }));

    expect(screen.getByRole('region', { name: 'Revision 1' })).toBeTruthy();
    expect(valuesBlock('User-supplied values')).toContain('replicaCount: 2');
  });

  it('keeps the notes, the manifest and the comparison folded until asked for', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    expect(screen.queryByText('Thank you for installing web.')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Rendered manifest' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Values comparison' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Release notes' }));

    expect(screen.getByRole('region', { name: 'Release notes' }).textContent).toBe(
      'Thank you for installing web.'
    );
  });

  it('compares the values with the previous revision', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    fireEvent.click(screen.getByRole('button', { name: 'Compare values with another revision' }));

    const comparison = screen.getByRole('region', { name: 'Values comparison' });
    expect(
      [...comparison.querySelectorAll('[data-diff]')].map(
        line => `${line.getAttribute('data-diff')}:${line.textContent}`
      )
    ).toEqual([
      'same:  auth:',
      `same:    password: "${MASK}"`,
      'removed:- replicaCount: 2',
      'added:+ replicaCount: 3',
    ]);
    expect(screen.getByText(/Changes from revision 1 to revision 2\./)).toBeTruthy();
    expect((screen.getByLabelText('Compare with') as HTMLSelectElement).value).toBe('1');
  });

  it('hides the secrets of the rendered manifest until they are revealed', async () => {
    renderDetail();
    await screen.findByRole('region', { name: 'Revision 2' });

    fireEvent.click(screen.getByRole('button', { name: 'Rendered manifest' }));

    const masked = await screen.findByRole('region', { name: 'Rendered manifest' });
    expect(masked.textContent).toContain('# Source: web/templates/secret.yaml');
    expect(masked.textContent).toContain(`password: "${MASK}"`);
    expect(masked.textContent).not.toContain('hunter2');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show sensitive values' }));

    expect(screen.getByRole('region', { name: 'Rendered manifest' }).textContent).toBe(
      SECRET_MANIFEST
    );
  });

  it('explains a namespace the user cannot read, without offering a retry', async () => {
    testState.listRevisions.mockRejectedValue(new HelmAccessError('forbidden'));

    renderDetail();

    expect((await screen.findByRole('alert')).textContent).toBe(
      'You do not have access to the Helm releases of the namespace team-a.'
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('tells when the release does not exist', async () => {
    testState.listRevisions.mockResolvedValue({ revisions: [], unreadable: 0 });

    renderDetail('/c/main/helm-releases/team-a/missing');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No Helm release named missing was found in the namespace team-a.'
    );
  });

  it('shows a bounded message on failure, then loads again on retry', async () => {
    testState.listRevisions.mockRejectedValueOnce(
      Object.assign(new Error('Gateway Timeout - upstream 10.0.0.1 leaked'), { status: 504 })
    );

    renderDetail();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'The release could not be loaded. The cluster did not answer in time.'
    );
    expect(alert.textContent).not.toContain('leaked');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('region', { name: 'Revision 2' })).toBeTruthy();
  });
});
