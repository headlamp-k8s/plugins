/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionDiffDialog } from './RevisionDiffDialog';

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
  DiffEditor: ({ original, modified }: any) => (
    <div data-testid="mock-diff-editor">
      <textarea data-testid="diff-original" value={original} readOnly />
      <textarea data-testid="diff-modified" value={modified} readOnly />
    </div>
  ),
}));

describe('RevisionDiffDialog', () => {
  const mockReleases = [
    {
      version: 1,
      chart: {
        metadata: { name: 'my-chart', version: '1.0.0' },
        values: { replicaCount: 1, image: { tag: 'v1' } },
      },
      config: { replicaCount: 1 },
      info: { last_deployed: '2026-09-01T10:00:00Z', description: 'Initial deploy' },
    },
    {
      version: 2,
      chart: {
        metadata: { name: 'my-chart', version: '1.1.0' },
        values: { replicaCount: 1, image: { tag: 'v2' } },
      },
      config: { replicaCount: 3 },
      info: { last_deployed: '2026-09-02T10:00:00Z', description: 'Scale to 3' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when closed', () => {
    render(
      <RevisionDiffDialog
        open={false}
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        releases={mockReleases}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders diff editor comparing base and target revisions', () => {
    render(
      <RevisionDiffDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        releases={mockReleases}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    const originalPane = screen.getByTestId('diff-original') as HTMLTextAreaElement;
    const modifiedPane = screen.getByTestId('diff-modified') as HTMLTextAreaElement;

    expect(originalPane.value).toContain('replicaCount: 1');
    expect(originalPane.value).toContain('tag: v1');

    expect(modifiedPane.value).toContain('replicaCount: 3');
    expect(modifiedPane.value).toContain('tag: v2');
  });

  it('swaps revisions when swap button is clicked', () => {
    render(
      <RevisionDiffDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        releases={mockReleases}
      />
    );

    const swapBtn = screen.getByRole('button', { name: /Swap revisions/i });
    fireEvent.click(swapBtn);

    const originalPane = screen.getByTestId('diff-original') as HTMLTextAreaElement;
    const modifiedPane = screen.getByTestId('diff-modified') as HTMLTextAreaElement;

    expect(originalPane.value).toContain('replicaCount: 3');
    expect(originalPane.value).toContain('tag: v2');

    expect(modifiedPane.value).toContain('replicaCount: 1');
    expect(modifiedPane.value).toContain('tag: v1');
  });

  it('toggles user defined values only', () => {
    render(
      <RevisionDiffDialog
        open
        onClose={vi.fn()}
        releaseName="test-release"
        releaseNamespace="default"
        releases={mockReleases}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /Show user defined values only/i });
    fireEvent.click(checkbox);

    const originalPane = screen.getByTestId('diff-original') as HTMLTextAreaElement;
    const modifiedPane = screen.getByTestId('diff-modified') as HTMLTextAreaElement;

    expect(originalPane.value).toContain('replicaCount: 1');
    expect(originalPane.value).not.toContain('tag: v1');

    expect(modifiedPane.value).toContain('replicaCount: 3');
    expect(modifiedPane.value).not.toContain('tag: v2');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <RevisionDiffDialog
        open
        onClose={handleClose}
        releaseName="test-release"
        releaseNamespace="default"
        releases={mockReleases}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
