import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseKmeshDaemonPods, mockUseWorkloadBpfMaps } = vi.hoisted(() => ({
  mockUseKmeshDaemonPods: vi.fn(),
  mockUseWorkloadBpfMaps: vi.fn(),
}));

vi.mock('../../hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: mockUseKmeshDaemonPods,
}));

vi.mock('../../hooks/useDaemonRequest', () => ({
  useWorkloadBpfMaps: mockUseWorkloadBpfMaps,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, headerProps, children }: any) => (
    <div data-testid={`section-${title}`}>
      {headerProps?.titleSideActions}
      {children}
    </div>
  ),
  SimpleTable: ({ data, columns, emptyMessage }: any) =>
    data.length === 0 ? (
      <div>{emptyMessage}</div>
    ) : (
      <table>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i}>
              {columns.map((col: any) => (
                <td key={col.label}>{col.getter(row, i)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

import EbpfMaps from './EbpfMaps';

const readyPod = {
  name: 'kmesh-daemon-1',
  namespace: 'kmesh-system',
  nodeName: 'node-1',
  ready: true,
};
const idleState = { status: 'idle', data: null, error: null };

beforeEach(() => {
  mockUseWorkloadBpfMaps.mockReturnValue(idleState);
});

afterEach(() => {
  cleanup();
  mockUseKmeshDaemonPods.mockReset();
  mockUseWorkloadBpfMaps.mockReset();
});

describe('EbpfMaps', () => {
  it('shows a loading indicator while pods are being listed', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: true, error: null });
    render(<EbpfMaps />);
    expect(screen.getByTestId('section-Kmesh eBPF Maps')).toBeTruthy();
  });

  it('shows an error message when the pod list fails to load', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: 'boom' });
    render(<EbpfMaps />);
    expect(screen.getByText(/Error loading pods: boom/)).toBeTruthy();
  });

  it('shows the empty-state message when no ready daemon pod exists', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: null });
    render(<EbpfMaps />);
    expect(screen.getByText(/No Running\+Ready Kmesh daemon pod found/)).toBeTruthy();
  });

  it('shows a kernel-native mode mismatch message on a 400 error', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'error',
      data: null,
      error: '400 Bad Request',
    });
    render(<EbpfMaps />);
    expect(screen.getByText(/kernel-native \(ADS\) mode/)).toBeTruthy();
  });

  it('shows a generic error message for non-mode-mismatch failures', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'error',
      data: null,
      error: 'connection reset',
    });
    render(<EbpfMaps />);
    expect(screen.getByText(/Error fetching eBPF map data: connection reset/)).toBeTruthy();
  });

  it('renders backend rows with pod IP and waypoint on the default tab', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'success',
      data: {
        backends: [
          {
            ip: '10.0.0.5',
            serviceCount: 1,
            services: ['default/svc-a'],
            waypointAddr: '10.0.0.9',
            waypointPort: 15008,
          },
        ],
        frontends: [],
        services: [],
        endpoints: [],
        workloadPolicies: [],
      },
      error: null,
    });
    render(<EbpfMaps />);
    expect(screen.getByText('10.0.0.5')).toBeTruthy();
    expect(screen.getByText('10.0.0.9:15008')).toBeTruthy();
    expect(screen.getByText('Backends (1)')).toBeTruthy();
  });

  it('switches to the Frontends tab and renders upstream IDs', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'success',
      data: {
        backends: [],
        frontends: [{ ip: '10.0.0.5', upstreamId: 42 }],
        services: [],
        endpoints: [],
        workloadPolicies: [],
      },
      error: null,
    });
    render(<EbpfMaps />);

    fireEvent.click(screen.getByRole('tab', { name: /Frontends/ }));

    expect(screen.getByText('42')).toBeTruthy();
  });

  it('switches to the Services tab and renders LB policy and port mapping', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'success',
      data: {
        backends: [],
        frontends: [],
        services: [{ lbPolicy: 'RANDOM', servicePort: 80, targetPort: 8080, endpointCount: 3 }],
        endpoints: [],
        workloadPolicies: [],
      },
      error: null,
    });
    render(<EbpfMaps />);

    fireEvent.click(screen.getByRole('tab', { name: /Services/ }));

    expect(screen.getByText('RANDOM')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('8080')).toBeTruthy();
  });

  it('switches to the Endpoints tab and renders priority-ordered entries', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'success',
      data: {
        backends: [],
        frontends: [],
        services: [],
        endpoints: [{ priority: 0, serviceId: 'svc-1', backendIndex: 2, backendUid: 'pod-uid-1' }],
        workloadPolicies: [],
      },
      error: null,
    });
    render(<EbpfMaps />);

    fireEvent.click(screen.getByRole('tab', { name: /Endpoints/ }));

    expect(screen.getByText('svc-1')).toBeTruthy();
    expect(screen.getByText('pod-uid-1')).toBeTruthy();
  });

  it('switches to the Workload Policies tab and renders active policy IDs', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseWorkloadBpfMaps.mockReturnValue({
      status: 'success',
      data: {
        backends: [],
        frontends: [],
        services: [],
        endpoints: [],
        workloadPolicies: [{ policyIds: ['policy-1', 'policy-2'] }],
      },
      error: null,
    });
    render(<EbpfMaps />);

    fireEvent.click(screen.getByRole('tab', { name: /Workload Policies/ }));

    expect(screen.getByText('policy-1')).toBeTruthy();
    expect(screen.getByText('policy-2')).toBeTruthy();
  });
});
