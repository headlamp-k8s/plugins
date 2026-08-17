import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MinikubeServiceAction } from '../MinikubeServiceAction';

const state = vi.hoisted(() => ({
  electron: true,
  minikube: true,
  clusters: {
    'dev-profile': {
      name: 'dev-profile',
      meta_data: {
        extensions: { context_info: { provider: 'minikube.sigs.k8s.io' } },
      },
    },
  } as Record<string, any>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    useClustersConf: () => state.clusters,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: (props: any) => (
    <button
      aria-label={props.description}
      onClick={props.onClick}
      data-testid="action-button"
      disabled={props.disabled}
    />
  ),
}));

vi.mock('@mui/material', () => ({
  Alert: (props: any) => <div role="alert">{props.children}</div>,
  Snackbar: (props: any) => (props.open ? <div>{props.children}</div> : null),
}));

vi.mock('../isElectron', () => ({
  isElectron: () => state.electron,
  isMinikube: (cluster: any) =>
    state.minikube &&
    cluster?.meta_data?.extensions?.context_info?.provider === 'minikube.sigs.k8s.io',
}));

class MockProcess {
  stdoutListeners: Array<(data: any) => void> = [];
  stderrListeners: Array<(data: any) => void> = [];
  exitListeners: Array<(code: number | null) => void> = [];
  errorListeners: Array<(error: any) => void> = [];
  kill = vi.fn();

  stdout = {
    on: vi.fn((_event: string, listener: (data: any) => void) => {
      this.stdoutListeners.push(listener);
    }),
    off: vi.fn((_event: string, listener: (data: any) => void) => {
      this.stdoutListeners = this.stdoutListeners.filter(candidate => candidate !== listener);
    }),
  };

  stderr = {
    on: vi.fn((_event: string, listener: (data: any) => void) => {
      this.stderrListeners.push(listener);
    }),
    off: vi.fn((_event: string, listener: (data: any) => void) => {
      this.stderrListeners = this.stderrListeners.filter(candidate => candidate !== listener);
    }),
  };

  on = vi.fn((event: string, listener: (value: any) => void) => {
    if (event === 'exit') this.exitListeners.push(listener);
    if (event === 'error') this.errorListeners.push(listener);
  });

  off = vi.fn((event: string, listener: (value: any) => void) => {
    if (event === 'exit')
      this.exitListeners = this.exitListeners.filter(candidate => candidate !== listener);
    if (event === 'error')
      this.errorListeners = this.errorListeners.filter(candidate => candidate !== listener);
  });

  emitStdout(chunk: string) {
    this.stdoutListeners.forEach(listener => listener(chunk));
  }

  emitStderr(chunk: string) {
    this.stderrListeners.forEach(listener => listener(chunk));
  }

  emitExit(code: number | null) {
    this.exitListeners.forEach(listener => listener(code));
  }

  emitError(error: any) {
    this.errorListeners.forEach(listener => listener(error));
  }
}

function service(profile = 'dev-profile') {
  return {
    kind: 'Service',
    cluster: profile,
    getName: () => 'web-demo',
    getNamespace: () => 'kube-system',
  } as any;
}

describe('MinikubeServiceAction', () => {
  beforeEach(() => {
    state.electron = true;
    state.minikube = true;
    state.clusters = {
      'dev-profile': {
        name: 'dev-profile',
        meta_data: {
          extensions: { context_info: { provider: 'minikube.sigs.k8s.io' } },
        },
      },
    };
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as any).pluginRunCommand;
  });

  it('returns null outside Electron or for non-Minukube and non-Minukube clusters', () => {
    const { container, rerender } = render(<MinikubeServiceAction item={service()} />);
    expect(container.firstChild).not.toBeNull();

    state.electron = false;
    rerender(<MinikubeServiceAction item={service()} />);
    expect(container.firstChild).toBeNull();

    state.electron = true;
    state.minikube = false;
    rerender(<MinikubeServiceAction item={service()} />);
    expect(container.firstChild).toBeNull();

    rerender(<MinikubeServiceAction item={{ kind: 'Pod', cluster: 'dev-profile' } as any} />);
    expect(container.firstChild).toBeNull();

    rerender(<MinikubeServiceAction item={service('missing-profile')} />);
    expect(container.firstChild).toBeNull();
  });

  it('runs the service command with namespace and non-default profile', () => {
    const process = new MockProcess();
    const runner = vi.fn(() => process);
    (window as any).pluginRunCommand = runner;

    render(<MinikubeServiceAction item={service('dev-profile')} />);
    fireEvent.click(screen.getByTestId('action-button'));

    expect(runner).toHaveBeenCalledWith(
      'minikube',
      ['service', 'web-demo', '-n', 'kube-system', '-p', 'dev-profile', '--url'],
      {}
    );
  });

  it('buffers split stdout URLs and opens only once', () => {
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);

    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));

    act(() => process.emitStdout('http://127.0.0.1:'));
    expect(window.open).not.toHaveBeenCalled();
    act(() => process.emitStdout('45678\n'));

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith('http://127.0.0.1:45678', '_blank');

    act(() => process.emitStdout('http://127.0.0.1:45678\n'));
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('parses a trailing URL buffer on exit', () => {
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);

    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));

    act(() => process.emitStderr('Forwarding from 127.0.0.1'));
    act(() => process.emitStderr(' to http://127.0.0.1:45679'));
    act(() => process.emitExit(0));

    expect(window.open).toHaveBeenCalledWith('http://127.0.0.1:45679', '_blank');
  });

  it('retains a successful tunnel process and exposes stop cleanup', () => {
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);

    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    act(() => process.emitStdout('http://127.0.0.1:45678\n'));

    expect(screen.getByTestId('action-button').getAttribute('aria-label')).toBe(
      'Stop Minikube Service Tunnel'
    );
    expect(process.kill).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('action-button'));
    expect(process.kill).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate launches while an operation or tunnel is active', () => {
    const process = new MockProcess();
    const runner = vi.fn(() => process);
    (window as any).pluginRunCommand = runner;

    render(<MinikubeServiceAction item={service()} />);
    const button = screen.getByTestId('action-button');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(runner).toHaveBeenCalledTimes(1);

    act(() => process.emitStdout('http://127.0.0.1:45678\n'));
    fireEvent.click(screen.getByTestId('action-button'));
    expect(runner).toHaveBeenCalledTimes(1);
  });

  it('reports non-zero exits and process errors', () => {
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);
    const view = render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    act(() => process.emitExit(1));
    expect(
      screen.getByText('Minikube exited with code 1. Make sure Minikube is running.')
    ).toBeTruthy();
    view.unmount();

    const errorProcess = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => errorProcess);

    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    act(() => errorProcess.emitError(new Error('spawn failed')));
    expect(screen.getByText('Failed to execute Minikube: spawn failed')).toBeTruthy();
  });

  it('shows an unavailable runner error without dispatching a process', () => {
    delete (window as any).pluginRunCommand;
    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.getByText('Command runner is not available in this environment.')).toBeTruthy();
  });

  it('times out, kills the process, and ignores late URL output', () => {
    vi.useFakeTimers();
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);

    render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    act(() => vi.advanceTimersByTime(30000));

    expect(process.kill).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Timed out waiting for Minikube URL for service "web-demo".')
    ).toBeTruthy();

    act(() => process.emitStdout('http://127.0.0.1:45678\n'));
    act(() => process.emitExit(0));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('cleans up a retained tunnel process when unmounted', () => {
    const process = new MockProcess();
    (window as any).pluginRunCommand = vi.fn(() => process);

    const view = render(<MinikubeServiceAction item={service()} />);
    fireEvent.click(screen.getByTestId('action-button'));
    act(() => process.emitStdout('http://127.0.0.1:45678\n'));
    view.unmount();

    expect(process.kill).toHaveBeenCalledTimes(1);
  });
});
