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
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: (props: {
    description: string;
    longDescription?: string;
    icon: string;
    onClick: () => void;
    iconButtonProps?: { disabled?: boolean };
  }) => (
    <button
      aria-label={props.description}
      data-icon={props.icon}
      data-long-description={props.longDescription}
      disabled={props.iconButtonProps?.disabled}
      onClick={props.onClick}
    />
  ),
  Dialog: (props: { open: boolean; title: string; children: ReactNode }) =>
    props.open ? (
      <div role="dialog" aria-label={props.title}>
        {props.children}
      </div>
    ) : null,
}));

import type { ArgoApplication, RevisionHistory } from '../../resources/application';
import { RollbackAction, type RollbackOperationController } from './rollback';

const source = { repoURL: 'https://github.com/example/apps.git', path: 'guestbook' };
const previous: RevisionHistory = {
  id: 4,
  revision: '0123456789abcdef0123456789abcdef01234567',
  source,
  deployedAt: '2025-01-02T03:04:05Z',
};

function application(entries: RevisionHistory[] = [previous]) {
  return {
    metadata: { name: 'guestbook', namespace: 'argocd' },
    rollbackHistory: entries,
    syncPolicy: { syncOptions: ['CreateNamespace=true'] },
  } as ArgoApplication;
}

function controller(options?: { succeeds?: boolean; isLoading?: boolean }) {
  return {
    execute: vi.fn().mockResolvedValue(options?.succeeds ?? true),
    isLoading: options?.isLoading ?? false,
  } satisfies RollbackOperationController;
}

afterEach(cleanup);

describe('RollbackAction', () => {
  it('opens with no preselected deployment and shows the full revision and deployment time', () => {
    const operation = controller();
    render(<RollbackAction application={application()} operation={operation} />);

    const action = screen.getByRole('button', { name: 'Rollback' });
    expect(action.getAttribute('data-icon')).toBe('mdi:backup-restore');
    expect(action.getAttribute('data-long-description')).toMatch(/without changing/i);
    fireEvent.click(action);

    expect(screen.getByRole('dialog', { name: 'Rollback Application' })).toBeTruthy();
    expect(screen.getByText(previous.revision as string)).toBeTruthy();
    expect(screen.getByText(/Source: guestbook/)).toBeTruthy();
    expect(screen.getAllByTitle(previous.deployedAt as string).length).toBeGreaterThan(0);
    expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(false);
    expect(
      (screen.getAllByRole('button', { name: 'Rollback' })[1] as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('cancels without sending a rollback request', () => {
    const operation = controller();
    render(<RollbackAction application={application()} operation={operation} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(operation.execute).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('confirms the selected single-source history entry and closes on success', async () => {
    const operation = controller();
    render(<RollbackAction application={application()} operation={operation} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    fireEvent.click(screen.getByRole('radio'));
    expect(screen.getByLabelText('Selected deployment').textContent).toContain('History ID 4');
    fireEvent.click(screen.getAllByRole('button', { name: 'Rollback' })[1]);

    await waitFor(() =>
      expect(operation.execute).toHaveBeenCalledWith('guestbook', 'argocd', previous, [
        'CreateNamespace=true',
      ])
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the dialog open when the request fails', async () => {
    const operation = controller({ succeeds: false });
    render(<RollbackAction application={application()} operation={operation} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    fireEvent.click(screen.getByRole('radio'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Rollback' })[1]);

    await waitFor(() => expect(operation.execute).toHaveBeenCalledOnce());
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows every aligned revision for a multi-source deployment', () => {
    const multiSource: RevisionHistory = {
      id: 2,
      revisions: ['app-revision', 'values-revision'],
      sources: [source, { repoURL: 'https://github.com/example/values.git', ref: 'values' }],
      deployedAt: '2025-01-01T00:00:00Z',
    };
    render(<RollbackAction application={application([multiSource])} operation={controller()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    expect(screen.getByText('app-revision')).toBeTruthy();
    expect(screen.getByText('values-revision')).toBeTruthy();
    expect(screen.getByText(/Source 2.*values\.git/)).toBeTruthy();
  });

  it('disables the action and submission while another operation is active', () => {
    const operation = controller({ isLoading: true });
    const { rerender } = render(
      <RollbackAction application={application()} operation={operation} disabled />
    );

    expect(
      (screen.getByRole('button', { name: 'Rolling back...' }) as HTMLButtonElement).disabled
    ).toBe(true);

    rerender(<RollbackAction application={application()} operation={controller()} disabled />);
    expect((screen.getByRole('button', { name: 'Rollback' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
