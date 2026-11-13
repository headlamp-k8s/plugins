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

import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
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
  return { ...original, getApplication: vi.fn(), listDeployments: vi.fn() };
});

function setupConfigured(): void {
  pipecdApi.saveConfig({ baseURL: 'https://pipecd.example.com', apiKey: 'test-key-xyz' });
}

/** Renders the page and returns a function that moves the route to another id. */
function renderDetail(id = 'app-k8s-001'): (nextId: string) => void {
  let history: RouteComponentProps['history'] | undefined;
  render(
    <MemoryRouter initialEntries={[`/pipecd/applications/${id}`]}>
      <Route path="/pipecd/applications/:id">
        <ApplicationDetail />
      </Route>
      <Route
        render={props => {
          history = props.history;
          return null;
        }}
      />
    </MemoryRouter>
  );
  return nextId => act(() => history!.push(`/pipecd/applications/${nextId}`));
}

describe('ApplicationDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.getApplication).mockReset();
    vi.mocked(pipecdApi.listDeployments).mockReset();
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

  it('links back to the applications list', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    const back = await screen.findByRole('link', { name: /Back to applications/i });
    expect(back.getAttribute('href')).toBe('/pipecd/applications');
  });

  it('opens the application in PipeCD with its project', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockResolvedValue(appKubernetesSynced);
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({ deployments: [], cursor: '' });

    renderDetail();

    const link = await screen.findByRole('link', { name: 'Open in PipeCD' });
    expect(link.getAttribute('href')).toBe(
      'https://pipecd.example.com/applications/app-k8s-001?project=myproject'
    );
  });

  it('does not show the previous application when the next one fails to load', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getApplication).mockImplementation(async (_config, id) => {
      if (id === 'app-k8s-001') return appKubernetesSynced;
      throw new Error('application not found');
    });
    vi.mocked(pipecdApi.listDeployments).mockResolvedValue({
      deployments: [deploymentCompleted],
      cursor: '',
    });

    const navigate = renderDetail('app-k8s-001');
    await screen.findByText('frontend-prod');

    navigate('app-missing');

    await screen.findByText(/Failed to load application/i);
    expect(screen.queryByText('frontend-prod')).toBeNull();
    expect(screen.queryByText('feat: add dark mode support')).toBeNull();
  });
});
