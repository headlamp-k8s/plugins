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

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { ApplicationDetail } from '../components/ApplicationDetail';
import { formatTimestamp } from '../utils/time';
import { appKubernetesSynced, deploymentCompleted } from './fixtures';

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
  return {
    ...original,
    getApplication: vi.fn(),
    listDeployments: vi.fn(),
    syncApplication: vi.fn(),
    getCommand: vi.fn(),
  };
});

function setupConfigured(): void {
  pipecdApi.saveConfig({ baseURL: 'https://pipecd.example.com', apiKey: 'test-key-xyz' });
}

function renderDetail(id = 'app-k8s-001'): void {
  render(
    <MemoryRouter initialEntries={[`/pipecd/applications/${id}`]}>
      <Route path="/pipecd/applications/:id">
        <ApplicationDetail />
      </Route>
    </MemoryRouter>
  );
}

describe('ApplicationDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.mocked(pipecdApi.getApplication).mockReset();
    vi.mocked(pipecdApi.listDeployments).mockReset();
    vi.mocked(pipecdApi.syncApplication).mockReset();
    vi.mocked(pipecdApi.getCommand).mockReset();
  });

  it('shows NotConfigured when there is no saved API key', () => {
    renderDetail();

    expect(screen.getByText(/PipeCD Not Configured/i)).toBeTruthy();
    expect(pipecdApi.getApplication).not.toHaveBeenCalled();
  });

  it('requests the application named in the route', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail('app-k8s-001');

    await screen.findByText('frontend-prod');
    expect(vi.mocked(pipecdApi.getApplication).mock.calls[0][1]).toBe('app-k8s-001');
  });

  it('shows the application metadata', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    expect(await screen.findByText('frontend-prod')).toBeTruthy();
    expect(screen.getByText('github.com/myorg/frontend')).toBeTruthy();
    expect(screen.getByText('k8s/overlays/prod')).toBeTruthy();
    expect(screen.getByText('piped-prod-001')).toBeTruthy();
    expect(screen.getByText('Synced')).toBeTruthy();
  });

  it('lists the deployment history', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({
      deployments: [deploymentCompleted],
      cursor: '',
    });

    renderDetail();

    await screen.findByText('frontend-prod');
    expect(screen.getAllByText('feat: add dark mode support').length).toBeGreaterThan(0);
    expect(screen.getByText('Success')).toBeTruthy();
  });

  it('shows an empty state when the application has no deployments', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    expect(await screen.findByText(/No deployments yet for this application/i)).toBeTruthy();
  });

  it('shows an error when the application cannot be loaded', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockRejectedValue(new Error('application not found'));
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    await screen.findByText(/Failed to load application/i);
    expect(screen.getByText(/application not found/i)).toBeTruthy();
  });

  it('shows the last successful deployment as last synced, not the status report', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    await screen.findByText('frontend-prod');
    expect(screen.getByText(formatTimestamp(1721990300))).toBeTruthy();
    expect(screen.queryByText(formatTimestamp(1722000000))).toBeNull();
  });

  it('offers a sync action', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    await screen.findByText('frontend-prod');
    expect(screen.getByRole('button', { name: /^Sync$/ })).toBeTruthy();
  });

  it('does not sync without confirmation', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    await screen.findByText('frontend-prod');
    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(pipecdApi.syncApplication).not.toHaveBeenCalled();
  });

  it('keeps the sync result on screen while the page reloads', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupConfigured();
    // The reload has to stay pending, or the loading state is never rendered.
    let finishReload: (app: typeof appKubernetesSynced) => void = () => {};
    vi.mocked(pipecdApi.getApplication)
      .mockResolvedValueOnce(appKubernetesSynced)
      .mockReturnValueOnce(
        new Promise(resolve => {
          finishReload = resolve;
        })
      );
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue({
      id: 'cmd-1',
      applicationId: 'app-k8s-001',
      deploymentId: 'deploy-1',
      status: 'COMMAND_SUCCEEDED',
      handledAt: 0,
      createdAt: 0,
    });

    renderDetail();
    await screen.findByText('frontend-prod');
    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Sync$/ }));
    await vi.advanceTimersByTimeAsync(2500);

    await waitFor(() => {
      expect(pipecdApi.getApplication).toHaveBeenCalledTimes(2);
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText('Sync started for frontend-prod.')).toBeTruthy();

    finishReload(appKubernetesSynced);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText('Sync started for frontend-prod.')).toBeTruthy();
  });

  it('blocks syncing a disabled application', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue({
      ...appKubernetesSynced,
      disabled: true,
    });
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    await screen.findByText('frontend-prod');
    const button = screen.getByRole('button', { name: /^Sync$/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('links back to the applications list', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    const back = await screen.findByRole('link', { name: /Back to applications/i });
    expect(back.getAttribute('href')).toBe('/pipecd/applications');
  });
});
