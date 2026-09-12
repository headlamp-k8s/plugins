import { vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Router: {
    createRouteURL: vi
      .fn()
      .mockImplementation((route: string, params: any) => `/${route}/${params.name}`),
  },
  Headlamp: { setCluster: vi.fn() },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/secret', () => ({
  default: { useGet: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }) },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: ({ description, onClick, icon }: any) => (
    <button onClick={onClick} data-testid={`action-${icon}`}>
      {description}
    </button>
  ),
  ConfirmButton: ({ children, onConfirm }: any) => (
    <div>
      {children}
      <button onClick={onConfirm} data-testid="confirm-button">
        Confirm
      </button>
    </div>
  ),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject {
    jsonData: any;
    constructor(jsonData: any) {
      this.jsonData = jsonData;
    }
  },
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { MemoryRouter } from 'react-router-dom';
import {
  getErrorMessage,
  getPausableReconciliationActions,
  PauseReconciliationAction,
  ResumeReconciliationAction,
} from './index';

describe('action helpers', () => {
  test('formats Error and non-Error values', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('plain failure')).toBe('plain failure');
    expect(getErrorMessage(404)).toBe('404');
  });
});

describe('Pause/Resume Reconciliation Actions', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <SnackbarProvider>{ui}</SnackbarProvider>
      </MemoryRouter>
    );
  };

  test('PauseReconciliationAction patches resource with paused annotation', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    const resource: any = {
      kind: 'Cluster',
      patch: mockPatch,
    };

    renderWithProviders(<PauseReconciliationAction resource={resource} />);

    // Grab the first button (action button)
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith({
        metadata: { annotations: { 'cluster.x-k8s.io/paused': 'true' } },
      });
    });
  });

  test('ResumeReconciliationAction patches resource to remove paused annotation', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    const resource: any = {
      kind: 'Cluster',
      patch: mockPatch,
    };

    renderWithProviders(<ResumeReconciliationAction resource={resource} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith({
        metadata: { annotations: { 'cluster.x-k8s.io/paused': null } },
      });
    });
  });

  test('getPausableReconciliationActions returns resume if paused', () => {
    const resource: any = {
      metadata: { annotations: { 'cluster.x-k8s.io/paused': 'true' } },
    };
    const actions = getPausableReconciliationActions(resource);
    expect(actions.length).toBe(1);
    expect(actions[0].key).toBe('resume');
  });

  test('getPausableReconciliationActions returns pause if not paused', () => {
    const resource: any = {
      metadata: {},
    };
    const actions = getPausableReconciliationActions(resource);
    expect(actions.length).toBe(1);
    expect(actions[0].key).toBe('pause');
  });
});
