import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReleaseList from './List';

const { mockGetAllowedNamespaces, mockUseNamespaceList, mockEnqueueSnackbar } = vi.hoisted(() => ({
  mockGetAllowedNamespaces: vi.fn<() => string[]>(() => []),
  mockUseNamespaceList: vi.fn<() => [{ metadata: { name: string } }[] | null, unknown]>(() => [
    null,
    null,
  ]),
  mockEnqueueSnackbar: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    useCluster: () => 'test-cluster',
    cluster: {
      getAllowedNamespaces: mockGetAllowedNamespaces,
    },
    ResourceClasses: {
      Namespace: {
        useList: mockUseNamespaceList,
      },
    },
  },
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  DateLabel: ({ date }: { date: number }) => <span>{String(date)}</span>,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SectionBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SectionHeader: ({ title, actions }: { title: string; actions?: React.ReactNode[] }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  SimpleTable: ({ data }: { data: Array<{ name: string; namespace: string }> | null }) => (
    <div data-testid="releases-table">
      {data?.map(item => (
        <div key={`${item.namespace}/${item.name}`}>{`${item.namespace}/${item.name}`}</div>
      ))}
    </div>
  ),
  StatusLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
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

vi.mock('./BulkActionsToolbar', () => ({ BulkActionsToolbar: () => null }));
vi.mock('./BulkDeleteDialog', () => ({ BulkDeleteDialog: () => null }));
vi.mock('./DeleteConfirmDialog', () => ({ DeleteConfirmDialog: () => null }));
vi.mock('./EditorDialog', () => ({ EditorDialog: () => null }));
vi.mock('./ReleaseActionsMenu', () => ({ ReleaseActionsMenu: () => null }));
vi.mock('./RollbackDialog', () => ({ RollbackDialog: () => null }));

function makeRelease(name: string, namespace: string) {
  return {
    name,
    namespace,
    version: 1,
    chart: {
      metadata: {
        name: `${name}-chart`,
        version: '1.0.0',
        appVersion: '1.0.0',
      },
    },
    info: {
      status: 'deployed',
      last_deployed: '2026-01-01T00:00:00Z',
    },
  };
}

function renderReleaseList(
  fetchReleases: (namespace?: string) => Promise<{ releases?: ReturnType<typeof makeRelease>[] }>,
  globalNamespaces: string[] = []
) {
  const store = configureStore({
    reducer: (
      state = {
        filter: {
          namespaces: new Set(globalNamespaces),
        },
      }
    ) => state,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

  return render(
    <Provider store={store}>
      <ReleaseList fetchReleases={fetchReleases} />
    </Provider>
  );
}

describe('ReleaseList namespace scoping', () => {
  beforeEach(() => {
    mockGetAllowedNamespaces.mockReset();
    mockGetAllowedNamespaces.mockReturnValue([]);
    mockUseNamespaceList.mockReset();
    mockUseNamespaceList.mockReturnValue([null, null]);
    mockEnqueueSnackbar.mockReset();
  });

  it('queries only the configured allowed namespace without making a cluster-wide request', async () => {
    mockGetAllowedNamespaces.mockReturnValue(['team-a']);
    const fetchReleases = vi.fn().mockResolvedValue({
      releases: [makeRelease('api', 'team-a')],
    });

    renderReleaseList(fetchReleases);

    await waitFor(() => {
      expect(screen.getByText('team-a/api')).toBeTruthy();
    });
    expect(fetchReleases).toHaveBeenCalledTimes(1);
    expect(fetchReleases).toHaveBeenCalledWith('team-a');
  });

  it('queries each configured allowed namespace and merges results', async () => {
    mockGetAllowedNamespaces.mockReturnValue(['team-b', 'team-a']);
    const fetchReleases = vi.fn().mockImplementation((namespace?: string) => {
      if (namespace === 'team-a') {
        return Promise.resolve({ releases: [makeRelease('api', 'team-a')] });
      }
      if (namespace === 'team-b') {
        return Promise.resolve({ releases: [makeRelease('web', 'team-b')] });
      }
      return Promise.reject(new Error('unexpected unscoped call'));
    });

    renderReleaseList(fetchReleases);

    await waitFor(() => {
      expect(screen.getByText('team-a/api')).toBeTruthy();
      expect(screen.getByText('team-b/web')).toBeTruthy();
    });
    expect(fetchReleases).toHaveBeenCalledTimes(2);
    expect(fetchReleases).toHaveBeenCalledWith('team-a');
    expect(fetchReleases).toHaveBeenCalledWith('team-b');
    expect(fetchReleases).not.toHaveBeenCalledWith();
  });

  it('displays releases from permitted namespaces even when another namespace fails', async () => {
    mockGetAllowedNamespaces.mockReturnValue(['team-a', 'team-b']);
    const fetchReleases = vi.fn().mockImplementation((namespace?: string) => {
      if (namespace === 'team-a') {
        return Promise.resolve({ releases: [makeRelease('api', 'team-a')] });
      }
      return Promise.reject(new Error('403 Forbidden'));
    });

    renderReleaseList(fetchReleases);

    await waitFor(() => {
      expect(screen.getByText('team-a/api')).toBeTruthy();
    });
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Failed to load releases for namespace(s): team-b',
      { variant: 'warning' }
    );
  });

  it('queries only the intersection of global namespace filter and allowed namespaces', async () => {
    mockGetAllowedNamespaces.mockReturnValue(['team-a', 'team-b']);
    const fetchReleases = vi.fn().mockResolvedValue({
      releases: [makeRelease('api', 'team-a')],
    });

    renderReleaseList(fetchReleases, ['team-a', 'forbidden-ns']);

    await waitFor(() => {
      expect(screen.getByText('team-a/api')).toBeTruthy();
    });
    expect(fetchReleases).toHaveBeenCalledTimes(1);
    expect(fetchReleases).toHaveBeenCalledWith('team-a');
  });

  it('scopes the API request when a namespace is selected in the UI dropdown', async () => {
    mockUseNamespaceList.mockReturnValue([
      [{ metadata: { name: 'team-a' } }, { metadata: { name: 'team-b' } }],
      null,
    ]);
    const fetchReleases = vi.fn().mockImplementation((namespace?: string) => {
      if (namespace === 'team-b') {
        return Promise.resolve({ releases: [makeRelease('web', 'team-b')] });
      }
      return Promise.resolve({
        releases: [makeRelease('api', 'team-a'), makeRelease('web', 'team-b')],
      });
    });

    renderReleaseList(fetchReleases);

    await waitFor(() => {
      expect(fetchReleases).toHaveBeenCalledWith();
    });

    const namespaceInput = screen.getByLabelText('Namespace');
    fireEvent.mouseDown(namespaceInput);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('team-b'));

    await waitFor(() => {
      expect(fetchReleases).toHaveBeenCalledWith('team-b');
    });
  });

  it('retains all globally selected namespaces in the dropdown after selecting one of them when cluster namespace listing is unavailable', async () => {
    mockUseNamespaceList.mockReturnValue([null, null]);
    mockGetAllowedNamespaces.mockReturnValue([]);

    const fetchReleases = vi.fn().mockImplementation((namespace?: string) => {
      if (namespace === 'team-a') {
        return Promise.resolve({ releases: [makeRelease('api', 'team-a')] });
      }
      if (namespace === 'team-b') {
        return Promise.resolve({ releases: [makeRelease('web', 'team-b')] });
      }
      return Promise.resolve({ releases: [] });
    });

    renderReleaseList(fetchReleases, ['team-a', 'team-b']);

    await waitFor(() => {
      expect(screen.getByText('team-a/api')).toBeTruthy();
      expect(screen.getByText('team-b/web')).toBeTruthy();
    });

    const namespaceInput = screen.getByLabelText('Namespace');
    fireEvent.mouseDown(namespaceInput);
    let listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('team-a'));

    await waitFor(() => {
      expect(fetchReleases).toHaveBeenCalledWith('team-a');
    });

    // Reopen the dropdown to confirm team-b is still present even though only team-a releases are loaded
    fireEvent.mouseDown(namespaceInput);
    listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('team-b')).toBeTruthy();
  });

  it('falls back to an unscoped request when no namespace filter or allowedNamespaces is set', async () => {
    const fetchReleases = vi.fn().mockResolvedValue({
      releases: [makeRelease('api', 'default')],
    });

    renderReleaseList(fetchReleases);

    await waitFor(() => {
      expect(screen.getByText('default/api')).toBeTruthy();
    });
    expect(fetchReleases).toHaveBeenCalledTimes(1);
    expect(fetchReleases).toHaveBeenCalledWith();
  });
});
