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

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { DeploymentDetail } from '../components/DeploymentDetail';
import { deploymentCompleted, stageLogsCompleted } from './fixtures';

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
  return { ...original, getDeployment: vi.fn(), listStageLogs: vi.fn() };
});

function setupConfigured(): void {
  pipecdApi.saveConfig({ baseURL: 'https://pipecd.example.com', apiKey: 'test-key-xyz' });
}

function renderDetail(id = 'deploy-001'): void {
  render(
    <MemoryRouter initialEntries={[`/pipecd/deployments/${id}`]}>
      <Route path="/pipecd/deployments/:id">
        <DeploymentDetail />
      </Route>
    </MemoryRouter>
  );
}

/** The fixture reuses the commit message as the summary, so anchor on the heading. */
function findHeading(): Promise<HTMLElement> {
  return screen.findByRole('heading', { name: 'feat: add dark mode support' });
}

function mockSuccess(): void {
  vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
  vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });
}

describe('DeploymentDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    pipecdApi.saveConfig({ baseURL: '', apiKey: '' });
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.getDeployment).mockReset();
    vi.mocked(pipecdApi.listStageLogs).mockReset();
  });

  it('shows NotConfigured when there is no saved API key', () => {
    renderDetail();

    expect(screen.getByText(/PipeCD Not Configured/i)).toBeTruthy();
    expect(pipecdApi.getDeployment).not.toHaveBeenCalled();
  });

  it('requests the deployment named in the route', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail('deploy-001');

    await findHeading();
    expect(vi.mocked(pipecdApi.getDeployment).mock.calls[0][1]).toBe('deploy-001');
  });

  it('shows the deployment metadata', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    expect(await findHeading()).toBeTruthy();
    // The deployment and both of its stages all report Success.
    expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
    expect(screen.getByText('github.com/myorg/frontend')).toBeTruthy();
    expect(screen.getByText('a1b2c3d4')).toBeTruthy();
  });

  it('lists the pipeline stages in index order', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    await findHeading();
    const stageNames = screen.getAllByText(/^(WAIT_APPROVAL|K8S_SYNC|ROLLBACK)$/);

    expect(stageNames.map(node => node.textContent)).toEqual(['WAIT_APPROVAL', 'K8S_SYNC']);
  });

  // piped appends a rollback stage to every pipeline, so an unused one is noise.
  it('hides a rollback stage that never ran', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    await findHeading();
    expect(screen.queryByText('ROLLBACK')).toBeNull();
  });

  // PipelineStage.visible is deprecated and left unset by the server, so
  // filtering on it used to hide every stage.
  it('renders stages even though the deprecated visible flag is unset', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    await findHeading();
    expect(screen.queryByText(/no pipeline stages/i)).toBeNull();
    expect(screen.getByText('K8S_SYNC')).toBeTruthy();
  });

  it('shows and marks a rollback stage that actually ran', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue({
      ...deploymentCompleted,
      stages: deploymentCompleted.stages.map(stage =>
        stage.rollback ? { ...stage, status: 'STAGE_SUCCESS' as const } : stage
      ),
    });
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    expect(screen.getByText('ROLLBACK')).toBeTruthy();
    expect(screen.getByText('rollback')).toBeTruthy();
  });

  it('shows stage logs when a stage is expanded', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    await findHeading();
    expect(screen.queryByText('Applying manifests...')).toBeNull();

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText('Applying manifests...')).toBeTruthy();
    expect(screen.getByText('deployment.apps/frontend configured')).toBeTruthy();
  });

  it('still renders the pipeline when stage logs cannot be fetched', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs).mockRejectedValue(new Error('logs pruned'));

    renderDetail();

    await findHeading();
    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText(/No logs available for this stage/i)).toBeTruthy();
    expect(screen.queryByText(/Failed to load deployment/i)).toBeNull();
  });

  it('shows the status reason in green for a successful deployment', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    const reason = await screen.findByText('The deployment was completed successfully');
    // MUI encodes severity in the Alert root class.
    expect(reason.closest('.MuiAlert-standardSuccess')).toBeTruthy();
    expect(reason.closest('.MuiAlert-standardInfo')).toBeNull();
  });

  it('shows an error when the deployment cannot be loaded', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockRejectedValue(new Error('deployment not found'));
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: {} });

    renderDetail();

    await screen.findByText(/Failed to load deployment/i);
    expect(screen.getByText(/deployment not found/i)).toBeTruthy();
  });

  it('links back to the parent application', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    const back = await screen.findByRole('link', { name: /Back to application/i });
    expect(back.getAttribute('href')).toBe('/pipecd/applications/app-k8s-001');
  });
});
