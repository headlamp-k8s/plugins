import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  ConfirmDialog: () => null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../sources/Source', () => ({
  useSource: () => null,
}));

import { ForceReconciliationAction, ResumeAction, SuspendAction } from './index';

function makeResource(spec: Record<string, unknown> | undefined) {
  return {
    metadata: { name: 'test-release', namespace: 'default' },
    jsonData: {
      metadata: { name: 'test-release', namespace: 'default' },
      ...(spec !== undefined ? { spec } : {}),
    },
    constructor: {
      apiEndpoint: {
        patch: vi.fn().mockResolvedValue({ spec: {} }),
      },
    },
  };
}

describe('ForceReconciliationAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when resource.jsonData.spec is missing', () => {
    const resource = makeResource(undefined);
    const { container } = render(<ForceReconciliationAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders enable button when spec.force is falsy', () => {
    const resource = makeResource({ force: false });
    render(<ForceReconciliationAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toContain('Enable force reconciliation');
  });

  it('renders disable button when spec.force is true', () => {
    const resource = makeResource({ force: true });
    render(<ForceReconciliationAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toContain('Disable force reconciliation');
  });
});

describe('ResumeAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when resource.jsonData.spec is missing', () => {
    const resource = makeResource(undefined);
    const { container } = render(<ResumeAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when spec.suspend is false', () => {
    const resource = makeResource({ suspend: false });
    const { container } = render(<ResumeAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders resume button when spec.suspend is true', () => {
    const resource = makeResource({ suspend: true });
    render(<ResumeAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Resume');
  });
});

describe('SuspendAction', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders suspend button when resource.jsonData.spec is missing (suspend defaults to falsy)', () => {
    const resource = makeResource(undefined);
    render(<SuspendAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Suspend');
  });

  it('renders nothing when spec.suspend is true (already suspended)', () => {
    const resource = makeResource({ suspend: true });
    const { container } = render(<SuspendAction resource={resource} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders suspend button when spec.suspend is false', () => {
    const resource = makeResource({ suspend: false });
    render(<SuspendAction resource={resource} />);
    const button = screen.getByTestId('action-button');
    expect(button.getAttribute('data-description')).toBe('Suspend');
  });
});
