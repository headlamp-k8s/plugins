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

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

const { listApplications, saveConfig, stored } = vi.hoisted(() => ({
  listApplications: vi.fn(),
  saveConfig: vi.fn(),
  stored: { config: { baseURL: '', apiKey: '' } },
}));

vi.mock('../api/pipecd', () => ({
  loadConfig: () => stored.config,
  saveConfig,
  isConfigured: (config: { baseURL: string; apiKey: string }) =>
    config.baseURL.length > 0 && config.apiKey.length > 0,
  listApplications,
}));

afterEach(() => {
  cleanup();
  listApplications.mockReset();
  saveConfig.mockReset();
  stored.config = { baseURL: '', apiKey: '' };
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
  it('explains that the API key must be re-entered after reloading Headlamp', () => {
    render(<SettingsPage />);

    expect(
      screen.getByText(
        'The API key is kept in memory only. Re-enter it after reloading or closing Headlamp.'
      )
    ).toBeTruthy();
  });

  it('reports a successful connection', async () => {
    listApplications.mockResolvedValue({ applications: [{}, {}], cursor: 'next' });
    render(<SettingsPage />);
    testConnection();

    expect(await screen.findByText('Connection successful.')).toBeTruthy();
  });

  it('asks for a single application when testing the connection', async () => {
    listApplications.mockResolvedValue({ applications: [], cursor: '' });
    render(<SettingsPage />);
    testConnection();

    await screen.findByText(/Connection successful/);
    expect(listApplications.mock.calls[0][1]).toEqual({ pageSize: 1 });
  });

  it('saves a loopback URL written without slashes in its full form', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'http:localhost:8080');
    fill('API Key', 'test-key');
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(saveConfig).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8080',
      apiKey: 'test-key',
    });
  });

  it('lets saved credentials be cleared', () => {
    stored.config = { baseURL: 'https://pipecd.example.com', apiKey: 'old-key' };
    render(<SettingsPage />);
    fill('PipeCD Server URL', '');
    fill('API Key', '');
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(saveConfig).toHaveBeenCalledWith({ baseURL: '', apiKey: '' });
  });

  it('lets the API key be cleared while keeping the saved server URL', () => {
    stored.config = { baseURL: 'https://pipecd.example.com', apiKey: 'old-key' };
    render(<SettingsPage />);
    fill('API Key', '');
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(saveConfig).toHaveBeenCalledWith({
      baseURL: 'https://pipecd.example.com',
      apiKey: '',
    });
  });

  it('shows the error when the connection fails', async () => {
    listApplications.mockRejectedValue(new Error('unreachable'));
    render(<SettingsPage />);
    testConnection();

    expect(await screen.findByText('Connection failed: unreachable')).toBeTruthy();
  });

  it('saves the normalized URL and the API key', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'https://pipecd.example.com/');
    fill('API Key', ' test-key\n');
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(saveConfig).toHaveBeenCalledWith({
      baseURL: 'https://pipecd.example.com',
      apiKey: 'test-key',
    });
  });

  it('flags a URL without a protocol', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'pipecd.example.com');

    expect(screen.getByText(/Use an https:\/\/ URL/)).toBeTruthy();
  });

  it('rejects plain http for a remote host so the API key is not sent in clear', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'http://pipecd.example.com');

    expect(screen.getByText(/Use an https:\/\/ URL/)).toBeTruthy();
  });

  it('allows plain http for localhost development', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'http://localhost:8080');

    expect(screen.queryByText(/Use an https:\/\/ URL/)).toBeNull();
  });

  it('keeps Test Connection disabled until URL and API key are both set', () => {
    render(<SettingsPage />);
    const button = screen.getByRole('button', { name: 'Test Connection' }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});
