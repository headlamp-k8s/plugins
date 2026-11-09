import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ForceReconciliationAction,
  ForceSyncAction,
  ResumeAction,
  SuspendAction,
  syncRequest,
} from './index';

const mockEnqueueSnackbar = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      let result = key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, v);
        });
      }
      return result;
    },
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: (props: { description: string; icon: string; onClick: () => void }) => (
    <button
      data-testid="action-button"
      data-description={props.description}
      onClick={props.onClick}
    >
      {props.description}
    </button>
  ),
  ConfirmDialog: (props: {
    open: boolean;
    handleClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
  }) =>
    props.open ? (
      <div data-testid="confirm-dialog">
        <span data-testid="dialog-title">{props.title}</span>
        <span data-testid="dialog-desc">{props.description}</span>
        <button data-testid="dialog-cancel" onClick={props.handleClose}>
          Cancel
        </button>
        <button data-testid="dialog-confirm" onClick={props.onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../sources/Source', () => ({
  useSource: () => null,
}));

function makeResource(options?: {
  spec?: Record<string, unknown>;
  annotations?: Record<string, string>;
  patchMock?: ReturnType<typeof vi.fn>;
}) {
  const patch = options?.patchMock ?? vi.fn().mockResolvedValue({ metadata: {}, spec: {} });
  return {
    metadata: {
      name: 'my-release',
      namespace: 'flux-system',
      annotations: options?.annotations,
    },
    jsonData: {
      metadata: {
        name: 'my-release',
        namespace: 'flux-system',
        annotations: options?.annotations,
      },
      spec: options?.spec,
    },
    constructor: {
      apiEndpoint: {
        patch,
        get: vi.fn(),
      },
    },
  } as any;
}

describe('ForceSyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Force Sync button and does not show confirmation initially', () => {
    const resource = makeResource();
    render(<ForceSyncAction resource={resource} />);

    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Force Sync');
    expect(screen.queryByTestId('confirm-dialog')).toBeNull();
  });

  it('opens confirmation dialog on click without issuing a patch before confirmation', () => {
    const patchMock = vi.fn().mockResolvedValue({ metadata: {}, spec: {} });
    const resource = makeResource({ patchMock });

    render(<ForceSyncAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    fireEvent.click(button);

    expect(screen.getByTestId('confirm-dialog')).toBeDefined();
    expect(screen.getByTestId('dialog-title').textContent).toBe('Force Sync');
    expect(screen.getByTestId('dialog-desc').textContent).toContain(
      'Are you sure you want to force reconciliation for my-release? This will trigger resource replacement.'
    );
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('cancelling confirmation dialog closes it without issuing a patch', () => {
    const patchMock = vi.fn().mockResolvedValue({ metadata: {}, spec: {} });
    const resource = makeResource({ patchMock });

    render(<ForceSyncAction resource={resource} />);
    fireEvent.click(screen.getByTestId('action-button'));
    expect(screen.getByTestId('confirm-dialog')).toBeDefined();

    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(screen.queryByTestId('confirm-dialog')).toBeNull();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('confirming force sync sends both requestedAt and forceAt with the same timestamp and preserves existing annotations', async () => {
    const patchMock = vi.fn().mockResolvedValue({ metadata: {}, spec: {} });
    const resource = makeResource({
      annotations: { 'custom.annotation/key': 'custom-val' },
      patchMock,
    });

    render(<ForceSyncAction resource={resource} />);
    fireEvent.click(screen.getByTestId('action-button'));
    fireEvent.click(screen.getByTestId('dialog-confirm'));

    expect(patchMock).toHaveBeenCalledTimes(1);
    const [payload, namespace, name] = patchMock.mock.calls[0];
    expect(namespace).toBe('flux-system');
    expect(name).toBe('my-release');

    const sentAnnotations = payload.metadata.annotations;
    expect(sentAnnotations['custom.annotation/key']).toBe('custom-val');
    expect(sentAnnotations['reconcile.fluxcd.io/requestedAt']).toBeDefined();
    expect(sentAnnotations['reconcile.fluxcd.io/forceAt']).toBeDefined();
    expect(sentAnnotations['reconcile.fluxcd.io/requestedAt']).toBe(
      sentAnnotations['reconcile.fluxcd.io/forceAt']
    );

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Starting force sync for my-release', {
        variant: 'info',
      });
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Successfully requested force sync for my-release',
        { variant: 'success' }
      );
    });
  });

  it('handles patch rejection and displays error snackbar', async () => {
    const patchMock = vi.fn().mockRejectedValue(new Error('API server timeout'));
    const resource = makeResource({ patchMock });

    render(<ForceSyncAction resource={resource} />);
    fireEvent.click(screen.getByTestId('action-button'));
    fireEvent.click(screen.getByTestId('dialog-confirm'));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Failed to force sync my-release: API server timeout',
        { variant: 'error' }
      );
    });
  });
});

describe('syncRequest', () => {
  it('ordinary sync sets requestedAt but does not add forceAt', () => {
    const patchMock = vi.fn().mockResolvedValue({ metadata: {} });
    const resource = makeResource({
      annotations: { 'app.kubernetes.io/name': 'demo' },
      patchMock,
    });

    const date = '2024-01-01T00:00:00.000Z';
    syncRequest(resource, mockEnqueueSnackbar, date, false);

    expect(patchMock).toHaveBeenCalledTimes(1);
    const [payload] = patchMock.mock.calls[0];
    expect(payload.metadata.annotations['app.kubernetes.io/name']).toBe('demo');
    expect(payload.metadata.annotations['reconcile.fluxcd.io/requestedAt']).toBe(date);
    expect(payload.metadata.annotations['reconcile.fluxcd.io/forceAt']).toBeUndefined();
  });

  it('force sync sets both requestedAt and forceAt to the same date', () => {
    const patchMock = vi.fn().mockResolvedValue({ metadata: {} });
    const resource = makeResource({
      annotations: { 'app.kubernetes.io/name': 'demo' },
      patchMock,
    });

    const date = '2024-01-01T00:00:00.000Z';
    syncRequest(resource, mockEnqueueSnackbar, date, true);

    expect(patchMock).toHaveBeenCalledTimes(1);
    const [payload] = patchMock.mock.calls[0];
    expect(payload.metadata.annotations['app.kubernetes.io/name']).toBe('demo');
    expect(payload.metadata.annotations['reconcile.fluxcd.io/requestedAt']).toBe(date);
    expect(payload.metadata.annotations['reconcile.fluxcd.io/forceAt']).toBe(date);
  });
});

describe('ForceReconciliationAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders enable button when spec.force is falsy', () => {
    const resource = makeResource({ spec: { force: false } });
    render(<ForceReconciliationAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toContain('Enable force reconciliation');
  });

  it('renders disable button when spec.force is true', () => {
    const resource = makeResource({ spec: { force: true } });
    render(<ForceReconciliationAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toContain('Disable force reconciliation');
  });
});

describe('ResumeAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when spec.suspend is false', () => {
    const resource = makeResource({ spec: { suspend: false } });
    const { container } = render(<ResumeAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders resume button when spec.suspend is true', () => {
    const resource = makeResource({ spec: { suspend: true } });
    render(<ResumeAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Resume');
  });
});

describe('SuspendAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when spec.suspend is true (already suspended)', () => {
    const resource = makeResource({ spec: { suspend: true } });
    const { container } = render(<SuspendAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders suspend button when spec.suspend is false', () => {
    const resource = makeResource({ spec: { suspend: false } });
    render(<SuspendAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Suspend');
  });
});
