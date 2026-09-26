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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../components/SettingsPage';

const { listApplications } = vi.hoisted(() => ({ listApplications: vi.fn() }));

vi.mock('../api/pipecd', () => ({
  loadConfig: () => ({ baseURL: '', apiKey: '' }),
  saveConfig: vi.fn(),
  isConfigured: (config: { baseURL: string; apiKey: string }) =>
    config.baseURL.length > 0 && config.apiKey.length > 0,
  listApplications,
}));

afterEach(() => {
  cleanup();
  listApplications.mockReset();
});

function fill(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function testConnection(): void {
  fill('PipeCD Server URL', 'https://pipecd.example.com');
  fill('API Key', 'test-key');
  fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));
}

describe('SettingsPage', () => {
  it('reports the actual number of applications returned', async () => {
    listApplications.mockResolvedValue({ applications: [{}, {}], cursor: '' });
    render(<SettingsPage />);
    testConnection();

    expect(
      await screen.findByText('Connection successful — 2 application(s) returned.')
    ).toBeTruthy();
  });

  it('does not limit the connection test to a single application', async () => {
    listApplications.mockResolvedValue({ applications: [], cursor: '' });
    render(<SettingsPage />);
    testConnection();

    await screen.findByText(/Connection successful/);
    expect(listApplications.mock.calls[0][1]).toBeUndefined();
  });

  it('shows the error when the connection fails', async () => {
    listApplications.mockRejectedValue(new Error('unreachable'));
    render(<SettingsPage />);
    testConnection();

    expect(await screen.findByText('Connection failed: unreachable')).toBeTruthy();
  });

  it('flags a URL without a protocol', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'pipecd.example.com');

    expect(screen.getByText('URL must start with https:// or http://')).toBeTruthy();
  });

  it('keeps Test Connection disabled until URL and API key are both set', () => {
    render(<SettingsPage />);
    const button = screen.getByRole('button', { name: 'Test Connection' }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});
