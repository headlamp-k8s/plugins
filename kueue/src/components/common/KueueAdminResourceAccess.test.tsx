/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import KueueAdminResourceAccess, { KueueInstallationGate } from './KueueAdminResourceAccess';

const state = vi.hoisted(() => ({ cluster: 'first', allowed: true, request: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  clusterRequest: state.request,
  request: state.request,
}));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ K8s: { useCluster: () => state.cluster } }));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', async () => {
  const { createElement } = await vi.importActual<typeof import('react')>('react');
  return {
    Loader: ({ title }: { title: string }) => createElement('div', null, title),
    SectionBox: ({ title, children }: any) => createElement('section', null, title, children),
    EmptyContent: ({ children }: any) => createElement('div', null, children),
  };
});

const resourceClass = {
  getAuthorization: vi.fn(async () => ({ status: { allowed: state.allowed } })),
} as any;

/** Clusters the page content was rendered for, to catch even a single stale render. */
const renderedFor: string[] = [];

function WorkloadList() {
  renderedFor.push(state.cluster);
  return <div>Workload list</div>;
}

function page() {
  return (
    <KueueAdminResourceAccess resourceClass={resourceClass} resourceLabel="Workloads" verb="list">
      <WorkloadList />
    </KueueAdminResourceAccess>
  );
}

describe('Kueue installation gate', () => {
  beforeEach(() => {
    state.cluster = 'first';
    state.allowed = true;
    state.request.mockReset();
    renderedFor.length = 0;
  });
  afterEach(cleanup);

  it('shows the missing-installation explanation and installation link for 404', async () => {
    state.request.mockRejectedValue({ status: 404 });
    render(page());
    await screen.findByText('Kueue is not installed');
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(screen.getByRole('link', { name: 'Install Kueue' }).getAttribute('href')).toBe(
      'https://kueue.sigs.k8s.io/docs/getting-started/installation/'
    );
  });

  it('renders authorized page content when the API exists', async () => {
    state.request.mockResolvedValue({});
    render(page());
    await screen.findByText('Workload list');
    expect(screen.queryByText('Kueue is not installed')).toBeNull();
  });

  it('preserves the existing permission denial for non-404 discovery failures', async () => {
    state.request.mockRejectedValue({ status: 403 });
    state.allowed = false;
    render(page());
    await screen.findByText(/not authorized to list this page/);
    expect(screen.queryByText('Kueue is not installed')).toBeNull();
  });

  it('does not crash when no cluster is selected', async () => {
    state.cluster = undefined as any;
    state.request.mockResolvedValue({});
    render(page());
    await screen.findByText('Workload list');
  });

  it('does not show the page for a new cluster before it is checked', async () => {
    state.request.mockResolvedValueOnce({});
    const { rerender } = render(page());
    await screen.findByText('Workload list');

    // The first cluster's probe has finished; the second one's stays pending.
    let resolveSecond!: (value: unknown) => void;
    state.request.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          resolveSecond = reject;
        })
    );
    state.cluster = 'second';
    rerender(page());
    expect(renderedFor).not.toContain('second');
    expect(state.request).toHaveBeenLastCalledWith('/apis/kueue.x-k8s.io', { cluster: 'second' });

    await act(async () => {
      resolveSecond({ status: 404 });
    });
    expect(screen.getByText('Kueue is not installed')).toBeTruthy();
    expect(renderedFor).not.toContain('second');
  });

  it('ignores an older cluster response after a cluster change', async () => {
    let resolveFirst!: (value: object) => void;
    state.request.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    );
    const { rerender } = render(page());
    await waitFor(() => expect(state.request).toHaveBeenCalledTimes(1));
    state.cluster = 'second';
    state.request.mockRejectedValueOnce({ status: 404 });
    rerender(page());
    await screen.findByText('Kueue is not installed');
    await act(async () => {
      resolveFirst({});
    });
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(screen.getByText('Kueue is not installed')).toBeTruthy();
  });

  it('checks again when returning to a cluster checked earlier', async () => {
    state.request.mockResolvedValueOnce({});
    const { rerender } = render(page());
    await screen.findByText('Workload list');
    const renders = renderedFor.length;

    const pending: Array<(value: unknown) => void> = [];
    state.request.mockImplementation(
      () =>
        new Promise((_, reject) => {
          pending.push(reject);
        })
    );
    state.cluster = 'second';
    rerender(page());
    state.cluster = 'first';
    rerender(page());

    // The first cluster's earlier result must not be reused while it is checked again.
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(renderedFor.length).toBe(renders);
    expect(state.request).toHaveBeenLastCalledWith('/apis/kueue.x-k8s.io', { cluster: 'first' });

    await act(async () => {
      pending[pending.length - 1]({ status: 404 });
    });
    expect(screen.getByText('Kueue is not installed')).toBeTruthy();
    expect(renderedFor.length).toBe(renders);
  });

  it('shows one empty state for several access checks under one gate', async () => {
    state.request.mockRejectedValue({ status: 404 });
    render(
      <KueueInstallationGate>
        {['Workloads', 'ClusterQueues'].map(label => (
          <KueueAdminResourceAccess
            key={label}
            resourceClass={resourceClass}
            resourceLabel={label}
            verb="list"
            installationChecked
          >
            <WorkloadList />
          </KueueAdminResourceAccess>
        ))}
      </KueueInstallationGate>
    );
    await screen.findByText('Kueue is not installed');
    expect(screen.getAllByText('Kueue is not installed')).toHaveLength(1);
    expect(state.request).toHaveBeenCalledTimes(1);
  });
});

describe('Namespaced access check', () => {
  /** Pending access checks, resolved by each test in the order it chooses. */
  let pending: Array<{ namespace?: string; resolve: (allowed: boolean) => void }>;

  const namespacedClass = {
    isNamespaced: true,
    getAuthorization: vi.fn(
      (_verb: string, { namespace }: { namespace?: string }) =>
        new Promise(resolve => {
          pending.push({ namespace, resolve: allowed => resolve({ status: { allowed } }) });
        })
    ),
  } as any;

  function detail(namespace: string) {
    return (
      <KueueAdminResourceAccess
        resourceClass={namespacedClass}
        resourceLabel="Workloads"
        verb="get"
        namespace={namespace}
        installationChecked
      >
        <WorkloadList />
      </KueueAdminResourceAccess>
    );
  }

  /** Answer the check made for a namespace. */
  async function answer(namespace: string, allowed: boolean) {
    await act(async () => {
      pending.find(check => check.namespace === namespace)!.resolve(allowed);
    });
  }

  beforeEach(() => {
    state.cluster = 'first';
    pending = [];
    namespacedClass.getAuthorization.mockClear();
    renderedFor.length = 0;
  });
  afterEach(cleanup);

  it('scopes the check to the namespace and cluster', async () => {
    render(detail('team-a'));
    expect(namespacedClass.getAuthorization).toHaveBeenCalledWith(
      'get',
      { namespace: 'team-a' },
      'first'
    );
    await answer('team-a', true);
    expect(screen.getByText('Workload list')).toBeTruthy();
  });

  it('hides the page after a namespace change until the new namespace is allowed', async () => {
    const { rerender } = render(detail('team-a'));
    await answer('team-a', true);
    const renders = renderedFor.length;

    rerender(detail('team-b'));
    expect(namespacedClass.getAuthorization).toHaveBeenLastCalledWith(
      'get',
      { namespace: 'team-b' },
      'first'
    );
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(renderedFor.length).toBe(renders);

    await answer('team-b', true);
    expect(screen.getByText('Workload list')).toBeTruthy();
  });

  it('ignores a late answer for the previous namespace', async () => {
    const { rerender } = render(detail('team-a'));
    rerender(detail('team-b'));

    await answer('team-a', true);
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(renderedFor).toHaveLength(0);

    await answer('team-b', false);
    expect(screen.getByText(/not authorized to view this page/)).toBeTruthy();
    expect(renderedFor).toHaveLength(0);
  });
});
