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
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ActionButton: ({ description }: { description: string }) => <button>{description}</button>,
  AuthVisible: ({ children }: { children: ReactNode }) => children,
  DateLabel: () => null,
  DetailsGrid: (props: {
    actions: (application: unknown) => Array<{ id: string; action: ReactNode }>;
  }) => (
    <div>
      {props.actions({ metadata: { name: 'guestbook', namespace: 'argocd' } }).map(entry => (
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
  syncApplication: vi.fn(),
}));

vi.mock('../../hooks/useArgoOperation', () => ({
  useArgoOperation: () => ({ execute: vi.fn(), isLoading: false }),
}));

vi.mock('../../resources/application', () => ({
  ArgoApplication: class ArgoApplication {},
}));

vi.mock('./managedResourceLinks', () => ({
  getManagedResourceLink: vi.fn(),
}));

vi.mock('./openInArgoCD', () => ({
  OpenInArgoCDAction: () => <button>Open in Argo CD</button>,
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

describe('ApplicationDetail actions', () => {
  it('keeps Sync and Refresh alongside the Open in Argo CD action', () => {
    render(<ApplicationDetail />);

    expect(screen.getByTestId('argocd-sync')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeTruthy();
    expect(screen.getByTestId('argocd-refresh')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByTestId('argocd-open-external')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open in Argo CD' })).toBeTruthy();
  });
});
