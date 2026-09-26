/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionValuesDialog } from './RevisionValuesDialog';

const mockEnqueueSnackbar = vi.fn();

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (!params) return key;
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(`{{ ${k} }}`, String(v)).replace(`{{${k}}}`, String(v)),
        key
      );
    },
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Dialog: ({ open, title, children }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: any) => <textarea data-testid="mock-monaco-editor" value={value} readOnly />,
}));

describe('RevisionValuesDialog', () => {
  const mockRevision = {
    version: 2,
    chart: {
      metadata: {
        name: 'my-chart',
        version: '1.2.0',
        appVersion: '2.0.0',
      },
      values: {
        replicaCount: 1,
        image: { repository: 'nginx', tag: 'latest' },
      },
    },
    config: {
      replicaCount: 3,
    },
    info: {
      description: 'Upgrade release to 1.2.0',
      status: 'deployed',
      last_deployed: '2026-09-01T10:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when closed', () => {
    render(
      <RevisionValuesDialog
        open={false}
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        revision={mockRevision}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog with revision details and computed values', () => {
    render(
      <RevisionValuesDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        revision={mockRevision}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('my-chart')).toBeDefined();
    expect(screen.getAllByText(/1\.2\.0/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2.0.0')).toBeDefined();

    const editor = screen.getByTestId('mock-monaco-editor') as HTMLTextAreaElement;
    expect(editor.value).toContain('replicaCount: 3');
    expect(editor.value).toContain('repository: nginx');
  });

  it('toggles user defined values only', () => {
    render(
      <RevisionValuesDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        revision={mockRevision}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /Show user defined values only/i });
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);

    const editor = screen.getByTestId('mock-monaco-editor') as HTMLTextAreaElement;
    expect(editor.value).toContain('replicaCount: 3');
    expect(editor.value).not.toContain('repository: nginx');
  });

  it('copies YAML content to clipboard on copy button click', async () => {
    render(
      <RevisionValuesDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        revision={mockRevision}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copy to clipboard/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('calls onClose when Close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <RevisionValuesDialog
        open
        onClose={handleClose}
        releaseName="test-release"
        releaseNamespace="default"
        revision={mockRevision}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
