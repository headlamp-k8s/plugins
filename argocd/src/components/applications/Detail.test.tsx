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

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { application } = vi.hoisted(() => ({
  application: {
    metadata: { name: 'guestbook', namespace: 'argocd' },
    isAutomatedSyncEnabled: false,
    rollbackHistory: [{ id: 1 }],
    hasActiveOperation: false,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: ({ description }: { description: string }) => <button>{description}</button>,
  AuthVisible: ({ children, authVerb }: { children: ReactNode; authVerb: string }) => (
    <div data-auth-verb={authVerb}>{children}</div>
  ),
  DateLabel: () => null,
  DetailsGrid: (props: {
    actions: (application: unknown) => Array<{ id: string; action: ReactNode }>;
  }) => (
    <div>
      {props.actions(application).map(entry => (
        <div data-testid={entry.id} key={entry.id}>
          {entry.action}
        </div>
      ))}
    </div>
  ),
  NameValueTable: () => null,
  SectionBox: () => null,
  SimpleTable: () => null,
  StatusLabel: () => null,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ConditionsTable: () => null,
}));

vi.mock('../../api/argoClient', () => ({
  refreshApplication: vi.fn(),
  rollbackApplication: vi.fn(),
  syncApplication: vi.fn(),
}));

vi.mock('../../hooks/useArgoOperation', () => ({
  useArgoOperation: () => ({ execute: vi.fn(), isLoading: false }),
}));

vi.mock('../../resources/application', () => ({
  ArgoApplication: class ArgoApplication {},
}));

vi.mock('./apiAvailability', () => ({
  canOpenManagedResourcesInCurrentCluster: () => true,
  getApiAvailabilityPresentation: () => ({ label: 'Available', status: 'success', tooltip: '' }),
  managedResourceApiKey: () => 'resource',
  useManagedResourceApiAvailability: () => ({ availability: new Map(), loading: false }),
}));

vi.mock('./managedResourceLinks', () => ({
  getManagedResourceLink: vi.fn(),
}));

vi.mock('./openInArgoCD', () => ({
  OpenInArgoCDAction: () => <button>Open in Argo CD</button>,
}));

vi.mock('./rollback', () => ({
  RollbackAction: ({ disabled }: { disabled: boolean }) => (
    <button disabled={disabled}>Rollback</button>
  ),
}));

vi.mock('./statusHelpers', () => ({
  getHealthIcon: vi.fn(),
  getHealthStatus: vi.fn(),
  getSyncIcon: vi.fn(),
  getSyncStatus: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ namespace: 'argocd', name: 'guestbook' }),
}));

import ApplicationDetail from './Detail';

afterEach(cleanup);

beforeEach(() => {
  application.isAutomatedSyncEnabled = false;
  application.rollbackHistory = [{ id: 1 }];
  application.hasActiveOperation = false;
});

describe('ApplicationDetail actions', () => {
  it('keeps Sync, Refresh, and Open in Argo CD alongside the RBAC-protected Rollback action', () => {
    render(<ApplicationDetail />);

    expect(screen.getByTestId('argocd-sync')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeTruthy();
    expect(screen.getByTestId('argocd-refresh')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByTestId('argocd-rollback')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rollback' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Rollback' }).parentElement?.getAttribute('data-auth-verb')
    ).toBe('patch');
    expect(screen.getByTestId('argocd-open-external')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open in Argo CD' })).toBeTruthy();
  });

  it('hides Rollback when history has no usable earlier deployment', () => {
    application.rollbackHistory = [];
    render(<ApplicationDetail />);

    expect(screen.queryByTestId('argocd-rollback')).toBeNull();
  });

  it('hides Rollback while automated sync is enabled', () => {
    application.isAutomatedSyncEnabled = true;
    render(<ApplicationDetail />);

    expect(screen.queryByTestId('argocd-rollback')).toBeNull();
  });

  it('disables Rollback when Argo CD already has an active operation', () => {
    application.hasActiveOperation = true;
    render(<ApplicationDetail />);

    expect((screen.getByRole('button', { name: 'Rollback' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
