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

import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import ReleaseList from './List';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DateLabel: () => null,
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  SectionBox: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SectionFilterHeader: ({ title, actions }: { title: string; actions: ReactNode[] }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  SimpleTable: ({ data }: { data: { name: string }[] | null }) => (
    <ul>
      {data?.map(item => (
        <li key={item.name}>{item.name}</li>
      ))}
    </ul>
  ),
  StatusLabel: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../../api/charts', () => ({
  fetchLatestAppVersion: vi.fn().mockResolvedValue('1.0.0'),
}));

vi.mock('../../api/releases', () => ({
  deleteRelease: vi.fn(),
  getActionStatus: vi.fn(),
  getReleaseHistory: vi.fn(),
  listReleases: vi.fn(),
  rollbackRelease: vi.fn(),
}));

// Dialogs and toolbars are not involved in filtering.
vi.mock('./BulkActionsToolbar', () => ({ BulkActionsToolbar: () => null }));
vi.mock('./BulkDeleteDialog', () => ({ BulkDeleteDialog: () => null }));
vi.mock('./DeleteConfirmDialog', () => ({ DeleteConfirmDialog: () => null }));
vi.mock('./EditorDialog', () => ({ EditorDialog: () => null }));
vi.mock('./RollbackDialog', () => ({ RollbackDialog: () => null }));

/** Builds a minimal release in the given namespace. */
function makeRelease(name: string, namespace: string) {
  return {
    name,
    namespace,
    version: 1,
    chart: { metadata: { name: `${name}-chart`, version: '1.0.0', appVersion: '1.0.0' } },
    info: { status: 'deployed', last_deployed: '2023-10-23T12:00:00Z' },
  };
}

const releases = [
  makeRelease('rel-a', 'ns-a'),
  makeRelease('rel-b', 'ns-b'),
  makeRelease('rel-c', 'ns-c'),
];

/** Mirrors the shape of Headlamp's `filter` slice, with an action to set the namespaces. */
function makeStore(initialNamespaces: string[] = []) {
  return configureStore({
    reducer: {
      filter: (
        state = { namespaces: new Set<string>(initialNamespaces) },
        action: { type: string; payload?: string[] }
      ) =>
        action.type === 'filter/setNamespaces'
          ? { ...state, namespaces: new Set(action.payload) }
          : state,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
  });
}

/** Renders the list with the fixture releases and waits for them to load. */
async function renderList(store: ReturnType<typeof makeStore>) {
  render(
    <Provider store={store}>
      <ReleaseList fetchReleases={() => Promise.resolve({ releases })} />
    </Provider>
  );
  await screen.findByRole('list');
}

/** Returns the release names currently displayed in the table. */
function visibleReleases() {
  return screen.queryAllByRole('listitem').map(item => item.textContent);
}

describe('ReleaseList namespace filter', () => {
  it('shows all releases when no namespace is selected', async () => {
    await renderList(makeStore());

    expect(await screen.findByText('rel-a')).toBeTruthy();
    expect(visibleReleases()).toEqual(['rel-a', 'rel-b', 'rel-c']);
  });

  it('applies the namespaces selected in the store on mount', async () => {
    await renderList(makeStore(['ns-c']));

    expect(await screen.findByText('rel-c')).toBeTruthy();
    expect(visibleReleases()).toEqual(['rel-c']);
  });

  it('filters by multiple namespaces and shows all again once cleared', async () => {
    const store = makeStore();
    await renderList(store);
    await screen.findByText('rel-a');

    act(() => {
      store.dispatch({ type: 'filter/setNamespaces', payload: ['ns-a', 'ns-b'] });
    });
    expect(visibleReleases()).toEqual(['rel-a', 'rel-b']);

    act(() => {
      store.dispatch({ type: 'filter/setNamespaces', payload: [] });
    });
    expect(visibleReleases()).toEqual(['rel-a', 'rel-b', 'rel-c']);
  });
});
