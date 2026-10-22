import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseKmeshDaemonPods, mockUseAuthzPolicies } = vi.hoisted(() => ({
  mockUseKmeshDaemonPods: vi.fn(),
  mockUseAuthzPolicies: vi.fn(),
}));

vi.mock('../../hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: mockUseKmeshDaemonPods,
}));

vi.mock('./useAuthzPolicies', () => ({
  useAuthzPolicies: mockUseAuthzPolicies,
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
}));

import AuthzPolicies from './AuthzPolicies';

const readyPod = {
  name: 'kmesh-daemon-1',
  namespace: 'kmesh-system',
  nodeName: 'node-1',
  ready: true,
};

afterEach(() => {
  cleanup();
  mockUseKmeshDaemonPods.mockReset();
  mockUseAuthzPolicies.mockReset();
});

function policy(overrides: Record<string, any> = {}) {
  return {
    name: 'allow-frontend',
    namespace: 'default',
    scope: 'WORKLOAD',
    action: 'ALLOW',
    rules: [{ from: ['ns/default'] }],
    ...overrides,
  };
}

describe('AuthzPolicies', () => {
  it('shows a loading indicator while pods are being listed', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: true, error: null });
    mockUseAuthzPolicies.mockReturnValue({ status: 'idle', data: null, error: null });
    render(<AuthzPolicies />);
    expect(screen.getByTestId('section-Authorization Policies active in KMesh')).toBeTruthy();
  });

  it('shows an error message when the pod lookup fails', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: 'boom' });
    mockUseAuthzPolicies.mockReturnValue({ status: 'idle', data: null, error: null });
    render(<AuthzPolicies />);
    expect(screen.getByText(/Error locating Kmesh daemon pod: boom/)).toBeTruthy();
  });

  it('shows the empty-state message when no ready daemon pod exists', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod: null, loading: false, error: null });
    mockUseAuthzPolicies.mockReturnValue({ status: 'idle', data: null, error: null });
    render(<AuthzPolicies />);
    expect(screen.getByText(/No Running\+Ready Kmesh daemon pod found/)).toBeTruthy();
  });

  it('shows a kernel-native mode message on a 400 error', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseAuthzPolicies.mockReturnValue({ status: 'error', data: null, error: '400 Bad Request' });
    render(<AuthzPolicies />);
    expect(screen.getByText(/kernel-native \(ADS\) mode/)).toBeTruthy();
  });

  it('shows a generic error message for non-mode-mismatch failures', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseAuthzPolicies.mockReturnValue({
      status: 'error',
      data: null,
      error: 'connection reset',
    });
    render(<AuthzPolicies />);
    expect(
      screen.getByText(
        /Error fetching authorization policies from daemon \(kmesh-daemon-1\): connection reset/
      )
    ).toBeTruthy();
  });

  it('renders a row per policy with name, namespace, scope, and action', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseAuthzPolicies.mockReturnValue({ status: 'success', data: [policy()], error: null });
    render(<AuthzPolicies />);
    expect(screen.getByText('allow-frontend')).toBeTruthy();
    expect(screen.getByText('default')).toBeTruthy();
    expect(screen.getByText('WORKLOAD')).toBeTruthy();
    expect(screen.getByText('ALLOW')).toBeTruthy();
  });

  it('opens a dialog with the rules JSON when "View Rules" is clicked', () => {
    mockUseKmeshDaemonPods.mockReturnValue({ readyPod, loading: false, error: null });
    mockUseAuthzPolicies.mockReturnValue({ status: 'success', data: [policy()], error: null });
    render(<AuthzPolicies />);

    fireEvent.click(screen.getByRole('button', { name: /View Rules \(1\)/ }));

    expect(screen.getByText('Rules for allow-frontend')).toBeTruthy();
    expect(screen.getByText(/"from"/)).toBeTruthy();
  });
});
