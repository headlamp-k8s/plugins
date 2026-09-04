import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MinikubeServiceAction } from '../MinikubeServiceAction';

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: (props: any) => (
    <button aria-label={props.description} onClick={props.onClick} data-testid="action-button" />
  ),
}));

describe('MinikubeServiceAction Component', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    delete (window as any).pluginRunCommand;
    vi.restoreAllMocks();
  });

  it('returns null if item is missing or not a Service', () => {
    const { container: containerNull } = render(<MinikubeServiceAction item={undefined} />);
    expect(containerNull.firstChild).toBeNull();

    const nonServiceItem = {
      kind: 'Pod',
      getName: () => 'my-pod',
      getNamespace: () => 'default',
    } as any;

    const { container: containerPod } = render(<MinikubeServiceAction item={nonServiceItem} />);
    expect(containerPod.firstChild).toBeNull();
  });

  it('renders ActionButton for Service items', () => {
    const serviceItem = {
      kind: 'Service',
      getName: () => 'my-service',
      getNamespace: () => 'default',
    } as any;

    const { container } = render(<MinikubeServiceAction item={serviceItem} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('executes command and opens URL when action button is clicked', () => {
    const stdoutListeners: Record<string, Function> = {};
    const mockCmd = {
      stdout: {
        on: vi.fn((event: string, cb: Function) => {
          stdoutListeners[event] = cb;
        }),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn(),
    };

    const mockRunner = vi.fn().mockReturnValue(mockCmd);
    (window as any).pluginRunCommand = mockRunner;

    const serviceItem = {
      kind: 'Service',
      getName: () => 'web-demo',
      getNamespace: () => 'kube-system',
    } as any;

    render(<MinikubeServiceAction item={serviceItem} />);

    const button = screen.getByTestId('action-button');
    fireEvent.click(button);

    expect(mockRunner).toHaveBeenCalledWith(
      'minikube',
      ['service', 'web-demo', '-n', 'kube-system', '--url'],
      {}
    );

    // Simulate stdout output with URL
    stdoutListeners['data']('http://192.168.49.2:31000\n');

    expect(window.open).toHaveBeenCalledWith('http://192.168.49.2:31000', '_blank');
  });

  it('shows error snackbar when runner is not available', () => {
    const serviceItem = {
      kind: 'Service',
      getName: () => 'web-demo',
      getNamespace: () => 'default',
    } as any;

    render(<MinikubeServiceAction item={serviceItem} />);

    const button = screen.getByTestId('action-button');
    fireEvent.click(button);

    expect(
      screen.getByText('Command runner is not available in this environment.')
    ).toBeTruthy();
  });

  it('shows error snackbar when minikube exits without emitting a URL', () => {
    let exitHandler: Function | undefined;
    const mockCmd = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'exit') exitHandler = cb;
      }),
    };

    const mockRunner = vi.fn().mockReturnValue(mockCmd);
    (window as any).pluginRunCommand = mockRunner;

    const serviceItem = {
      kind: 'Service',
      getName: () => 'backend-svc',
      getNamespace: () => 'default',
    } as any;

    render(<MinikubeServiceAction item={serviceItem} />);

    const button = screen.getByTestId('action-button');
    fireEvent.click(button);

    // Simulate process exiting with code 0 without any stdout URL
    exitHandler?.(0);

    expect(
      screen.getByText(
        'No URL returned by Minikube for service "backend-svc". Does the service expose a port?'
      )
    ).toBeTruthy();
  });
});
