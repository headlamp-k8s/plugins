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
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { ApplicationList } from '../components/ApplicationList';
import { appTerraformOutOfSync, mockListResponse } from './fixtures';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('../api/pipecd', async importOriginal => {
  const original = await importOriginal<typeof import('../api/pipecd')>();
  return { ...original, listApplications: vi.fn() };
});

function setupConfigured(): void {
  localStorage.setItem('pipecd-plugin-base-url', 'https://pipecd.example.com');
  localStorage.setItem('pipecd-plugin-api-key', 'test-key-xyz');
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
  });

  afterEach(() => {
    cleanup();
    vi.mocked(pipecdApi.listApplications).mockReset();
  });

  it('shows NotConfigured when no API key in localStorage', () => {
    render(<ApplicationList />);

    expect(screen.getByText(/PipeCD Not Configured/i)).toBeTruthy();
    expect(screen.getByText(/Configure PipeCD/i)).toBeTruthy();
    expect(pipecdApi.listApplications).not.toHaveBeenCalled();
  });

  it('shows loading skeleton while fetch is in progress', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockImplementation(() => new Promise(() => {}));

    render(<ApplicationList />);

    expect(await screen.findByLabelText('loading-skeleton')).toBeTruthy();
  });

  it('renders all three applications from mock data', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);

    expect(await screen.findByText('frontend-prod')).toBeTruthy();
    expect(await screen.findByText('infra-staging')).toBeTruthy();
    expect(await screen.findByText('api-service-prod')).toBeTruthy();
  });

  it('shows a status label for each sync state', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    expect(screen.getByText('Synced')).toBeTruthy();
    expect(screen.getByText('Out of Sync')).toBeTruthy();
    expect(screen.getByText('Deploying')).toBeTruthy();
  });

  it('shows platform kind badges', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    expect(screen.getByText('Kubernetes')).toBeTruthy();
    expect(screen.getByText('Terraform')).toBeTruthy();
    expect(screen.getByText('Cloud Run')).toBeTruthy();
  });

  it('shows Git repository path for each app', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    expect(screen.getByText('github.com/myorg/frontend')).toBeTruthy();
    expect(screen.getByText('github.com/myorg/infra')).toBeTruthy();
  });

  it('shows deployment summary as caption under last synced time', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    expect(screen.getByText(/feat: add dark mode support/i)).toBeTruthy();
  });

  it('links each application to PipeCD in a new tab', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    const links = screen.getAllByRole('link', { name: 'Open in PipeCD' });
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe(
      'https://pipecd.example.com/applications/app-k8s-001'
    );
    expect(links[0].getAttribute('target')).toBe('_blank');
  });

  it('filters applications by search text (name match)', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByPlaceholderText(/Search by name or repo/i), 'frontend');

    expect(screen.getByText('frontend-prod')).toBeTruthy();
    expect(screen.queryByText('infra-staging')).toBeNull();
    expect(screen.queryByText('api-service-prod')).toBeNull();
  });

  it('filters applications by repository name', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByPlaceholderText(/Search by name or repo/i), 'myorg/infra');

    expect(screen.queryByText('frontend-prod')).toBeNull();
    expect(screen.getByText('infra-staging')).toBeTruthy();
  });

  it('shows empty state message when search matches nothing', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    await userEvent.type(screen.getByPlaceholderText(/Search by name or repo/i), 'xyznonexistent');

    expect(screen.getByText(/No applications match the current filter/i)).toBeTruthy();
  });

  it('re-fetches with kind filter when dropdown changes', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications)
      .mockResolvedValueOnce(mockListResponse)
      .mockResolvedValueOnce({ applications: [appTerraformOutOfSync], cursor: '' });

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    fireEvent.mouseDown(screen.getByLabelText('Platform'));
    fireEvent.click(await screen.findByRole('option', { name: 'TERRAFORM' }));

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.listApplications)).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'test-key-xyz' }),
        expect.objectContaining({ kind: 'TERRAFORM' })
      );
    });
  });

  it('shows error alert when API call fails', async () => {
    setupConfigured();
    mockListFailure('PipeCD server is unavailable');

    render(<ApplicationList />);

    await screen.findByText(/Failed to load applications/i);
    expect(screen.getByText(/PipeCD server is unavailable/i)).toBeTruthy();
  });

  it('dismisses error alert when close button clicked', async () => {
    setupConfigured();
    mockListFailure('connection refused');

    render(<ApplicationList />);

    await screen.findByText(/Failed to load applications/i);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Failed to load applications/i)).toBeNull();
    });
  });

  it('shows empty state when API returns zero applications', async () => {
    setupConfigured();
    vi.mocked(pipecdApi.listApplications).mockResolvedValue({ applications: [], cursor: '' });

    render(<ApplicationList />);

    await screen.findByText(/No PipeCD applications found/i);
    expect(
      screen.getByText(/Make sure your PipeCD project has at least one application/i)
    ).toBeTruthy();
  });

  it('calls listApplications again when Refresh is clicked', async () => {
    setupConfigured();
    mockListSuccess();

    render(<ApplicationList />);
    await screen.findByText('frontend-prod');

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.listApplications)).toHaveBeenCalledTimes(2);
    });
  });
});
