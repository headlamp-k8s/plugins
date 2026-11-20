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

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../components/SettingsPage';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

const { listApplications, loadConfig } = vi.hoisted(() => ({
  listApplications: vi.fn(),
  loadConfig: vi.fn(() => ({ baseURL: '', apiKey: '' })),
}));

vi.mock('../api/pipecd', () => ({
  loadConfig,
  saveConfig: vi.fn(),
  isConfigured: (config: { baseURL: string; apiKey: string }) =>
    config.baseURL.length > 0 && config.apiKey.length > 0,
  listApplications,
}));

afterEach(() => {
  cleanup();
  listApplications.mockReset();
  loadConfig.mockReset();
  loadConfig.mockReturnValue({ baseURL: '', apiKey: '' });
});

function fill(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid(): void {
  fill('PipeCD Server URL', 'https://pipecd.example.com');
  fill('API Key', 'test-key');
}

function button(name: string | RegExp): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

/** A listApplications call that stays pending until the test settles it. */
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SettingsPage connection test', () => {
  it('prefills the fields from the saved configuration', () => {
    loadConfig.mockReturnValue({ baseURL: 'https://saved.example.com', apiKey: 'saved-key' });

    render(<SettingsPage />);

    expect((screen.getByLabelText('PipeCD Server URL') as HTMLInputElement).value).toBe(
      'https://saved.example.com'
    );
    expect((screen.getByLabelText('API Key') as HTMLInputElement).value).toBe('saved-key');
  });

  it('hides the API key as it is typed', () => {
    render(<SettingsPage />);

    expect((screen.getByLabelText('API Key') as HTMLInputElement).type).toBe('password');
  });

  it('tests the values in the form, not the saved ones', async () => {
    listApplications.mockResolvedValue({ applications: [], cursor: '' });
    render(<SettingsPage />);
    fillValid();

    fireEvent.click(button('Test Connection'));
    await screen.findByText(/Connection successful/);

    expect(listApplications).toHaveBeenCalledWith(
      { baseURL: 'https://pipecd.example.com', apiKey: 'test-key' },
      { pageSize: 1 }
    );
  });

  it('shows Testing… and disables the button while the request runs', async () => {
    const pending = deferred();
    listApplications.mockReturnValue(pending.promise);
    render(<SettingsPage />);
    fillValid();

    fireEvent.click(button('Test Connection'));

    expect(button(/Testing/).disabled).toBe(true);

    await act(async () => pending.resolve({ applications: [], cursor: '' }));
    expect(button('Test Connection').disabled).toBe(false);
  });

  it('reports success when the server sends no application list', async () => {
    listApplications.mockResolvedValue({ cursor: '' });
    render(<SettingsPage />);
    fillValid();

    fireEvent.click(button('Test Connection'));

    expect(await screen.findByText('Connection successful.')).toBeTruthy();
  });

  it('shows a thrown non-Error value as the failure reason', async () => {
    listApplications.mockRejectedValue('gateway timeout');
    render(<SettingsPage />);
    fillValid();

    fireEvent.click(button('Test Connection'));

    expect(await screen.findByText('Connection failed: gateway timeout')).toBeTruthy();
  });

  it('clears the old result when the URL is edited', async () => {
    listApplications.mockResolvedValue({ applications: [], cursor: '' });
    render(<SettingsPage />);
    fillValid();
    fireEvent.click(button('Test Connection'));
    await screen.findByText(/Connection successful/);

    fill('PipeCD Server URL', 'https://other.example.com');

    expect(screen.queryByText(/Connection successful/)).toBeNull();
  });

  it('clears the old result when the API key is edited', async () => {
    listApplications.mockRejectedValue(new Error('unauthenticated'));
    render(<SettingsPage />);
    fillValid();
    fireEvent.click(button('Test Connection'));
    await screen.findByText(/Connection failed/);

    fill('API Key', 'another-key');

    expect(screen.queryByText(/Connection failed/)).toBeNull();
  });

  // The fields stay editable during the request. A result for the old values
  // must not be shown against the new ones.
  it('drops a success that arrives after the fields changed', async () => {
    const pending = deferred();
    listApplications.mockReturnValue(pending.promise);
    render(<SettingsPage />);
    fillValid();
    fireEvent.click(button('Test Connection'));

    fill('API Key', 'changed-key');
    await act(async () => pending.resolve({ applications: [{}, {}], cursor: '' }));

    expect(screen.queryByText(/Connection successful/)).toBeNull();
    expect(button('Test Connection').disabled).toBe(false);
  });

  it('drops a failure that arrives after the fields changed', async () => {
    const pending = deferred();
    listApplications.mockReturnValue(pending.promise);
    render(<SettingsPage />);
    fillValid();
    fireEvent.click(button('Test Connection'));

    fill('PipeCD Server URL', 'https://fixed.example.com');
    await act(async () => pending.reject(new Error('wrong host')));

    expect(screen.queryByText(/Connection failed/)).toBeNull();
  });

  it('keeps Save disabled until something has changed', () => {
    loadConfig.mockReturnValue({ baseURL: 'https://saved.example.com', apiKey: 'saved-key' });
    render(<SettingsPage />);

    expect(button('Save Settings').disabled).toBe(true);

    fill('API Key', 'new-key');

    expect(button('Save Settings').disabled).toBe(false);
  });

  it('keeps both buttons disabled while the URL is invalid', () => {
    render(<SettingsPage />);
    fill('PipeCD Server URL', 'http://pipecd.example.com');
    fill('API Key', 'test-key');

    expect(button('Save Settings').disabled).toBe(true);
    expect(button('Test Connection').disabled).toBe(true);
  });

  it.each(['ftp://pipecd.example.com', 'javascript:alert(1)'])(
    'rejects a URL with a non-web scheme: %s',
    url => {
      render(<SettingsPage />);
      fill('PipeCD Server URL', url);

      expect(screen.getByText(/Use an https:\/\/ URL/)).toBeTruthy();
    }
  );

  it.each(['http://127.0.0.1:8080', 'http://[::1]:8080'])(
    'allows plain http for the loopback address %s',
    url => {
      render(<SettingsPage />);
      fill('PipeCD Server URL', url);

      expect(screen.queryByText(/Use an https:\/\/ URL/)).toBeNull();
    }
  );

  it('does not flag an empty URL as invalid', () => {
    render(<SettingsPage />);

    expect(screen.queryByText(/Use an https:\/\/ URL/)).toBeNull();
  });
});
