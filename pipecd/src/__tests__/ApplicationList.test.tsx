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
import userEvent from '@testing-library/user-event';
import { type ReactNode, StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { ApplicationList } from '../components/ApplicationList';
import { appKubernetesSynced, appTerraformOutOfSync, mockListResponse } from './fixtures';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: () => null,
  getClusterPrefixedPath: (path: string) => path,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('../api/pipecd', async importOriginal => {
  const original = await importOriginal<typeof import('../api/pipecd')>();
  return { ...original, listApplications: vi.fn() };
});

function renderList(): void {
  render(
    <MemoryRouter>
      <ApplicationList />
    </MemoryRouter>
  );
}

function setupConfigured(): void {
  pipecdApi.saveConfig({ baseURL: 'https://pipecd.example.com', apiKey: 'test-key-xyz' });
}

function mockListSuccess(): void {
  vi.mocked(pipecdApi.listApplications).mockResolvedValue(mockListResponse);
}

function mockListFailure(message = 'Network error'): void {
  vi.mocked(pipecdApi.listApplications).mockRejectedValue(new Error(message));
}

describe('ApplicationList', () => {
  beforeEach(() => {
    localStorage.clear();
    // The API key lives in memory now, so reset it between tests.
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.listApplications).mockReset();
  });

  it('shows NotConfigured when no API key is set', () => {
    renderList();

    expect(screen.getByText(/PipeCD Not Configured/i)).toBeTruthy();
    expect(screen.getByText(/Configure PipeCD/i)).toBeTruthy();
    expect(pipecdApi.listApplications).not.toHaveBeenCalled();
  });

  it('shows loading skeleton while fetch is in progress', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockImplementation(() => new Promise(() => {}));

    renderList();

    expect(await screen.findByLabelText('loading-skeleton')).toBeTruthy();
  });

  it('gives up on a list request that hangs and lets the user refresh', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setupConfigured();
      vi.mocked(pipecdApi.listApplications).mockReturnValue(new Promise(() => {}));

      renderList();

      await vi.advanceTimersByTimeAsync(31000);

      expect(await screen.findByText(/Failed to load applications/i)).toBeTruthy();
      expect(screen.getByText('The request timed out.')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Refresh/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders all three applications from mock data', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();

    expect(await screen.findByText('frontend-prod')).toBeTruthy();
    expect(await screen.findByText('infra-staging')).toBeTruthy();
    expect(await screen.findByText('api-service-prod')).toBeTruthy();
  });

  it('lists an application only once when a later page repeats it', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications)
      .mockResolvedValueOnce({ applications: [appKubernetesSynced], cursor: 'c1' })
      .mockResolvedValueOnce({
        applications: [appKubernetesSynced, appTerraformOutOfSync],
        cursor: '',
      });

    renderList();
    await screen.findByText('infra-staging');

    expect(screen.getAllByText('frontend-prod')).toHaveLength(1);
  });

  it('keeps paging past a page of repeats that has a new cursor', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications)
      .mockResolvedValueOnce({ applications: [appKubernetesSynced], cursor: 'c1' })
      .mockResolvedValueOnce({ applications: [appKubernetesSynced], cursor: 'c2' })
      .mockResolvedValueOnce({ applications: [appTerraformOutOfSync], cursor: '' });

    renderList();

    expect(await screen.findByText('infra-staging')).toBeTruthy();
    expect(screen.getAllByText('frontend-prod')).toHaveLength(1);
  });

  it('stops paging when the server cycles through the same cursors', async () => {
    setupConfigured();
    let calls = 0;
    vi.mocked(pipecdApi.listApplications).mockImplementation(async () => {
      calls++;
      return {
        applications: [appKubernetesSynced],
        cursor: calls % 2 ? 'c1' : 'c2',
      };
    });

    renderList();
    await screen.findByText('frontend-prod');

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-skeleton')).toBeNull();
    });
    expect(calls).toBeLessThan(5);
  });

  it('shows a status label for each sync state', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('Synced')).toBeTruthy();
    expect(screen.getByText('Out of Sync')).toBeTruthy();
    expect(screen.getByText('Deploying')).toBeTruthy();
  });

  it('shows platform kind badges', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('Kubernetes')).toBeTruthy();
    expect(screen.getByText('Terraform')).toBeTruthy();
    expect(screen.getByText('Cloud Run')).toBeTruthy();
  });

  it('shows Git repository path for each app', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('github.com/myorg/frontend')).toBeTruthy();
    expect(screen.getByText('github.com/myorg/infra')).toBeTruthy();
  });

  it('shows deployment summary as caption under last synced time', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText(/feat: add dark mode support/i)).toBeTruthy();
  });

  // PipeCD often omits completedAt on the deployment reference, which used to
  // leave this column empty for every row.
  it('shows a last synced time even when the deployment has no completedAt', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockResolvedValue({
      applications: [
        {
          ...appKubernetesSynced,
          syncState: { ...appKubernetesSynced.syncState!, timestamp: 1722000000 },
          mostRecentSuccessfulDeployment: {
            ...appKubernetesSynced.mostRecentSuccessfulDeployment!,
            completedAt: 0,
          },
        },
      ],
      cursor: '',
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.queryByText('—')).toBeNull();
  });

  // Drift detection refreshes syncState.timestamp even when out of sync, so it
  // must not be shown as the last sync time.
  it('shows the deployment time, not a newer out-of-sync report', async () => {
    setupConfigured();
    const now = Math.floor(Date.now() / 1000);
    vi.mocked(pipecdApi.listApplications).mockResolvedValue({
      applications: [
        {
          ...appKubernetesSynced,
          syncState: { ...appKubernetesSynced.syncState!, status: 'OUT_OF_SYNC', timestamp: now },
          mostRecentSuccessfulDeployment: {
            ...appKubernetesSynced.mostRecentSuccessfulDeployment!,
            startedAt: now - 2 * 86400 - 60,
            completedAt: now - 2 * 86400,
          },
        },
      ],
      cursor: '',
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('2d ago')).toBeTruthy();
    expect(screen.queryByText('just now')).toBeNull();
  });

  it('links the application name to its detail page', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByRole('link', { name: 'frontend-prod' }).getAttribute('href')).toBe(
      '/pipecd/applications/app-k8s-001'
    );
  });

  it('links each application to PipeCD in a new tab', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    const links = screen.getAllByRole('link', { name: 'Open in PipeCD' });
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe(
      'https://pipecd.example.com/applications/app-k8s-001?project=myproject'
    );
    expect(links[0].getAttribute('target')).toBe('_blank');
  });

  it('filters applications by search text (name match)', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByRole('textbox', { name: /Search/i }), 'frontend');

    expect(screen.getByText('frontend-prod')).toBeTruthy();
    expect(screen.queryByText('infra-staging')).toBeNull();
    expect(screen.queryByText('api-service-prod')).toBeNull();
  });

  it('filters applications by repository name', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByRole('textbox', { name: /Search/i }), 'myorg/infra');

    expect(screen.queryByText('frontend-prod')).toBeNull();
    expect(screen.getByText('infra-staging')).toBeTruthy();
  });

  it('shows empty state message when search matches nothing', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByRole('textbox', { name: /Search/i }), 'xyznonexistent');

    expect(screen.getByText(/No applications match the current filter/i)).toBeTruthy();
  });

  it('filters by platform on the client when dropdown changes', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    fireEvent.mouseDown(screen.getByLabelText('Platform'));
    fireEvent.click(await screen.findByRole('option', { name: 'Terraform' }));

    await waitFor(() => {
      expect(screen.queryByText('frontend-prod')).toBeNull();
    });
    expect(screen.getByText(appTerraformOutOfSync.name)).toBeTruthy();
    expect(vi.mocked(pipecdApi.listApplications)).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: expect.anything() })
    );
  });

  it('shows error alert when API call fails', async () => {
    setupConfigured();
    mockListFailure('PipeCD server is unavailable');

    renderList();

    await screen.findByText(/Failed to load applications/i);
    expect(screen.getByText(/PipeCD server is unavailable/i)).toBeTruthy();
  });

  it('dismisses error alert when close button clicked', async () => {
    setupConfigured();
    mockListFailure('connection refused');

    renderList();

    await screen.findByText(/Failed to load applications/i);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Failed to load applications/i)).toBeNull();
    });
  });

  it('shows empty state when API returns zero applications', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockResolvedValue({ applications: [], cursor: '' });

    renderList();

    await screen.findByText(/No PipeCD applications found/i);
    expect(
      screen.getByText(/Make sure your PipeCD project has at least one application/i)
    ).toBeTruthy();
  });

  it('calls listApplications again when Refresh is clicked', async () => {
    setupConfigured();
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.listApplications)).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ApplicationList request handling', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
    setupConfigured();
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.listApplications).mockReset();
  });

  it('cancels the in-flight request when the list unmounts', async () => {
    vi.mocked(pipecdApi.listApplications).mockReturnValue(new Promise(() => {}));

    const { unmount } = render(
      <MemoryRouter>
        <ApplicationList />
      </MemoryRouter>
    );
    await waitFor(() => expect(vi.mocked(pipecdApi.listApplications)).toHaveBeenCalled());

    const signal = vi.mocked(pipecdApi.listApplications).mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  // A second request cannot start while one is running, so an older response
  // can never land after a newer one and overwrite its rows.
  it('disables Refresh while a request is running', async () => {
    vi.mocked(pipecdApi.listApplications).mockImplementation(() => new Promise(() => {}));

    renderList();

    const button = (await screen.findByRole('button', { name: /Refresh/i })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  // StrictMode runs the effect twice, so the list cancels its first request
  // itself. That request then fails with an AbortError, which must not show.
  it('does not show an error for a request it cancelled itself', async () => {
    vi.mocked(pipecdApi.listApplications).mockImplementation(
      (_config, options) =>
        new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const aborted = new Error('ListApplications was cancelled');
            aborted.name = 'AbortError';
            reject(aborted);
          });
          setTimeout(() => resolve(mockListResponse), 0);
        })
    );

    render(
      <StrictMode>
        <MemoryRouter>
          <ApplicationList />
        </MemoryRouter>
      </StrictMode>
    );

    expect(await screen.findByText('frontend-prod')).toBeTruthy();
    const signals = vi.mocked(pipecdApi.listApplications).mock.calls.map(c => c[1]?.signal);
    expect(signals.some(s => s?.aborted)).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

// How a single row copes with the fields PipeCD leaves empty or makes long.
describe('ApplicationList rows', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
    setupConfigured();
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.listApplications).mockReset();
  });

  function mockOneApp(app: typeof appKubernetesSynced): void {
    vi.mocked(pipecdApi.listApplications).mockResolvedValue({ applications: [app], cursor: '' });
  }

  it('falls back to the deployment start time when nothing else is set', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockOneApp({
      ...appKubernetesSynced,
      syncState: { ...appKubernetesSynced.syncState!, timestamp: 0 },
      mostRecentSuccessfulDeployment: {
        ...appKubernetesSynced.mostRecentSuccessfulDeployment!,
        completedAt: 0,
        startedAt: now - 3 * 86400,
      },
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('3d ago')).toBeTruthy();
  });

  it('shows a dash when the application has never been synced', async () => {
    mockOneApp({
      ...appKubernetesSynced,
      syncState: undefined,
      mostRecentSuccessfulDeployment: undefined,
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows a dash when the application has no repository', async () => {
    mockOneApp({ ...appKubernetesSynced, gitPath: undefined });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText('k8s/overlays/prod')).toBeNull();
  });

  it('shows the config path under the repository', async () => {
    mockOneApp(appKubernetesSynced);

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('k8s/overlays/prod')).toBeTruthy();
  });

  it('shows markdown links in the description as plain text', async () => {
    mockOneApp({
      ...appKubernetesSynced,
      description: 'See the [runbook](https://example.com/runbook) first',
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText('See the runbook first')).toBeTruthy();
  });

  it('cuts a long description short', async () => {
    mockOneApp({ ...appKubernetesSynced, description: 'a'.repeat(120) });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText(`${'a'.repeat(90)}…`)).toBeTruthy();
  });

  it('leaves the description out when there is none', async () => {
    mockOneApp({ ...appKubernetesSynced, description: '' });

    renderList();
    await screen.findByText('frontend-prod');

    // Only the name link is left in the cell: no empty caption under it.
    const cell = screen.getByRole('link', { name: 'frontend-prod' }).closest('td');
    expect(cell?.children).toHaveLength(1);
  });

  it('cuts a long deployment summary short', async () => {
    mockOneApp({
      ...appKubernetesSynced,
      mostRecentSuccessfulDeployment: {
        ...appKubernetesSynced.mostRecentSuccessfulDeployment!,
        summary: 'b'.repeat(80),
      },
    });

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText(`${'b'.repeat(60)}…`)).toBeTruthy();
  });

  it('searches the config path as well as the name and repository', async () => {
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByRole('textbox', { name: /Search/i }), 'terraform/staging');

    expect(screen.getByText('infra-staging')).toBeTruthy();
    expect(screen.queryByText('frontend-prod')).toBeNull();
  });

  it('ignores case when searching', async () => {
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByRole('textbox', { name: /Search/i }), 'FRONTEND');

    expect(screen.getByText('frontend-prod')).toBeTruthy();
    expect(screen.queryByText('infra-staging')).toBeNull();
  });

  it('brings every row back when the search is cleared', async () => {
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    const search = screen.getByRole('textbox', { name: /Search/i });
    await userEvent.type(search, 'frontend');
    await userEvent.clear(search);

    expect(screen.getByText('infra-staging')).toBeTruthy();
    expect(screen.getByText('api-service-prod')).toBeTruthy();
  });

  it('shows when the list was last updated', async () => {
    mockListSuccess();

    renderList();
    await screen.findByText('frontend-prod');

    expect(screen.getByText(/Last updated:/)).toBeTruthy();
  });

  it('shows the gRPC status code for an API error', async () => {
    // Built the way the API client builds it.
    vi.mocked(pipecdApi.listApplications).mockRejectedValue(
      new pipecdApi.PipeCDApiError(
        'PipeCD API error calling ListApplications: invalid api key',
        16,
        'invalid api key'
      )
    );

    renderList();

    expect(await screen.findByText(/API error 16:.*invalid api key/)).toBeTruthy();
  });

  it('keeps the loaded rows when a refresh fails', async () => {
    vi.mocked(pipecdApi.listApplications)
      .mockResolvedValueOnce(mockListResponse)
      .mockRejectedValueOnce(new Error('connection reset'));

    renderList();
    await screen.findByText('frontend-prod');

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    expect(await screen.findByText(/connection reset/)).toBeTruthy();
    expect(screen.getByText('frontend-prod')).toBeTruthy();
  });
});
