import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginDetail } from './Detail';

const { mockFetch, mockGetStatus, mockInstall, mockList } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockGetStatus: vi.fn(),
  mockInstall: vi.fn(),
  mockList: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  PluginManager: {
    getStatus: mockGetStatus,
    install: mockInstall,
    list: mockList,
  },
  Router: {
    createRouteURL: (routeName: string) => `/${routeName}`,
  },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      values
        ? Object.entries(values).reduce(
            (message, [name, value]) => message.replace(`{{${name}}}`, value),
            key
          )
        : key,
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ActionButton: ({ description, onClick }: { description: string; onClick: () => void }) => (
    <button onClick={onClick}>{description}</button>
  ),
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  Loader: () => <div>Loading</div>,
  NameValueTable: () => null,
  SectionBox: ({ title }: { title: ReactNode }) => <div>{title}</div>,
  SectionHeader: ({ title, actions }: { title: string; actions: ReactNode[] }) => (
    <div>
      <h1>{title}</h1>
      {actions.map((action, index) => (
        <span key={index}>{action}</span>
      ))}
    </div>
  ),
}));

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

vi.mock('./LoadingButton', () => ({
  default: ({ onCancel }: { onCancel: () => void }) => <button onClick={onCancel}>Cancel</button>,
}));

vi.mock('react-router', () => ({
  useParams: () => ({
    repoName: 'test-repo',
    pluginName: 'test-plugin',
  }),
}));

const pluginDetail = {
  isInstalled: false,
  currentVersion: '',
  packageName: '',
  updateAvailable: false,
  package_id: '1',
  name: 'test-plugin',
  normalized_name: 'test-plugin',
  is_operator: false,
  display_name: 'Test Plugin',
  description: 'A test plugin',
  logo_image_id: '',
  readme: '# Test Plugin',
  data: {
    'headlamp/plugin/archive-url': 'https://example.com/archive',
    'headlamp/plugin/distro-compat': 'Any',
    'headlamp/plugin/version-compat': '1.0.0',
    'headlamp/plugin/archive-checksum': 'abc123',
  },
  version: '1.0.0',
  available_versions: [
    { version: '1.0.0', contains_security_updates: false, prerelease: false, ts: 1 },
  ],
  deprecated: false,
  contains_security_updates: false,
  prerelease: false,
  signed: true,
  has_values_schema: false,
  has_changelog: false,
  ts: 1,
  repository: {
    repository_id: 'repo1',
    name: 'test-repo',
    display_name: 'Test Repo',
    url: 'https://example.com',
    branch: 'main',
    private: false,
    kind: 0,
    verified_publisher: true,
    official: true,
    scanner_disabled: false,
    user_alias: 'test-user',
  },
  stats: {
    subscriptions: 0,
    webhooks: 0,
  },
  production_organizations_count: 0,
  relative_path: '/plugins/test-plugin',
};

describe('PluginDetail', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...pluginDetail }),
    });
    mockGetStatus.mockResolvedValue({ type: 'success', message: 'Installed' });
    mockInstall.mockResolvedValue(undefined);
    mockList.mockResolvedValue([]);
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('starts only one status poll when an install action begins', async () => {
    render(<PluginDetail />);

    fireEvent.click(await screen.findByRole('button', { name: 'Install' }));

    await waitFor(() => {
      expect(mockInstall).toHaveBeenCalledWith(
        'test-repo_test-plugin',
        'Test Plugin',
        'https://artifacthub.io/packages/headlamp/test-repo/test-plugin/1.0.0'
      );
      // Initial page load, action start, then completion reload should not duplicate status polling.
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockGetStatus).toHaveBeenCalledTimes(1);
    });
  });
});
