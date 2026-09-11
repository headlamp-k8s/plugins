/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import List from './List';
import * as releasesApi from '../../api/releases';

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock the API calls
vi.mock('../../api/releases', () => ({
  listReleases: vi.fn(),
  getReleaseHistory: vi.fn(),
  deleteRelease: vi.fn(),
  rollbackRelease: vi.fn(),
  getActionStatus: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ children }: any) => <div>{children}</div>,
  SectionHeader: ({ title, actions }: any) => <div><h1>{title}</h1>{actions}</div>,
  SimpleTable: ({ columns, data }: any) => (
    <table>
      <thead>
        <tr>{columns.map((c: any) => <th key={c.label}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {data?.map((row: any, i: number) => (
          <tr key={i}>
            {columns.map((c: any, j: number) => <td key={j}>{c.getter(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  Link: ({ children }: any) => <a>{children}</a>,
  StatusLabel: ({ children }: any) => <span>{children}</span>,
  DateLabel: ({ date }: any) => <span>{new Date(date).toISOString()}</span>,
  Dialog: ({ open, children }: any) => open ? <div data-testid="dialog">{children}</div> : null,
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock('../../api/charts', () => ({
  fetchLatestAppVersion: vi.fn().mockResolvedValue('1.0.0'),
}));

const mockReleases = [
  { name: 'release-A', namespace: 'default', version: 1, info: { status: 'deployed', last_deployed: '2023-01-01T00:00:00Z' }, chart: { metadata: { name: 'chart-alpha', appVersion: '1.0.0' } } },
  { name: 'release-B', namespace: 'kube-system', version: 2, info: { status: 'failed', last_deployed: '2023-01-02T00:00:00Z' }, chart: { metadata: { name: 'chart-beta', appVersion: '2.0.0' } } },
  { name: 'release-C', namespace: 'default', version: 1, info: { status: 'superseded', last_deployed: '2023-01-03T00:00:00Z' }, chart: { metadata: { name: 'chart-gamma', appVersion: '1.5.0' } } },
  { name: 'app-D', namespace: 'test-ns', version: 3, info: { status: 'deployed', last_deployed: '2023-01-04T00:00:00Z' }, chart: { metadata: { name: 'chart-delta', appVersion: '3.0.0' } } },
  { name: 'app-E', namespace: 'test-ns', version: 1, info: { status: 'pending', last_deployed: '2023-01-05T00:00:00Z' }, chart: { metadata: { name: 'chart-epsilon', appVersion: '1.1.0' } } },
  { name: 'test-F', namespace: 'default', version: 1, info: { status: 'deployed', last_deployed: '2023-01-06T00:00:00Z' }, chart: { metadata: { name: 'chart-zeta', appVersion: '0.9.0' } } },
  { name: 'test-G', namespace: 'kube-system', version: 5, info: { status: 'failed', last_deployed: '2023-01-07T00:00:00Z' }, chart: { metadata: { name: 'chart-eta', appVersion: '2.2.0' } } },
  { name: 'service-H', namespace: 'default', version: 1, info: { status: 'superseded', last_deployed: '2023-01-08T00:00:00Z' }, chart: { metadata: { name: 'chart-theta', appVersion: '4.0.0' } } },
  { name: 'service-I', namespace: 'prod-ns', version: 2, info: { status: 'deployed', last_deployed: '2023-01-09T00:00:00Z' }, chart: { metadata: { name: 'chart-iota', appVersion: '1.2.3' } } },
  { name: 'db-J', namespace: 'prod-ns', version: 1, info: { status: 'deployed', last_deployed: '2023-01-10T00:00:00Z' }, chart: { metadata: { name: 'chart-kappa', appVersion: '5.0.0' } } },
];

describe('List', () => {
  it('renders releases and filters by text search', async () => {
    vi.mocked(releasesApi.listReleases).mockResolvedValue({ releases: mockReleases } as any);
    const mockFetch = vi.fn().mockResolvedValue({ releases: mockReleases });
    render(<List fetchReleases={mockFetch} />);
    
    // Wait for data to load
    const releaseA = await screen.findByText('release-A');
    expect(releaseA).toBeInTheDocument();
    expect(screen.getByText('release-B')).toBeInTheDocument();
    
    // Search by name
    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'release-' } });
    
    await waitFor(() => {
      expect(screen.queryByText('app-D')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('release-A')).toBeInTheDocument();
    expect(screen.getByText('release-B')).toBeInTheDocument();
    expect(screen.getByText('release-C')).toBeInTheDocument();
  });
});
