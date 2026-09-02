import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseKmeshDaemonPods, mockUseXdsClusters, mockUseXdsListeners, mockUseXdsRoutes } =
  vi.hoisted(() => ({
    mockUseKmeshDaemonPods: vi.fn(),
    mockUseXdsClusters: vi.fn(),
    mockUseXdsListeners: vi.fn(),
    mockUseXdsRoutes: vi.fn(),
  }));

vi.mock('../../hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: mockUseKmeshDaemonPods,
}));

vi.mock('../../hooks/useDaemonRequest', () => ({
  useXdsClusters: mockUseXdsClusters,
  useXdsListeners: mockUseXdsListeners,
  useXdsRoutes: mockUseXdsRoutes,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }: any) => <div data-testid={`section-${title}`}>{children}</div>,
  SimpleTable: ({ data, columns, emptyMessage }: any) =>
    data.length === 0 ? (
      <div>{emptyMessage}</div>
    ) : (
      <table>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i}>
              {columns.map((col: any) => (
                <td key={col.label}>{col.getter(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

import XdsConfigDump from './XdsConfigDump';

const readyPod = {
  name: 'kmesh-daemon-1',
  namespace: 'kmesh-system',
  nodeName: 'node-1',
  ready: true,
};
const idleState = { status: 'idle', data: null, error: null };

afterEach(() => {
  cleanup();
  mockUseKmeshDaemonPods.mockReset();
  mockUseXdsClusters.mockReset().mockReturnValue(idleState);
  mockUseXdsListeners.mockReset().mockReturnValue(idleState);
  mockUseXdsRoutes.mockReset().mockReturnValue(idleState);
});

describe('XdsConfigDump', () => {
  it('shows a loading indicator while pods are being listed', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: true, error: null });
    render(<XdsConfigDump />);
    expect(screen.getByTestId('section-Kmesh xDS Config Dump')).toBeTruthy();
  });

  it('shows an error message when the pod list fails to load', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: 'boom' });
    render(<XdsConfigDump />);
    expect(screen.getByText(/Error loading pods: boom/)).toBeTruthy();
  });

  it('shows the empty-state message when no ready daemon pod exists', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: null });
    render(<XdsConfigDump />);
    expect(screen.getByText(/No Running\+Ready Kmesh daemon pod found/)).toBeTruthy();
  });

  it('shows a workload-mode mismatch message on a 400 error in the active tab', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseXdsClusters.mockReturnValue({ status: 'error', data: null, error: '400 Bad Request' });
    render(<XdsConfigDump />);
    expect(screen.getByText(/dual-engine \/ workload mode/)).toBeTruthy();
  });

  it('shows a generic error message for non-mode-mismatch cluster failures', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseXdsClusters.mockReturnValue({ status: 'error', data: null, error: 'timeout' });
    render(<XdsConfigDump />);
    expect(screen.getByText(/Error fetching xDS config dump: timeout/)).toBeTruthy();
  });

  it('renders cluster rows with name and LB policy on the default tab', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseXdsClusters.mockReturnValue({
      status: 'success',
      data: [{ name: 'outbound|80||svc.default', lbPolicy: 'ROUND_ROBIN', apiStatus: 'OK' }],
      error: null,
    });
    render(<XdsConfigDump />);
    expect(screen.getByText('outbound|80||svc.default')).toBeTruthy();
    expect(screen.getByText('ROUND_ROBIN')).toBeTruthy();
  });

  it('switches to the Listeners tab and renders formatted IPv4 addresses', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseXdsListeners.mockReturnValue({
      status: 'success',
      data: [
        { name: 'listener-1', address: { ipv4: 0x0a000005, port: 15006 }, filterChains: [{}] },
      ],
      error: null,
    });
    render(<XdsConfigDump />);

    fireEvent.click(screen.getByRole('tab', { name: /Listeners/ }));

    expect(screen.getByText('listener-1')).toBeTruthy();
    expect(screen.getByText('10.0.0.5:15006')).toBeTruthy();
  });

  it('switches to the Routes tab and sums total routes across virtual hosts', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseXdsRoutes.mockReturnValue({
      status: 'success',
      data: [
        {
          name: 'route-1',
          virtualHosts: [{ routes: [{}, {}] }, { routes: [{}] }],
        },
      ],
      error: null,
    });
    render(<XdsConfigDump />);

    fireEvent.click(screen.getByRole('tab', { name: /Routes/ }));

    expect(screen.getByText('route-1')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});
