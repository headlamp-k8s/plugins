import { act, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HubbleStatus, { RELAY_REFRESH_MS } from './HubbleStatus';

const { mockClusterRequest, selected, crdsByCluster } = vi.hoisted(() => ({
  mockClusterRequest: vi.fn(),
  selected: { clusters: ['minikube'] as string[] },
  crdsByCluster: {} as Record<string, unknown[]>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: mockClusterRequest },
  K8s: {
    useSelectedClusters: () => selected.clusters,
    ResourceClasses: {
      CustomResourceDefinition: {
        useList: ({ cluster }: { cluster: string }) => [crdsByCluster[cluster] ?? [], null],
      },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
  SimpleTable: ({
    columns,
    data,
  }: {
    columns: { label: string; getter: (row: any) => ReactNode }[];
    data: any[];
  }) => (
    <table>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(column => (
              <td key={column.label}>{column.getter(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

/** The text of the table row for one component in one cluster's section. */
function rowText(cluster: string, component: string) {
  const section = screen.getByRole('region', { name: `Status of ${cluster}` });
  return within(section).getByText(component).closest('tr')!.textContent;
}

describe('HubbleStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    mockClusterRequest.mockReset();
    selected.clusters = ['minikube'];
    for (const key of Object.keys(crdsByCluster)) {
      delete crdsByCluster[key];
    }
  });

  it('looks for hubble-relay in every namespace, not only the allowed ones', async () => {
    // Service.useList only asks the namespaces Headlamp is allowed to show, so with allowed
    // namespaces set to team-a, a Relay in kube-system would come back as an empty list.
    mockClusterRequest.mockResolvedValue({ items: [{ metadata: { namespace: 'kube-system' } }] });

    render(<HubbleStatus />);

    expect(await screen.findByText('Service hubble-relay in kube-system')).toBeTruthy();
    expect(mockClusterRequest).toHaveBeenCalledWith(
      '/api/v1/services',
      { cluster: 'minikube' },
      { fieldSelector: 'metadata.name=hubble-relay' }
    );
  });

  it('shows Unknown when the cluster-wide lookup is not allowed', async () => {
    mockClusterRequest.mockRejectedValue({ status: 403 });

    render(<HubbleStatus />);

    expect(await screen.findByText("Couldn't check (403)")).toBeTruthy();
  });

  it('shows each selected cluster on its own', async () => {
    // Cilium only in cluster-a and Relay only in cluster-b: neither cluster has both, so
    // neither may show Found for both.
    selected.clusters = ['cluster-a', 'cluster-b'];
    crdsByCluster['cluster-a'] = [{}];
    mockClusterRequest.mockImplementation((_path: string, { cluster }: { cluster: string }) =>
      Promise.resolve({
        items: cluster === 'cluster-b' ? [{ metadata: { namespace: 'kube-system' } }] : [],
      })
    );

    render(<HubbleStatus />);

    expect(await screen.findByText('Service hubble-relay in kube-system')).toBeTruthy();
    expect(await screen.findByText(/No hubble-relay Service/)).toBeTruthy();
    expect(rowText('cluster-a', 'Cilium')).toContain('Found');
    expect(rowText('cluster-a', 'Hubble Relay')).toContain('Not found');
    expect(rowText('cluster-b', 'Cilium')).toContain('Not found');
    expect(rowText('cluster-b', 'Hubble Relay')).toContain('Found');
    expect(rowText('cluster-b', 'Hubble Relay')).not.toContain('Not found');
    expect(screen.getByRole('heading', { name: 'cluster-a' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'cluster-b' })).toBeTruthy();
  });

  it('notices hubble-relay being installed on the next refresh', async () => {
    vi.useFakeTimers();
    mockClusterRequest.mockResolvedValueOnce({ items: [] });
    mockClusterRequest.mockResolvedValue({ items: [{ metadata: { namespace: 'kube-system' } }] });

    render(<HubbleStatus />);
    await act(async () => {});
    expect(rowText('minikube', 'Hubble Relay')).toContain('Not found');

    await act(async () => {
      vi.advanceTimersByTime(RELAY_REFRESH_MS);
    });
    expect(rowText('minikube', 'Hubble Relay')).toContain('in kube-system');
  });

  it('does not start a new lookup while the last one is still running', async () => {
    vi.useFakeTimers();
    let answer: (value: unknown) => void = () => {};
    mockClusterRequest.mockImplementation(
      () =>
        new Promise(resolve => {
          answer = resolve;
        })
    );

    render(<HubbleStatus />);
    await act(async () => {
      vi.advanceTimersByTime(RELAY_REFRESH_MS * 3);
    });
    expect(mockClusterRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      answer({ items: [{ metadata: { namespace: 'kube-system' } }] });
    });
    expect(rowText('minikube', 'Hubble Relay')).toContain('in kube-system');

    await act(async () => {
      vi.advanceTimersByTime(RELAY_REFRESH_MS);
    });
    expect(mockClusterRequest).toHaveBeenCalledTimes(2);
  });
});
