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

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { Overview } from '../components/Overview';
import type { Application, Deployment, DeploymentStatus, Piped } from '../types/pipecd';
import {
  appCloudRunDeploying,
  appKubernetesSynced,
  appTerraformOutOfSync,
  deploymentCompleted,
  mockListResponse,
} from './fixtures';

// What the cluster holds for the piped label. Empty means no piped runs in it,
// which is also what a cluster that forbids listing pods looks like.
// `unlabelled` holds ConfigMaps without the chart labels, which only a lookup by
// name finds.
const cluster = vi.hoisted(() => ({
  pods: [] as unknown[],
  configMaps: [] as unknown[],
  unlabelled: [] as unknown[],
  // True while the labelled ConfigMap list has not arrived yet.
  configMapsLoading: false,
  // Each ConfigMap looked up by name, as `namespace/name`.
  gets: [] as string[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
  K8s: {
    ResourceClasses: {
      Pod: { useList: () => [cluster.pods.map(jsonData => ({ jsonData })), null] },
      ConfigMap: {
        useList: () => [
          cluster.configMapsLoading ? null : cluster.configMaps.map(jsonData => ({ jsonData })),
          null,
        ],
        useGet: (name: string, namespace: string) => {
          cluster.gets.push(`${namespace}/${name}`);
          const found = [...cluster.configMaps, ...cluster.unlabelled].find(cm => {
            const { metadata } = cm as { metadata: { name: string; namespace: string } };
            return metadata.name === name && metadata.namespace === namespace;
          });
          return [found ? { jsonData: found } : null, null];
        },
      },
    },
  },
}));

/** Puts a piped pod for `pipedId` into the mocked cluster. */
function runInCluster(pipedId: string, ready: boolean, labelled = true): void {
  const name = `piped-${cluster.pods.length}`;
  (labelled ? cluster.configMaps : cluster.unlabelled).push({
    metadata: { name, namespace: 'piped' },
    data: { 'piped-config.yaml': `kind: Piped\nspec:\n  pipedID: ${pipedId}\n` },
  });
  cluster.pods.push({
    metadata: { name: `${name}-abc12`, namespace: 'piped' },
    spec: { volumes: [{ configMap: { name } }] },
    status: ready
      ? { phase: 'Running', containerStatuses: [{ ready: true }] }
      : {
          phase: 'Running',
          containerStatuses: [{ ready: false, state: { waiting: { reason: 'CrashLoopBackOff' } } }],
        },
  });
}

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: () => null,
  getClusterPrefixedPath: (path: string) => path,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('../api/pipecd', async importOriginal => {
  const original = await importOriginal<typeof import('../api/pipecd')>();
  return {
    ...original,
    listApplications: vi.fn(),
    listDeployments: vi.fn(),
    listPipeds: vi.fn(),
    getPiped: vi.fn(),
  };
});

const HOUR = 3600;

function deployment(
  id: string,
  hoursAgo: number,
  status: DeploymentStatus,
  extra: Partial<Deployment> = {}
): Deployment {
  const createdAt = Math.floor(Date.now() / 1000) - hoursAgo * HOUR;
  return { ...deploymentCompleted, id, createdAt, updatedAt: createdAt, status, ...extra };
}

function piped(id: string, name: string, version: string, startedDaysAgo: number): Piped {
  const startedAt = startedDaysAgo ? Math.floor(Date.now() / 1000) - startedDaysAgo * 86400 : 0;
  return { id, name, version, disabled: false, startedAt, status: 'UNKNOWN' };
}

const PIPEDS: Record<string, Piped> = {
  'piped-prod-001': piped('piped-prod-001', 'prod', 'v0.52.0', 5),
  'piped-staging-001': piped('piped-staging-001', 'staging', 'v0.52.0', 5),
  'piped-gcp-001': piped('piped-gcp-001', 'gcp', 'v0.49.1', 2),
  // Registered but never started, as several pipeds in the PipeCD console are.
  'piped-old-001': piped('piped-old-001', 'old-vm', '', 0),
};

/** The same short date the chart prints, built here so any locale passes. */
function shortDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function renderOverview(): void {
  render(
    <MemoryRouter initialEntries={['/pipecd/overview']}>
      <Overview />
      {/* Shows where a click took the router. */}
      <Route render={({ location }) => <div data-testid="location">{location.pathname}</div>} />
    </MemoryRouter>
  );
}

function setupConfigured(): void {
  pipecdApi.saveConfig({ baseURL: 'https://pipecd.example.com', apiKey: 'test-key-xyz' });
}

/** Serves `enabled` for enabled applications and `disabled` for disabled ones. */
function mockApps(enabled: Application[], disabled: Application[] = []): void {
  vi.mocked(pipecdApi.listApplications).mockImplementation(async (_config, options) => ({
    applications: options?.disabled ? disabled : enabled,
    cursor: '',
  }));
}

function mockSuccess(deployments: Deployment[]): void {
  mockApps(mockListResponse.applications);
  vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments, cursor: '' });
  vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => PIPEDS[id]);
  // By default the server is one without ListPipeds.
  vi.mocked(pipecdApi.listPipeds).mockRejectedValue(
    new pipecdApi.PipeCDApiError('unknown method ListPipeds', 12, '')
  );
}

/** The outlined card or panel that contains `text`. */
function cardOf(text: string): HTMLElement {
  return screen.getByText(text).closest('.MuiPaper-root') as HTMLElement;
}

describe('Overview', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
    cluster.pods = [];
    cluster.configMaps = [];
    cluster.unlabelled = [];
    cluster.configMapsLoading = false;
    cluster.gets = [];
    // An older server, unless a test says otherwise.
    vi.mocked(pipecdApi.listPipeds).mockRejectedValue(
      new pipecdApi.PipeCDApiError('unknown method ListPipeds', 12, '')
    );
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.listApplications).mockReset();
    vi.mocked(pipecdApi.listDeployments).mockReset();
    vi.mocked(pipecdApi.listPipeds).mockReset();
    vi.mocked(pipecdApi.getPiped).mockReset();
    vi.restoreAllMocks();
  });

  it('shows NotConfigured when no API key is set', () => {
    renderOverview();

    expect(screen.getByText(/PipeCD Not Configured/i)).toBeTruthy();
    expect(pipecdApi.listApplications).not.toHaveBeenCalled();
  });

  it('shows a loading skeleton while fetching', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockImplementation(() => new Promise(() => {}));
    vi.mocked(pipecdApi.listDeployments).mockImplementation(() => new Promise(() => {}));

    renderOverview();

    expect(await screen.findByLabelText('loading-skeleton')).toBeTruthy();
  });

  it('shows the summary cards', async () => {
    setupConfigured();
    mockSuccess([
      deployment('d1', 1, 'DEPLOYMENT_SUCCESS'),
      deployment('d2', 2, 'DEPLOYMENT_SUCCESS'),
      deployment('d3', 3, 'DEPLOYMENT_SUCCESS'),
      deployment('d4', 4, 'DEPLOYMENT_FAILURE'),
    ]);

    renderOverview();

    expect(await screen.findByText('1 synced')).toBeTruthy();
    expect(cardOf('with an application or a recent deployment').textContent).toContain('3');
    expect(screen.getByText('1 out of sync')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('1 of 4 failed')).toBeTruthy();
  });

  // The time range only applies to the deployment cards, so each card says
  // which it shows.
  it('labels cards with the current state or the time range', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();
    await screen.findByText('1 synced');

    expect(cardOf('1 synced').textContent).toContain('Now');
    expect(cardOf('with an application or a recent deployment').textContent).toContain('Now');
    expect(cardOf('Deployments').textContent).toContain('Last 7 days');
    expect(cardOf('Change failure rate').textContent).toContain('Last 7 days');
  });

  it('lists each piped with its version, start time and app count', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    const gcp = [...table.querySelectorAll('tr')].find(r => r.textContent?.includes('gcp'))!;
    expect(gcp.textContent).toContain('v0.49.1');
    expect(gcp.textContent).toContain('2d ago');
    expect(pipecdApi.getPiped).toHaveBeenCalledTimes(3);
  });

  // GetPiped never fills in a piped's online status, so without ListPipeds
  // showing one would always say Unknown.
  it('does not show a piped status it cannot know', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).not.toMatch(/Unknown|Online|Offline/);
    expect(screen.queryByText(/online$/)).toBeNull();
    // An older server is expected, so it is not reported as a problem.
    expect(screen.queryByText(/could not be loaded/)).toBeNull();
  });

  describe('with ListPipeds', () => {
    function mockListed(): void {
      vi.mocked(pipecdApi.listPipeds).mockResolvedValue([
        { ...PIPEDS['piped-prod-001'], status: 'ONLINE' },
        { ...PIPEDS['piped-gcp-001'], status: 'OFFLINE' },
        // No application and no deployment, so only ListPipeds can find it.
        { ...PIPEDS['piped-old-001'], status: 'OFFLINE' },
        { ...piped('piped-gone', 'switched-off', '', 0), disabled: true },
      ]);
    }

    it('lists every enabled piped with its status', async () => {
      setupConfigured();
      mockSuccess([]);
      mockListed();

      renderOverview();

      const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
      const row = (name: string) =>
        [...table.querySelectorAll('tr')].find(r => r.textContent?.includes(name))!;
      expect(row('prod').textContent).toContain('Online');
      expect(row('old-vm').textContent).toContain('Offline');
      expect(table.textContent).not.toContain('switched-off');
      expect(cardOf('1 online').textContent).toContain('3');
      expect(screen.getByText('2 offline')).toBeTruthy();
      expect(pipecdApi.getPiped).not.toHaveBeenCalled();
    });

    // Disabled applications are only needed to find pipeds without ListPipeds.
    it('does not fetch disabled applications', async () => {
      setupConfigured();
      mockSuccess([]);
      mockListed();

      renderOverview();
      await screen.findByRole('table', { name: 'pipecd-pipeds-table' });

      expect(pipecdApi.listApplications).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ disabled: true })
      );
    });

    it('still counts the applications on each piped', async () => {
      setupConfigured();
      mockSuccess([]);
      mockListed();

      renderOverview();

      const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
      const cells = (name: string) =>
        [...table.querySelectorAll('tr')].find(r => r.textContent?.includes(name))!.cells;
      const prod = cells('prod');
      expect(Number(prod[prod.length - 1].textContent)).toBeGreaterThan(0);
      const old = cells('old-vm');
      expect(old[old.length - 1].textContent).toBe('0');
    });

    // The list is complete, so a pod that is not on it belongs elsewhere.
    it('does not look up a cluster piped that is not listed', async () => {
      setupConfigured();
      mockSuccess([]);
      mockListed();
      runInCluster('piped-elsewhere', true);

      renderOverview();

      const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
      expect(table.textContent).not.toContain('piped-elsewhere');
      expect(pipecdApi.getPiped).not.toHaveBeenCalled();
    });

    it('falls back to the known pipeds and reports any other failure', async () => {
      setupConfigured();
      mockSuccess([]);
      vi.mocked(pipecdApi.listPipeds).mockRejectedValue(new Error('server is down'));

      renderOverview();

      const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
      expect(table.textContent).toContain('prod');
      expect(pipecdApi.getPiped).toHaveBeenCalledTimes(3);
      expect(
        screen.getByText(/Some piped details could not be loaded: server is down/)
      ).toBeTruthy();
    });

    it('falls back to the known pipeds when ListPipeds hangs', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        setupConfigured();
        mockSuccess([]);
        vi.mocked(pipecdApi.listPipeds).mockReturnValue(new Promise(() => {}));

        renderOverview();
        await vi.advanceTimersByTimeAsync(31000);

        const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
        expect(table.textContent).toContain('prod');
        expect(
          screen.getByText(/Some piped details could not be loaded: The request timed out\./)
        ).toBeTruthy();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('gives up on a request that hangs and lets the user refresh', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setupConfigured();
      mockSuccess([]);
      vi.mocked(pipecdApi.listDeployments).mockReturnValue(new Promise(() => {}));

      renderOverview();
      await vi.advanceTimersByTimeAsync(31000);

      expect(await screen.findByText(/Failed to load overview/i)).toBeTruthy();
      expect(screen.getByText('The request timed out.')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Refresh/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a dash for a piped that has never started', async () => {
    setupConfigured();
    mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS', { pipedId: 'piped-old-001' })]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    const row = [...table.querySelectorAll('tr')].find(r => r.textContent?.includes('old-vm'))!;
    expect(row.textContent).toContain('—');
  });

  it('shows whether each piped runs in this cluster', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-prod-001', true);
    runInCluster('piped-gcp-001', false);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    const row = (name: string) =>
      [...table.querySelectorAll('tr')].find(r => r.textContent?.includes(name))!;
    expect(row('prod').textContent).toContain('Running');
    expect(row('gcp').textContent).toContain('Not running');
    // No pod for it here; it may run in another cluster.
    expect(row('staging').textContent).toContain('—');
    expect(screen.getByText('1 running in this cluster')).toBeTruthy();
    expect(screen.getByText('1 not running')).toBeTruthy();
  });

  // The chart can use an existing ConfigMap (config.create=false), which need not
  // carry the chart's labels.
  it('finds a piped whose ConfigMap has no labels', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-prod-001', true, false);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    const row = [...table.querySelectorAll('tr')].find(r => r.textContent?.includes('prod'))!;
    await waitFor(() => {
      expect(row.textContent).toContain('Running');
    });
    expect(screen.getByText('1 running in this cluster')).toBeTruthy();
  });

  it('does not look up ConfigMaps by name before the label search returns', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-prod-001', true);
    cluster.configMapsLoading = true;

    renderOverview();

    await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(cluster.gets).toEqual([]);
  });

  // A piped can run with no application or deployment yet; the cluster is the
  // only place that shows it exists.
  it('also lists a piped found only in the cluster', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-old-001', true);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(table.textContent).toContain('old-vm');
    });
    expect(pipecdApi.getPiped).toHaveBeenCalledWith(
      expect.anything(),
      'piped-old-001',
      expect.anything()
    );
    expect(cardOf('1 running in this cluster').textContent).toContain('4');
  });

  // A leftover piped from another project or control plane runs in the cluster,
  // but PipeCD does not know it, so it is not one of this project's pipeds.
  it('leaves out a cluster piped that PipeCD does not know', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-elsewhere') throw new Error('not found');
      return PIPEDS[id];
    });
    runInCluster('piped-elsewhere', false);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(pipecdApi.getPiped).toHaveBeenCalledWith(
        expect.anything(),
        'piped-elsewhere',
        expect.anything()
      );
    });
    expect(table.textContent).not.toContain('piped-elsewhere');
    expect(table.textContent).not.toContain('Not running');
    expect(screen.getByText('with an application or a recent deployment')).toBeTruthy();
  });

  it('keeps the plain piped summary when no piped runs in this cluster', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();

    expect(await screen.findByText('with an application or a recent deployment')).toBeTruthy();
    expect(screen.queryByText(/running in this cluster/)).toBeNull();
  });

  it('shows the dates the chart covers, and dates instead of weekdays', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();
    await screen.findByText('1 synced');

    expect(screen.getByText(`${shortDate(6)} – ${shortDate(0)}`)).toBeTruthy();
    expect(screen.getByText(shortDate(3))).toBeTruthy();
    expect(screen.queryByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)).toBeNull();
  });

  it('also lists pipeds that run only disabled applications', async () => {
    setupConfigured();
    mockSuccess([]);
    mockApps(mockListResponse.applications, [
      { ...appKubernetesSynced, id: 'app-disabled', pipedId: 'piped-old-001', disabled: true },
    ]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('old-vm');
    // Disabled applications find pipeds but are not counted as applications.
    expect(cardOf('1 synced').querySelector('h4')?.textContent).toBe('3');
  });

  it('counts only enabled applications in the Apps column', async () => {
    setupConfigured();
    mockSuccess([]);
    mockApps(mockListResponse.applications, [
      { ...appKubernetesSynced, id: 'app-disabled', disabled: true },
    ]);
    const enabled = mockListResponse.applications.filter(
      a => a.pipedId === appKubernetesSynced.pipedId
    ).length;

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    const name = PIPEDS[appKubernetesSynced.pipedId].name;
    const row = [...table.querySelectorAll('tr')].find(r => r.cells[0]?.textContent === name)!;
    expect(row.cells[row.cells.length - 1].textContent).toBe(String(enabled));
  });

  it('still loads when disabled applications cannot be listed', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.listApplications).mockImplementation(async (_config, options) => {
      if (options?.disabled) throw new Error('disabled list failed');
      return { applications: mockListResponse.applications, cursor: '' };
    });

    renderOverview();

    expect(await screen.findByText('1 synced')).toBeTruthy();
    expect(screen.queryByText(/Failed to load overview/)).toBeNull();
    expect(screen.getByText(/could not be loaded: disabled list failed/)).toBeTruthy();
  });

  // ListPipeds leaves out disabled pipeds, so the fallback must as well.
  it('leaves out a disabled piped found through GetPiped', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) =>
      id === 'piped-gcp-001' ? { ...PIPEDS[id], disabled: true } : PIPEDS[id]
    );

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('prod');
    expect(table.textContent).not.toContain('gcp');
  });

  it('keeps the old range label on the old numbers while a new range loads', async () => {
    setupConfigured();
    mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();
    await screen.findByText('1 synced');
    vi.mocked(pipecdApi.listDeployments).mockImplementation(() => new Promise(() => {}));

    fireEvent.mouseDown(screen.getByLabelText('Time range'));
    fireEvent.click(await screen.findByRole('option', { name: 'Last 30 days' }));

    await waitFor(() => expect(pipecdApi.listDeployments).toHaveBeenCalledTimes(2));
    expect(cardOf('Deployments').textContent).toContain('Last 7 days');
    expect(cardOf('Deployments').textContent).not.toContain('Last 30 days');
  });

  // After a refresh a cluster-only piped can show up in the PipeCD data too,
  // while the old cluster lookup is still shown until a new one finishes.
  it('lists a piped once when the refreshed data now includes it', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-old-001', true);
    runInCluster('piped-new', true);
    let refreshed = false;
    vi.mocked(pipecdApi.listDeployments).mockImplementation(async () => ({
      deployments: refreshed
        ? [deployment('d1', 1, 'DEPLOYMENT_SUCCESS', { pipedId: 'piped-old-001' })]
        : [],
      cursor: '',
    }));
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id !== 'piped-new') return PIPEDS[id];
      // Unknown at first, then the lookup hangs.
      if (refreshed) return new Promise<Piped>(() => {});
      throw new Error('not found');
    });

    renderOverview();
    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(table.textContent).toContain('old-vm');
    });

    refreshed = true;
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => {
      expect(
        vi.mocked(pipecdApi.getPiped).mock.calls.filter(([, id]) => id === 'piped-new')
      ).toHaveLength(2);
    });

    const shown = screen.getByRole('table', { name: 'pipecd-pipeds-table' });
    const rows = [...shown.querySelectorAll('tr')].filter(r => r.textContent?.includes('old-vm'));
    expect(rows).toHaveLength(1);
  });

  it('drops a cluster-only piped once its pod is gone', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-old-001', true);
    let moved = false;
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      // The lookup for the new pod hangs, so only the filter can drop old-vm.
      if (id === 'piped-new') return new Promise<Piped>(() => {});
      return PIPEDS[id];
    });

    renderOverview();
    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(table.textContent).toContain('old-vm');
    });

    // old-vm's pod is deleted and another piped's pod appears.
    cluster.pods = [];
    cluster.configMaps = [];
    runInCluster('piped-new', true);
    moved = true;
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => {
      expect(vi.mocked(pipecdApi.getPiped).mock.calls.some(([, id]) => id === 'piped-new')).toBe(
        moved
      );
    });

    expect(screen.getByRole('table', { name: 'pipecd-pipeds-table' }).textContent).not.toContain(
      'old-vm'
    );
  });

  it('reports a cluster piped that could not be looked up', async () => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-new', true);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-new') throw new Error('network down');
      return PIPEDS[id];
    });

    renderOverview();

    expect(await screen.findByText(/could not be loaded: network down/)).toBeTruthy();
  });

  // A wrong key, a key without access or a rate limit says nothing about the
  // piped, so it must not look like the piped is simply absent.
  it.each([
    ['Unauthenticated', 16],
    ['PermissionDenied', 7],
    ['ResourceExhausted', 8],
  ])('reports a cluster piped lookup that fails with %s', async (_name, code) => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-new', true);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-new') {
        throw new pipecdApi.PipeCDApiError('PipeCD API error calling GetPiped: denied', code, '');
      }
      return PIPEDS[id];
    });

    renderOverview();

    expect(await screen.findByText(/could not be loaded:.*denied/)).toBeTruthy();
  });

  // PipeCD answers NotFound for a deleted piped and InvalidArgument for one in
  // another project. Neither is one of this project's pipeds.
  it.each([
    ['NotFound', 5],
    ['InvalidArgument', 3],
  ])('quietly leaves out a cluster piped that fails with %s', async (_name, code) => {
    setupConfigured();
    mockSuccess([]);
    runInCluster('piped-new', true);
    // Looked up in the same batch, so once it shows the lookup has finished.
    runInCluster('piped-old-001', true);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-new') {
        throw new pipecdApi.PipeCDApiError('PipeCD API error calling GetPiped: gone', code, '');
      }
      return PIPEDS[id];
    });

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(table.textContent).toContain('old-vm');
    });
    expect(table.textContent).not.toContain('piped-new');
    expect(screen.queryByText(/could not be loaded/)).toBeNull();
  });

  // A timed-out lookup must be cancelled, or it stays open and the limit on
  // lookups at a time no longer holds.
  it('cancels a piped lookup that times out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setupConfigured();
      mockSuccess([]);
      const signals: AbortSignal[] = [];
      vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id, signal) => {
        if (id !== 'piped-prod-001') return PIPEDS[id];
        if (signal) signals.push(signal);
        return new Promise<Piped>(() => {});
      });

      renderOverview();
      await vi.advanceTimersByTimeAsync(31000);

      expect(
        await screen.findByText(/Some piped details could not be loaded: The request timed out\./)
      ).toBeTruthy();
      expect(signals).toHaveLength(1);
      expect(signals[0].aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  // Without ListPipeds every piped is looked up on its own. A large project
  // must not send all of those requests at once.
  it('looks up at most five pipeds at a time', async () => {
    setupConfigured();
    const ids = Array.from({ length: 12 }, (_, i) => `piped-many-${i}`);
    mockSuccess(ids.map((id, i) => deployment(`d${i}`, 1, 'DEPLOYMENT_SUCCESS', { pipedId: id })));
    let active = 0;
    let most = 0;
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      active++;
      most = Math.max(most, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return PIPEDS[id] ?? piped(id, id, 'v0.52.0', 1);
    });

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    await waitFor(() => {
      expect(table.textContent).toContain('piped-many-11');
    });
    for (const id of ids) {
      expect(pipecdApi.getPiped).toHaveBeenCalledWith(expect.anything(), id, expect.anything());
    }
    expect(most).toBe(5);
  });

  it('also lists pipeds that appear only in deployments', async () => {
    setupConfigured();
    mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS', { pipedId: 'piped-old-001' })]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('old-vm');
  });

  // A recent deployment can name a piped that was since deleted or moved to
  // another project. It is not one of this project's pipeds.
  it.each([
    ['NotFound', 5],
    ['InvalidArgument', 3],
  ])('leaves out a deployment piped that fails with %s', async (_name, code) => {
    setupConfigured();
    mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS', { pipedId: 'piped-gone' })]);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-gone') {
        throw new pipecdApi.PipeCDApiError('PipeCD API error calling GetPiped: gone', code, '');
      }
      return PIPEDS[id];
    });

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('prod');
    expect(table.textContent).not.toContain('piped-gone');
    expect(screen.queryByText(/could not be loaded/)).toBeNull();
  });

  // Its applications still point at it, so dropping the row would leave the
  // Apps column short with nothing to say why.
  it('keeps a piped that applications use even when it is not found', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-gcp-001') {
        throw new pipecdApi.PipeCDApiError('PipeCD API error calling GetPiped: gone', 5, '');
      }
      return PIPEDS[id];
    });

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('piped-gcp-001');
    expect(screen.getByText(/Some piped details could not be loaded/)).toBeTruthy();
  });

  it('still lists a piped whose details fail to load', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.getPiped).mockImplementation(async (_config, id) => {
      if (id === 'piped-gcp-001') throw new Error('permission denied');
      return PIPEDS[id];
    });

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-pipeds-table' });
    expect(table.textContent).toContain('piped-gcp-001');
    expect(
      screen.getByText(/Some piped details could not be loaded: permission denied/)
    ).toBeTruthy();
  });

  it('shows the newest deployments first', async () => {
    setupConfigured();
    mockSuccess([
      deployment('older', 5, 'DEPLOYMENT_FAILURE', { applicationName: 'infra-staging' }),
      deployment('newer', 1, 'DEPLOYMENT_RUNNING', { applicationName: 'api-service-prod' }),
    ]);

    renderOverview();

    const table = await screen.findByRole('table', { name: 'pipecd-recent-deployments-table' });
    const rows = table.querySelectorAll('tr');
    expect(rows[0].textContent).toContain('api-service-prod');
    expect(rows[0].textContent).toContain('Running');
    expect(rows[1].textContent).toContain('infra-staging');
    expect(rows[1].textContent).toContain('Failure');
  });

  it('links each recent deployment to PipeCD in a new tab', async () => {
    setupConfigured();
    mockSuccess([deployment('deploy-123', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();

    const link = await screen.findByRole('link', { name: 'Open in PipeCD' });
    expect(link.getAttribute('href')).toBe(
      'https://pipecd.example.com/deployments/deploy-123?project=myproject'
    );
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('opens the deployment page when its row is clicked', async () => {
    setupConfigured();
    mockSuccess([deployment('deploy-123', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();
    const table = await screen.findByRole('table', { name: 'pipecd-recent-deployments-table' });
    fireEvent.click(table.querySelector('tr')!);

    expect(screen.getByTestId('location').textContent).toBe('/pipecd/deployments/deploy-123');
  });

  it('links the application name to the deployment page', async () => {
    setupConfigured();
    mockSuccess([deployment('deploy-123', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();
    const table = await screen.findByRole('table', { name: 'pipecd-recent-deployments-table' });
    const name = table.querySelector('a[href="/pipecd/deployments/deploy-123"]');
    expect(name?.textContent).toBe(deploymentCompleted.applicationName);
  });

  it('does not leave the overview when Open in PipeCD is clicked', async () => {
    setupConfigured();
    mockSuccess([deployment('deploy-123', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();
    fireEvent.click(await screen.findByRole('link', { name: 'Open in PipeCD' }));

    expect(screen.getByTestId('location').textContent).toBe('/pipecd/overview');
  });

  it('leaves out deployments older than the time range', async () => {
    setupConfigured();
    mockSuccess([
      deployment('recent', 1, 'DEPLOYMENT_SUCCESS'),
      deployment('old', 24 * 10, 'DEPLOYMENT_FAILURE'),
    ]);

    renderOverview();

    expect(await screen.findByText('0 of 1 failed')).toBeTruthy();
  });

  // ListDeployments has no time filter, so paging must stop once a page is
  // entirely older than the range instead of walking the whole history.
  it('stops paging deployments once a page is older than the range', async () => {
    setupConfigured();
    mockSuccess([]);
    vi.mocked(pipecdApi.listDeployments)
      .mockResolvedValueOnce({
        deployments: [deployment('d1', 1, 'DEPLOYMENT_SUCCESS')],
        cursor: 'c1',
      })
      .mockResolvedValueOnce({
        deployments: [deployment('d2', 24 * 30, 'DEPLOYMENT_SUCCESS')],
        cursor: 'c2',
      })
      .mockResolvedValue({
        deployments: [deployment('d3', 1, 'DEPLOYMENT_SUCCESS')],
        cursor: 'c3',
      });

    renderOverview();

    expect(await screen.findByText('0 of 1 failed')).toBeTruthy();
    expect(pipecdApi.listDeployments).toHaveBeenCalledTimes(2);
  });

  it('shows empty messages when there is nothing to show', async () => {
    setupConfigured();
    mockApps([]);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderOverview();

    expect(await screen.findByText('No pipeds found.')).toBeTruthy();
    // Once in the chart and once in the recent deployments panel.
    expect(screen.getAllByText('No deployments in this time range.')).toHaveLength(2);
  });

  it('shows an error alert when loading fails', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockRejectedValue(new Error('server unavailable'));
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderOverview();

    expect(await screen.findByText(/Failed to load overview/i)).toBeTruthy();
    expect(screen.getByText(/server unavailable/)).toBeTruthy();
  });

  it('shows one bar per hour for the last 24 hours', async () => {
    // Labels near a clock change get a zone name ("01–02 EST"), so pin the
    // clock to mid-January, when no timezone changes its clocks.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 15, 12, 30));
    try {
      setupConfigured();
      mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS')]);

      renderOverview();
      await screen.findByText('1 synced');

      fireEvent.mouseDown(screen.getByLabelText('Time range'));
      fireEvent.click(await screen.findByRole('option', { name: 'Last 24 hours' }));

      await waitFor(() => {
        expect(cardOf('Deployments').textContent).toContain('/ hour');
      });
      expect(screen.getAllByRole('img', { name: /deployments/ })).toHaveLength(24);

      // Each bar is an hour, so it is labelled as a span such as "09–10".
      expect(screen.getAllByText(/^\d{2}–\d{2}$/)).toHaveLength(8);
      expect(
        screen.getAllByRole('img', { name: /deployments/ })[23].getAttribute('aria-label')
      ).toContain('12–13');
    } finally {
      vi.useRealTimers();
    }
  });

  // The breakdown is in a hover tooltip, so the bar itself must carry it for
  // keyboard and screen reader users.
  it('lets each bar be focused and names its outcome counts', async () => {
    setupConfigured();
    mockSuccess([
      deployment('d1', 0, 'DEPLOYMENT_SUCCESS'),
      deployment('d2', 0, 'DEPLOYMENT_SUCCESS'),
      deployment('d3', 0, 'DEPLOYMENT_FAILURE'),
    ]);

    renderOverview();
    await screen.findByText('1 synced');

    const bars = screen.getAllByRole('img', { name: /deployments/ });
    const today = bars[bars.length - 1];
    expect(today.getAttribute('tabindex')).toBe('0');
    // The day comes first, so the counts are heard after it.
    expect(today.getAttribute('aria-label')).toMatch(/3 deployments, Success: 2, Failure: 1$/);
  });

  it('fetches again when the time range changes', async () => {
    setupConfigured();
    mockSuccess([deployment('d1', 1, 'DEPLOYMENT_SUCCESS')]);

    renderOverview();
    await screen.findByText('1 synced');
    const callsBefore = vi.mocked(pipecdApi.listApplications).mock.calls.length;

    fireEvent.mouseDown(screen.getByLabelText('Time range'));
    fireEvent.click(await screen.findByRole('option', { name: 'Last 30 days' }));

    await waitFor(() => {
      expect(cardOf('Deployments').textContent).toContain('Last 30 days');
    });
    expect(screen.getAllByRole('img', { name: /deployments/ })).toHaveLength(30);
    expect(vi.mocked(pipecdApi.listApplications).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('fetches again when Refresh is clicked', async () => {
    setupConfigured();
    mockSuccess([]);

    renderOverview();
    await screen.findByText('1 synced');
    const callsBefore = vi.mocked(pipecdApi.listDeployments).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.listDeployments).mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it('stops paging applications when the server cycles cursors', async () => {
    setupConfigured();
    mockSuccess([]);
    let calls = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async (_config, options) => {
      if (options?.disabled) return { applications: [], cursor: '' };
      calls++;
      return { applications: [appKubernetesSynced], cursor: calls % 2 ? 'c1' : 'c2' };
    });

    renderOverview();

    expect(await screen.findByText('1 synced')).toBeTruthy();
    expect(calls).toBeLessThan(5);
  });

  it('keeps paging applications past a page of repeats with a new cursor', async () => {
    setupConfigured();
    mockSuccess([]);
    let page = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async (_config, options) => {
      if (options?.disabled) return { applications: [], cursor: '' };
      page++;
      if (page === 1) return { applications: [appKubernetesSynced], cursor: 'c1' };
      if (page === 2) return { applications: [appKubernetesSynced], cursor: 'c2' };
      return { applications: [appTerraformOutOfSync], cursor: '' };
    });

    renderOverview();

    expect(await screen.findByText('1 synced')).toBeTruthy();
    expect(cardOf('1 synced').querySelector('h4')?.textContent).toBe('2');
    expect(screen.getByText('1 out of sync')).toBeTruthy();
  });

  it('does not count a repeated application twice', async () => {
    setupConfigured();
    mockSuccess([]);
    let page = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async (_config, options) => {
      if (options?.disabled) return { applications: [], cursor: '' };
      page++;
      return page === 1
        ? { applications: [appKubernetesSynced], cursor: 'c1' }
        : {
            applications: [appKubernetesSynced, appTerraformOutOfSync, appCloudRunDeploying],
            cursor: '',
          };
    });

    renderOverview();

    expect(await screen.findByText('1 synced')).toBeTruthy();
    expect(cardOf('1 synced').querySelector('h4')?.textContent).toBe('3');
  });
});
