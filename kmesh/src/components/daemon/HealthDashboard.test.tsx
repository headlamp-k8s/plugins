import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseKmeshDaemonPods, mockUseKmeshVersion } = vi.hoisted(() => ({
  mockUseKmeshDaemonPods: vi.fn(),
  mockUseKmeshVersion: vi.fn(),
}));

vi.mock('../../hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: mockUseKmeshDaemonPods,
}));

vi.mock('../../hooks/useDaemonRequest', () => ({
  useKmeshVersion: mockUseKmeshVersion,
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

import HealthDashboard from './HealthDashboard';

afterEach(() => {
  cleanup();
  mockUseKmeshDaemonPods.mockReset();
  mockUseKmeshVersion.mockReset().mockReturnValue({ status: 'idle', data: null, error: null });
});

function pod(overrides: Record<string, any> = {}) {
  return {
    name: 'kmesh-daemon-abc12',
    namespace: 'kmesh-system',
    nodeName: 'node-1',
    phase: 'Running',
    ready: true,
    podIP: '10.0.0.5',
    ...overrides,
  };
}

describe('HealthDashboard', () => {
  it('shows a loading indicator while pods are being listed', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ pods: [], loading: true, error: null });
    render(<HealthDashboard />);
    expect(screen.getByTestId('section-Kmesh Daemon Health')).toBeTruthy();
  });

  it('shows an error message when the pod list fails to load', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ pods: [], loading: false, error: 'boom' });
    render(<HealthDashboard />);
    expect(screen.getByText(/Error loading pods: boom/)).toBeTruthy();
  });

  it('shows the empty-state message when no daemon pods exist', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ pods: [], loading: false, error: null });
    render(<HealthDashboard />);
    expect(screen.getByText(/No kmesh-daemon pods found/)).toBeTruthy();
  });

  it('renders a row per pod with name, node, and IP', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ pods: [pod()], loading: false, error: null });
    render(<HealthDashboard />);
    expect(screen.getByText('kmesh-daemon-abc12')).toBeTruthy();
    expect(screen.getByText('node-1')).toBeTruthy();
    expect(screen.getByText('10.0.0.5')).toBeTruthy();
  });

  it('marks a not-ready pod as such in the status column', () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [pod({ ready: false, statusReason: 'CrashLoopBackOff' })],
      loading: false,
      error: null,
    });
    render(<HealthDashboard />);
    expect(screen.getByText(/CrashLoopBackOff \(Not Ready\)/)).toBeTruthy();
  });

  it("shows a dash for the daemon version when the pod isn't ready, without querying it", () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [pod({ ready: false })],
      loading: false,
      error: null,
    });
    render(<HealthDashboard />);
    expect(mockUseKmeshVersion).toHaveBeenCalledWith('kmesh-system', null);
  });

  it('renders the daemon version once the version query succeeds', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ pods: [pod()], loading: false, error: null });
    mockUseKmeshVersion.mockReturnValue({
      status: 'success',
      data: { gitVersion: 'v1.2.3', gitCommit: 'abcdef1234' },
      error: null,
    });
    render(<HealthDashboard />);
    expect(screen.getByText('v1.2.3 (abcdef1)')).toBeTruthy();
  });
});
