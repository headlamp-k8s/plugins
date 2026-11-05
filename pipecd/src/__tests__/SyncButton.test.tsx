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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as pipecdApi from '../api/pipecd';
import { PipeCDApiError } from '../api/pipecd';
import { SyncButton } from '../components/SyncButton';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? '')),
  }),
}));

vi.mock('../api/pipecd', async importOriginal => {
  const original = await importOriginal<typeof import('../api/pipecd')>();
  return { ...original, syncApplication: vi.fn(), getCommand: vi.fn() };
});

const CONFIG = { baseURL: 'https://pipecd.example.com', apiKey: 'test-key' };

function renderButton(onSynced?: () => void): void {
  render(
    <SyncButton
      config={CONFIG}
      applicationId="app-k8s-001"
      applicationName="frontend-prod"
      onSynced={onSynced}
    />
  );
}

function command(status: string) {
  return {
    id: 'cmd-1',
    applicationId: 'app-k8s-001',
    deploymentId: 'deploy-1',
    status,
    handledAt: 0,
    createdAt: 0,
  } as never;
}

function confirmSync(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /^Sync$/ }));
}

describe('SyncButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.mocked(pipecdApi.syncApplication).mockReset();
    vi.mocked(pipecdApi.getCommand).mockReset();
  });

  it('does not sync until the action is confirmed', () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(pipecdApi.syncApplication).not.toHaveBeenCalled();
  });

  it('does not sync when the dialog is cancelled', () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(pipecdApi.syncApplication).not.toHaveBeenCalled();
  });

  it('sends the application id when confirmed', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_SUCCEEDED'));

    renderButton();
    confirmSync();

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.syncApplication).mock.calls[0][1]).toBe('app-k8s-001');
    });
  });

  it('reports success once the command succeeds', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_SUCCEEDED'));
    const onSynced = vi.fn();

    renderButton(onSynced);
    confirmSync();
    await vi.advanceTimersByTimeAsync(2500);

    expect(await screen.findByText(/Sync started for frontend-prod/i)).toBeTruthy();
    expect(onSynced).toHaveBeenCalled();
  });

  it('reports a failed command', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_FAILED'));

    renderButton();
    confirmSync();
    await vi.advanceTimersByTimeAsync(2500);

    expect(await screen.findByText(/could not start the sync/i)).toBeTruthy();
  });

  it('reports a command the piped never picked up', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_TIMEOUT'));

    renderButton();
    confirmSync();
    await vi.advanceTimersByTimeAsync(2500);

    expect(await screen.findByText(/did not pick up the sync in time/i)).toBeTruthy();
  });

  it('explains that a read-only key cannot sync', async () => {
    vi.mocked(pipecdApi.syncApplication).mockRejectedValue(
      new PipeCDApiError('permission denied', 7, 'permission denied')
    );

    renderButton();
    confirmSync();

    expect(await screen.findByText(/read-only.*READ_WRITE/i)).toBeTruthy();
  });

  it('sends AUTO when the main button is used', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_SUCCEEDED'));

    renderButton();
    confirmSync();

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.syncApplication).mock.calls[0][2]).toMatchObject({
        strategy: 'AUTO',
      });
    });
  });

  it.each([
    ['Quick Sync', 'QUICK_SYNC'],
    ['Pipeline Sync', 'PIPELINE'],
  ])('sends %s as %s', async (label, expected) => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_SUCCEEDED'));

    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /sync options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(label) }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^Sync$/ }));

    await waitFor(() => {
      expect(vi.mocked(pipecdApi.syncApplication).mock.calls[0][2]).toMatchObject({
        strategy: expected,
      });
    });
  });

  it('sends one sync when the confirm button is clicked twice', async () => {
    vi.mocked(pipecdApi.syncApplication).mockReturnValue(new Promise(() => {}));

    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: /^Sync$/ });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(pipecdApi.syncApplication).toHaveBeenCalledTimes(1);
    });
  });

  it('stays busy when Cancel is clicked while the dialog fades out', () => {
    vi.mocked(pipecdApi.syncApplication).mockReturnValue(new Promise(() => {}));

    renderButton();
    confirmSync();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i, hidden: true }));

    const busy = screen.getByRole('button', { name: /Syncing/, hidden: true });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps waiting when a status check fails', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand)
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValue(command('COMMAND_SUCCEEDED'));

    renderButton();
    confirmSync();
    await vi.advanceTimersByTimeAsync(4500);

    expect(await screen.findByText(/Sync started for frontend-prod/i)).toBeTruthy();
    expect(screen.queryByText(/network blip/i)).toBeNull();
  });

  it('reports a sync still queued at the deadline as info, not a failure', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    vi.mocked(pipecdApi.getCommand).mockResolvedValue(command('COMMAND_NOT_HANDLED_YET'));
    const onSynced = vi.fn();

    renderButton(onSynced);
    confirmSync();
    await vi.advanceTimersByTimeAsync(62000);

    expect(await screen.findByText(/sync is queued/i)).toBeTruthy();
    expect(screen.getByRole('alert').className).toContain('Info');
    expect(onSynced).toHaveBeenCalled();
  });

  it('stops a status check that hangs at the deadline and frees the buttons', async () => {
    vi.mocked(pipecdApi.syncApplication).mockResolvedValue('cmd-1');
    // A request that never answers until it is aborted.
    vi.mocked(pipecdApi.getCommand).mockImplementation(
      (_config, _id, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );

    renderButton();
    confirmSync();
    await vi.advanceTimersByTimeAsync(62000);

    expect(await screen.findByText(/sync is queued/i)).toBeTruthy();
    expect(screen.getByRole('alert').className).toContain('Info');
    expect(pipecdApi.getCommand).toHaveBeenCalledTimes(1);
    const button = screen.getByRole('button', { name: /^Sync$/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('stops a sync request that hangs and says the outcome is unknown', async () => {
    vi.mocked(pipecdApi.syncApplication).mockImplementation(
      (_config, _id, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const aborted = new Error('SyncApplication was cancelled');
            aborted.name = 'AbortError';
            reject(aborted);
          });
        })
    );
    const onSynced = vi.fn();

    renderButton(onSynced);
    confirmSync();
    await vi.advanceTimersByTimeAsync(31000);

    expect(await screen.findByText(/did not confirm the sync/i)).toBeTruthy();
    expect(screen.getByRole('alert').className).toContain('Info');
    expect(onSynced).toHaveBeenCalled();
    const button = screen.getByRole('button', { name: /^Sync$/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('does not report a lost reply as a failed sync', async () => {
    vi.mocked(pipecdApi.syncApplication).mockRejectedValue(
      new PipeCDApiError('unavailable', 14, 'upstream connect error')
    );

    renderButton();
    confirmSync();

    expect(await screen.findByText(/did not confirm the sync/i)).toBeTruthy();
    // Let the dialog finish closing, so the rest of the page is no longer hidden.
    await vi.advanceTimersByTimeAsync(500);
    expect(screen.getByRole('alert').className).toContain('Info');
  });

  it('reports a cancellation it did not ask for', async () => {
    const cancelled = new Error('SyncApplication was cancelled');
    cancelled.name = 'AbortError';
    vi.mocked(pipecdApi.syncApplication).mockRejectedValue(cancelled);

    renderButton();
    confirmSync();

    expect(await screen.findByText(/SyncApplication was cancelled/)).toBeTruthy();
  });

  it('blocks both buttons when disabled', () => {
    render(
      <SyncButton
        config={CONFIG}
        applicationId="app-k8s-001"
        applicationName="frontend-prod"
        disabled
      />
    );

    const sync = screen.getByRole('button', { name: /^Sync$/ }) as HTMLButtonElement;
    const options = screen.getByRole('button', { name: /sync options/i }) as HTMLButtonElement;
    expect(sync.disabled).toBe(true);
    expect(options.disabled).toBe(true);
  });

  it('warns about the server version only for a chosen strategy', () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: /^Sync$/ }));
    expect(screen.queryByText(/newer than v0\.58\.0/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    fireEvent.click(screen.getByRole('button', { name: /sync options/i, hidden: true }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Pipeline Sync/ }));
    expect(screen.getByText(/newer than v0\.58\.0/)).toBeTruthy();
  });

  it('surfaces any other API failure', async () => {
    vi.mocked(pipecdApi.syncApplication).mockRejectedValue(new Error('server unavailable'));

    renderButton();
    confirmSync();

    expect(await screen.findByText(/server unavailable/i)).toBeTruthy();
  });
});
