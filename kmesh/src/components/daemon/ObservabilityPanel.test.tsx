import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseKmeshDaemonPods, mockUseKmeshLoggers, mockToggleDaemonFeature, mockDaemonRequest } =
  vi.hoisted(() => ({
    mockUseKmeshDaemonPods: vi.fn(),
    mockUseKmeshLoggers: vi.fn(),
    mockToggleDaemonFeature: vi.fn(),
    mockDaemonRequest: vi.fn(),
  }));

vi.mock('../../hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: mockUseKmeshDaemonPods,
}));

vi.mock('../../hooks/useDaemonRequest', () => ({
  useKmeshLoggers: mockUseKmeshLoggers,
}));

vi.mock('../../utils/kmeshDaemonProxy', () => ({
  toggleDaemonFeature: mockToggleDaemonFeature,
  daemonRequest: mockDaemonRequest,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }: any) => <div data-testid={`section-${title}`}>{children}</div>,
}));

import ObservabilityPanel from './ObservabilityPanel';

const readyPod = {
  name: 'kmesh-daemon-1',
  namespace: 'kmesh-system',
  nodeName: 'node-1',
  ready: true,
};

beforeEach(() => {
  mockUseKmeshLoggers.mockReturnValue({ status: 'success', data: ['bpf'], error: null });
  mockToggleDaemonFeature.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  mockUseKmeshDaemonPods.mockReset();
  mockUseKmeshLoggers.mockReset();
  mockToggleDaemonFeature.mockReset();
  mockDaemonRequest.mockReset();
});

describe('ObservabilityPanel', () => {
  it('shows an error when locating the daemon pod fails', () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [],
      readyPod: null,
      loading: false,
      error: 'boom',
    });
    render(<ObservabilityPanel />);
    expect(screen.getByText(/Error locating Kmesh daemon pod: boom/)).toBeTruthy();
  });

  it('shows the empty-state message when no daemon pods exist', () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [],
      readyPod: null,
      loading: false,
      error: null,
    });
    render(<ObservabilityPanel />);
    expect(screen.getByText(/No Kmesh daemon pods found/)).toBeTruthy();
  });

  it('auto-selects the ready pod and enables its toggles', () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [readyPod],
      readyPod,
      loading: false,
      error: null,
    });
    render(<ObservabilityPanel />);

    const monitoringSwitch = screen.getByLabelText(
      'Monitoring (Master Switch)'
    ) as HTMLInputElement;
    expect(monitoringSwitch.disabled).toBe(false);
  });

  it('toggles a feature on and shows a success message', async () => {
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [readyPod],
      readyPod,
      loading: false,
      error: null,
    });
    render(<ObservabilityPanel />);

    const accessLogSwitch = screen.getByLabelText('Access Logs');
    fireEvent.click(accessLogSwitch);

    await waitFor(() => {
      expect(mockToggleDaemonFeature).toHaveBeenCalledWith(
        'kmesh-system',
        'kmesh-daemon-1',
        '/accesslog',
        true
      );
    });
    expect(await screen.findByText(/Successfully enabled Access Logs/)).toBeTruthy();
  });

  it('reverts the optimistic toggle and shows an error when the request fails', async () => {
    mockToggleDaemonFeature.mockRejectedValue(new Error('daemon unreachable'));
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [readyPod],
      readyPod,
      loading: false,
      error: null,
    });
    render(<ObservabilityPanel />);

    fireEvent.click(screen.getByLabelText('XDP Authz Offloading'));

    expect(
      await screen.findByText(/Failed to enable XDP Authz Offloading: daemon unreachable/)
    ).toBeTruthy();
    // FeatureRow is redefined on every render, so React remounts the switch
    // subtree on each state change — re-query rather than reuse the old node.
    await waitFor(() => {
      expect((screen.getByLabelText('XDP Authz Offloading') as HTMLInputElement).checked).toBe(
        false
      );
    });
  });

  it('sets the log level via daemonRequest when "Set Level" is clicked', async () => {
    mockDaemonRequest.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    mockUseKmeshDaemonPods.mockReturnValue({
      pods: [readyPod],
      readyPod,
      loading: false,
      error: null,
    });
    render(<ObservabilityPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Set Level' }));

    await waitFor(() => {
      expect(mockDaemonRequest).toHaveBeenCalledWith(
        'kmesh-system',
        'kmesh-daemon-1',
        '/debug/loggers',
        expect.objectContaining({
          method: 'POST',
          body: { name: 'bpf', level: 'info' },
          isJSON: false,
        })
      );
    });
    expect(await screen.findByText(/Successfully set logger 'bpf' to 'info'/)).toBeTruthy();
  });
});
