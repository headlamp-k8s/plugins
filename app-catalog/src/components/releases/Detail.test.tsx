/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReleaseDetail from './Detail';

const mockGetRelease = vi.fn();
const mockGetReleaseHistory = vi.fn();
const mockDeleteRelease = vi.fn();
const mockGetActionStatus = vi.fn();
const mockRollbackRelease = vi.fn();

vi.mock('../../api/releases', () => ({
  getRelease: (...args: any[]) => mockGetRelease(...args),
  getReleaseHistory: (...args: any[]) => mockGetReleaseHistory(...args),
  deleteRelease: (...args: any[]) => mockDeleteRelease(...args),
  getActionStatus: (...args: any[]) => mockGetActionStatus(...args),
  rollbackRelease: (...args: any[]) => mockRollbackRelease(...args),
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

vi.mock('react-router', () => ({
  useParams: () => ({ namespace: 'default', releaseName: 'demo-app' }),
  useHistory: () => ({ replace: vi.fn() }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Router: {
    createRouteURL: (route: string) => route,
  },
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
  ActionButton: ({ description, onClick, iconButtonProps }: any) => (
    <button
      type="button"
      aria-label={description}
      disabled={Boolean(iconButtonProps?.disabled)}
      onClick={onClick}
    >
      {description}
    </button>
  ),
  DateLabel: ({ date }: any) => <span data-testid="date-label">{String(date)}</span>,
  Dialog: ({ open, title, children }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
  NameValueTable: ({ rows }: any) => (
    <div data-testid="name-value-table">
      {rows.map((r: any) => (
        <div key={r.name}>
          <span>{r.name}</span>
          <span>{r.value}</span>
        </div>
      ))}
    </div>
  ),
  SectionBox: ({ title, children }: any) => (
    <section>
      <div>{title}</div>
      {children}
    </section>
  ),
  SectionHeader: ({ title, actions }: any) => (
    <header>
      <h3>{title}</h3>
      <div>{actions}</div>
    </header>
  ),
  SimpleTable: ({ data, columns }: any) => (
    <table>
      <thead>
        <tr>
          {columns.map((col: any) => (
            <th key={col.label}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(data || []).map((row: any, rowIdx: number) => (
          <tr key={row.version ?? rowIdx} data-testid={`history-row-${row.version}`}>
            {columns.map((col: any) => (
              <td key={col.label}>{col.getter(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ status, children }: any) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
}));

vi.mock('./EditorDialog', () => ({
  EditorDialog: () => null,
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: any) => <textarea data-testid="mock-monaco-editor" value={value} readOnly />,
  DiffEditor: ({ original, modified }: any) => (
    <div data-testid="mock-diff-editor">
      <textarea data-testid="diff-original" value={original} readOnly />
      <textarea data-testid="diff-modified" value={modified} readOnly />
    </div>
  ),
}));

describe('ReleaseDetail History', () => {
  const rev1 = {
    version: 1,
    name: 'demo-app',
    namespace: 'default',
    chart: {
      metadata: { name: 'nginx', version: '1.0.0', appVersion: '1.24.0' },
      values: { replicaCount: 1, image: { tag: '1.24' } },
    },
    config: { replicaCount: 1 },
    info: {
      status: 'superseded',
      description: 'Install complete',
      last_deployed: '2026-09-01T10:00:00Z',
    },
  };

  const rev2 = {
    version: 2,
    name: 'demo-app',
    namespace: 'default',
    chart: {
      metadata: { name: 'nginx', version: '1.1.0', appVersion: '1.25.0' },
      values: { replicaCount: 1, image: { tag: '1.25' } },
    },
    config: { replicaCount: 3 },
    info: {
      status: 'deployed',
      description: 'Upgrade complete',
      last_deployed: '2026-09-02T10:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('evaluates each historical revision status individually instead of using current release status', async () => {
    mockGetRelease.mockResolvedValue(rev2);
    mockGetReleaseHistory.mockResolvedValue({ releases: [rev1, rev2] });

    render(<ReleaseDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('history-row-1')).toBeDefined();
      expect(screen.getByTestId('history-row-2')).toBeDefined();
    });

    const row1Status = screen
      .getByTestId('history-row-1')
      .querySelector('[data-testid="status-label"]');
    const row2Status = screen
      .getByTestId('history-row-2')
      .querySelector('[data-testid="status-label"]');

    expect(row1Status?.textContent).toBe('superseded');
    expect(row1Status?.getAttribute('data-status')).toBe('error');
    expect(row2Status?.textContent).toBe('deployed');
    expect(row2Status?.getAttribute('data-status')).toBe('success');
  });

  it('opens RevisionValuesDialog for the selected revision and Compare with current for historical rows', async () => {
    mockGetRelease.mockResolvedValue(rev2);
    mockGetReleaseHistory.mockResolvedValue({ releases: [rev1, rev2] });

    render(<ReleaseDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('history-row-1')).toBeDefined();
    });

    const row1 = screen.getByTestId('history-row-1');
    const row2 = screen.getByTestId('history-row-2');

    const row2CompareBtn = row2.querySelector(
      'button[aria-label="Compare with current"]'
    ) as HTMLButtonElement;
    const row1CompareBtn = row1.querySelector(
      'button[aria-label="Compare with current"]'
    ) as HTMLButtonElement;

    expect(row2CompareBtn.disabled).toBe(true);
    expect(row1CompareBtn.disabled).toBe(false);

    const row1ViewBtn = row1.querySelector('button[aria-label="View Values"]') as HTMLButtonElement;
    fireEvent.click(row1ViewBtn);

    expect(screen.getByText('Revision 1 Values - demo-app (default)')).toBeDefined();
    const editor = screen.getByTestId('mock-monaco-editor') as HTMLTextAreaElement;
    expect(editor.value).toContain('replicaCount: 1');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(row1CompareBtn);
    expect(screen.getByText('Compare Revisions - demo-app (default)')).toBeDefined();
    expect(screen.getByText('Left: Revision 1 | Right: Revision 2')).toBeDefined();
  });

  it('disables Compare Revisions when history has fewer than two revisions or missing releases array', async () => {
    mockGetRelease.mockResolvedValue(rev1);
    mockGetReleaseHistory.mockResolvedValue({});

    render(<ReleaseDetail />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Compare Revisions' })).toBeDefined();
    });

    const compareHeaderBtn = screen.getByRole('button', {
      name: 'Compare Revisions',
    }) as HTMLButtonElement;
    expect(compareHeaderBtn.disabled).toBe(true);
  });

  it('disables Compare with current when current release version is not present in history', async () => {
    mockGetRelease.mockResolvedValue({ ...rev2, version: 5 });
    mockGetReleaseHistory.mockResolvedValue({ releases: [rev1, rev2] });

    render(<ReleaseDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('history-row-1')).toBeDefined();
    });

    const compareButtons = screen.getAllByRole('button', {
      name: 'Compare with current',
    }) as HTMLButtonElement[];
    expect(compareButtons.every(btn => btn.disabled)).toBe(true);
  });
});
