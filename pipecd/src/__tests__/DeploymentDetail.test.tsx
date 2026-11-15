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

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { DeploymentDetail } from '../components/DeploymentDetail';
import type { Deployment } from '../types/pipecd';
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

/** Renders the page and returns a function that moves the route to another id. */
function renderDetail(id = 'deploy-001'): (nextId: string) => void {
  let history: RouteComponentProps['history'] | undefined;
  render(
    <MemoryRouter initialEntries={[`/pipecd/deployments/${id}`]}>
      <Route path="/pipecd/deployments/:id">
        <DeploymentDetail />
      </Route>
      <Route
        render={props => {
          history = props.history;
          return null;
        }}
      />
    </MemoryRouter>
  );
  return nextId => act(() => history!.push(`/pipecd/deployments/${nextId}`));
}

/** The fixture reuses the commit message as the summary, so anchor on the heading. */
function findHeading(): Promise<HTMLElement> {
  return screen.findByRole('heading', { name: 'feat: add dark mode support' });
}

/** The same deployment, caught while its sync stage is still running. */
const deploymentRunning: Deployment = {
  ...deploymentCompleted,
  status: 'DEPLOYMENT_RUNNING',
  statusReason: '',
  completedAt: 0,
  stages: deploymentCompleted.stages.map(stage =>
    stage.id === 'stage-k8s-sync' ? { ...stage, status: 'STAGE_RUNNING', completedAt: 0 } : stage
  ),
};

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

  it('hides a rollback stage that was skipped', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue({
      ...deploymentCompleted,
      stages: deploymentCompleted.stages.map(stage =>
        stage.rollback ? { ...stage, status: 'STAGE_SKIPPED' as const } : stage
      ),
    });
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    expect(screen.queryByText('ROLLBACK')).toBeNull();
    expect(screen.getByText('K8S_SYNC')).toBeTruthy();
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
    // The failure is reported, so it does not look like a stage with no logs.
    expect(screen.getByText('Failed to load logs: logs pruned')).toBeTruthy();
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

  it('opens the deployment in PipeCD with its project', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    const link = await screen.findByRole('link', { name: 'Open in PipeCD' });
    expect(link.getAttribute('href')).toBe(
      'https://pipecd.example.com/deployments/deploy-001?project=myproject'
    );
  });

  it('shows the deployment while its logs are still loading', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs).mockReturnValue(new Promise(() => {}));

    renderDetail();

    expect(await findHeading()).toBeTruthy();
    expect(screen.getByText('K8S_SYNC')).toBeTruthy();

    // An opened stage says the logs are loading, not that there are none.
    fireEvent.click(screen.getByText('K8S_SYNC'));
    expect(await screen.findByText('Loading logs…')).toBeTruthy();
    expect(screen.queryByText(/No logs available/i)).toBeNull();
  });

  it('fetches the deployment and logs again when a stage of a running deployment is opened', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment)
      .mockResolvedValueOnce(deploymentRunning)
      .mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs)
      .mockResolvedValueOnce({ stageLogs: {} })
      .mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText('Applying manifests...')).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2);
    expect(pipecdApi.getDeployment).toHaveBeenCalledTimes(2);
    // The stage status is refreshed with its logs, so they agree.
    await waitFor(() => expect(screen.queryByText('Running')).toBeNull());
  });

  it('fetches again for a finished stage whose log was missing from the first snapshot', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs)
      .mockResolvedValueOnce({ stageLogs: {} })
      .mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText('Applying manifests...')).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2);
  });

  it('retries a missing log only once for a finished deployment', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: {} });

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    // Open, close and open again: only the first open fetches.
    fireEvent.click(screen.getByText('K8S_SYNC'));
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/No logs available for this stage/i)).toBeTruthy();
    fireEvent.click(screen.getByText('K8S_SYNC'));
    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText(/No logs available for this stage/i)).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2);
  });

  it('keeps Refresh off until both the deployment and logs are back', async () => {
    setupConfigured();
    let finishDeployment: (value: Deployment) => void = () => {};
    vi.mocked(pipecdApi.getDeployment)
      .mockResolvedValueOnce(deploymentRunning)
      .mockReturnValueOnce(new Promise(resolve => (finishDeployment = resolve)));
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    const refresh = (): HTMLButtonElement =>
      screen.getByRole('button', { name: /Refresh/ }) as HTMLButtonElement;
    await waitFor(() => expect(refresh().disabled).toBe(false));

    fireEvent.click(refresh());
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2));
    // The logs are back, the deployment is not: still busy, and still Running.
    await act(async () => undefined);
    expect(refresh().disabled).toBe(true);
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);

    await act(async () => finishDeployment(deploymentCompleted));

    await waitFor(() => expect(refresh().disabled).toBe(false));
    expect(screen.queryByText('Running')).toBeNull();
  });

  it('gives up on a request that hangs, so Refresh works again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      setupConfigured();
      vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
      vi.mocked(pipecdApi.listStageLogs).mockReturnValue(new Promise(() => {}));

      renderDetail();

      await findHeading();
      const refresh = screen.getByRole('button', { name: /Refresh/ }) as HTMLButtonElement;
      expect(refresh.disabled).toBe(true);
      fireEvent.click(screen.getByText('K8S_SYNC'));
      expect(await screen.findByText('Loading logs…')).toBeTruthy();

      await vi.advanceTimersByTimeAsync(31000);

      expect(await screen.findByText('Failed to load logs: The request timed out.')).toBeTruthy();
      expect(refresh.disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not fetch logs for a stage that never ran', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue({
      ...deploymentCompleted,
      stages: deploymentCompleted.stages.map(stage =>
        stage.id === 'stage-k8s-sync' ? { ...stage, status: 'STAGE_SKIPPED' as const } : stage
      ),
    });
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: {} });

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('K8S_SYNC'));
    fireEvent.click(screen.getByText('K8S_SYNC'));
    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText(/No logs available for this stage/i)).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1);
    expect(pipecdApi.getDeployment).toHaveBeenCalledTimes(1);
  });

  it('reloads the deployment and its stages with the Refresh button', async () => {
    setupConfigured();
    // Pending, before piped has planned any stages.
    const pending: Deployment = {
      ...deploymentRunning,
      status: 'DEPLOYMENT_PENDING',
      stages: [],
    };
    vi.mocked(pipecdApi.getDeployment)
      .mockResolvedValueOnce(pending)
      .mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    expect(await screen.findByText(/no pipeline stages/i)).toBeTruthy();
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /Refresh/ }) as HTMLButtonElement).disabled).toBe(
        false
      )
    );

    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    expect(await screen.findByText('K8S_SYNC')).toBeTruthy();
    expect(screen.queryByText(/no pipeline stages/i)).toBeNull();
    expect(pipecdApi.getDeployment).toHaveBeenCalledTimes(2);
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2);
  });

  it('keeps the deployment and warns when a refresh fails', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment)
      .mockResolvedValueOnce(deploymentCompleted)
      .mockRejectedValue(new Error('network down'));
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    renderDetail();

    await findHeading();
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /Refresh/ }) as HTMLButtonElement).disabled).toBe(
        false
      )
    );
    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    expect(await screen.findByText('Could not refresh the deployment: network down')).toBeTruthy();
    expect(await findHeading()).toBeTruthy();
    expect(screen.queryByText(/Failed to load deployment/i)).toBeNull();
  });

  it('does not fetch the logs again for a stage whose logs are complete', async () => {
    setupConfigured();
    mockSuccess();

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText('Applying manifests...')).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1);
  });

  it('keeps the logs it has when fetching them again fails', async () => {
    setupConfigured();
    const partial = {
      'stage-k8s-sync': { ...stageLogsCompleted['stage-k8s-sync'], completed: false },
    };
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs)
      .mockResolvedValueOnce({ stageLogs: partial })
      .mockRejectedValue(new Error('network down'));

    renderDetail();

    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText('Failed to load logs: network down')).toBeTruthy();
    expect(screen.getByText('Applying manifests...')).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2);
  });

  it('does not send a second log request while one is still loading', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentRunning);
    vi.mocked(pipecdApi.listStageLogs).mockReturnValue(new Promise(() => {}));

    renderDetail();

    await findHeading();
    fireEvent.click(screen.getByText('K8S_SYNC'));
    fireEvent.click(screen.getByText('WAIT_APPROVAL'));

    expect(await screen.findByText('Loading logs…')).toBeTruthy();
    expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1);
  });

  it('drops logs that arrive for the previous deployment', async () => {
    setupConfigured();
    let resolveFirst: (value: { stageLogs: typeof stageLogsCompleted }) => void = () => {};
    vi.mocked(pipecdApi.getDeployment).mockResolvedValue(deploymentCompleted);
    vi.mocked(pipecdApi.listStageLogs)
      .mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)))
      .mockResolvedValue({ stageLogs: {} });

    const navigate = renderDetail('deploy-001');
    await findHeading();
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(1));

    navigate('deploy-002');
    await waitFor(() => expect(pipecdApi.listStageLogs).toHaveBeenCalledTimes(2));
    await act(async () => resolveFirst({ stageLogs: stageLogsCompleted }));

    fireEvent.click(screen.getByText('K8S_SYNC'));

    expect(await screen.findByText(/No logs available for this stage/i)).toBeTruthy();
    expect(screen.queryByText('Applying manifests...')).toBeNull();
  });

  it('does not show the previous deployment when the next one fails to load', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.getDeployment).mockImplementation(async (_config, id) => {
      if (id === 'deploy-001') return deploymentCompleted;
      throw new Error('deployment not found');
    });
    vi.mocked(pipecdApi.listStageLogs).mockResolvedValue({ stageLogs: stageLogsCompleted });

    const navigate = renderDetail('deploy-001');
    await findHeading();

    navigate('deploy-missing');

    await screen.findByText(/Failed to load deployment/i);
    expect(screen.queryByRole('heading', { name: 'feat: add dark mode support' })).toBeNull();
    expect(screen.queryByText('K8S_SYNC')).toBeNull();
  });
});
