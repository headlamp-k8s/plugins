import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import KueueAdminResourceAccess from './KueueAdminResourceAccess';

const state = vi.hoisted(() => ({ cluster: 'first', allowed: true, request: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ clusterRequest: state.request }));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ K8s: { useCluster: () => state.cluster } }));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', async () => {
  const { createElement, useEffect } = await vi.importActual<typeof import('react')>('react');
  return {
    Loader: ({ title }: { title: string }) => createElement('div', null, title),
    SectionBox: ({ title, children }: any) => createElement('section', null, title, children),
    EmptyContent: ({ children }: any) => createElement('div', null, children),
    AuthVisible: ({ children, onAuthResult }: any) => {
      useEffect(() => {
        onAuthResult({ allowed: state.allowed });
      }, []);
      return state.allowed ? children : null;
    },
  };
});

function page() {
  return (
    <KueueAdminResourceAccess resourceClass={{} as any} resourceLabel="Workloads" verb="list">
      <div>Workload list</div>
    </KueueAdminResourceAccess>
  );
}

describe('Kueue installation gate', () => {
  beforeEach(() => {
    state.cluster = 'first';
    state.allowed = true;
    state.request.mockReset();
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

  it('rechecks on cluster changes and ignores an older cluster response', async () => {
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
    expect(state.request).toHaveBeenLastCalledWith('/apis/kueue.x-k8s.io', { cluster: 'second' });
    await act(async () => {
      resolveFirst({});
    });
    expect(screen.queryByText('Workload list')).toBeNull();
    expect(screen.getByText('Kueue is not installed')).toBeTruthy();
  });
});
