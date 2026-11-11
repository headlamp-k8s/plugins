import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configStore, PluginCatalogConfig } from '../../config';
import { PluginList, PluginPackage } from './List';

const state = vi.hoisted(() => ({
  mode: 'headlamp' as 'loading' | 'aks' | 'headlamp',
  config: {} as PluginCatalogConfig,
  list: vi.fn(async () => []),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  PluginManager: { list: state.list },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../config', () => ({
  usePluginCatalogConfig: () => state.config,
  configStore: { update: vi.fn() },
}));
vi.mock('../../aks', async importOriginal => ({
  ...(await importOriginal<typeof import('../../aks')>()),
  useCatalogMode: () => state.mode,
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionHeader: ({ titleSideActions }: { titleSideActions: ReactNode[] }) => (
    <>{titleSideActions}</>
  ),
  ConfirmDialog: ({
    open,
    title,
    description,
    onConfirm,
    handleClose,
  }: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    handleClose: () => void;
  }) =>
    open ? (
      <div role="dialog">
        {title}
        {description}
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={handleClose}>Cancel</button>
      </div>
    ) : null,
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: () => <div>Loading</div>,
}));
vi.mock('./PluginCard', () => ({
  PluginCard: ({ plugin }: { plugin: PluginPackage }) => <div>{plugin.display_name}</div>,
}));
vi.mock('./externalProxy', () => ({ getExternalProxyEndpoint: () => '/externalproxy' }));

function plugin(
  normalized_name: string,
  repository = 'headlamp-plugins',
  org = 'headlamp'
): PluginPackage {
  return {
    package_id: `${repository}/${normalized_name}`,
    name: normalized_name,
    normalized_name,
    display_name: `${repository}/${normalized_name}`,
    description: 'A plugin',
    version: '1.0.0',
    logo_image_id: '',
    stars: 0,
    deprecated: false,
    has_values_schema: false,
    signed: false,
    production_organizations_count: 0,
    ts: 0,
    official: false,
    repository: {
      name: repository,
      organization_name: org,
      url: '',
      kind: 21,
      official: false,
      user_alias: '',
      display_name: repository,
      repository_id: repository,
      scanner_disabled: false,
      verified_publisher: false,
    },
  };
}

const flux = plugin('headlamp_flux');
const other = plugin('headlamp_other');
const thirdParty = plugin('community', 'community-repo', 'community');
const impersonator = plugin('headlamp_flux', 'another-repo');

function response(packages: PluginPackage[], total = packages.length) {
  return new Response(JSON.stringify({ packages, metadata: { total } }), { status: 200 });
}

const fetchMock = vi.fn();

beforeEach(() => {
  state.mode = 'headlamp';
  state.config = {};
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    const query = new URL(new Headers(init.headers).get('Forward-To')!).searchParams;
    return response(query.has('org') ? [flux, other] : [thirdParty]);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function queries() {
  return fetchMock.mock.calls.map(
    ([, init]) => new URL(new Headers(init.headers).get('Forward-To')!).searchParams
  );
}

describe('catalog host filtering', () => {
  it('does not refetch when the host returns a new translation function on render', async () => {
    const view = render(<PluginList />);
    await screen.findByText(flux.display_name);
    const count = fetchMock.mock.calls.length;
    view.rerender(<PluginList />);
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(count);
  });

  it('keeps both stock filters on by default', async () => {
    render(<PluginList />);
    await screen.findByText(flux.display_name);
    const query = queries().find(q => !q.has('org'))!;
    expect(query.get('official')).toBe('true');
    expect(query.get('verified_publisher')).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'Only Official' })).toHaveProperty('checked', true);
  });

  it('keeps stock official/verified queries and Headlamp organization results', async () => {
    state.config = {
      displayOnlyOfficialPlugins: false,
      displayOnlyVerifiedPlugins: true,
      displayOnlyAksOptimizedPlugins: true,
    };
    render(<PluginList />);
    await screen.findByText(thirdParty.display_name);
    expect(screen.getByText(other.display_name)).toBeTruthy();
    expect(
      queries()
        .find(q => !q.has('org'))
        ?.get('official')
    ).toBe('false');
    expect(
      queries()
        .find(q => !q.has('org'))
        ?.get('verified_publisher')
    ).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'Only Official' })).toHaveProperty(
      'checked',
      false
    );
  });

  it('shows only allowlisted identities in AKS mode, without official/verified flags', async () => {
    state.mode = 'aks';
    fetchMock.mockImplementation(async () => response([flux, other, thirdParty, impersonator]));
    render(<PluginList />);
    await screen.findByText(flux.display_name);
    expect(screen.queryByText(other.display_name)).toBeNull();
    expect(screen.queryByText(thirdParty.display_name)).toBeNull();
    expect(screen.queryByText(impersonator.display_name)).toBeNull();
    expect(queries().every(q => !q.has('official') && !q.has('verified_publisher'))).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'AKS optimized' })).toHaveProperty('checked', true);
  });

  it('does not broaden AKS results when no optimized plugins are found', async () => {
    state.mode = 'aks';
    fetchMock.mockImplementation(async () => response([other, thirdParty, impersonator]));
    render(<PluginList />);
    await screen.findByText('No plugins found');
    expect(screen.queryByText(other.display_name)).toBeNull();
    expect(screen.queryByText(thirdParty.display_name)).toBeNull();
    expect(screen.queryByText(impersonator.display_name)).toBeNull();
  });

  it('uses the saved AKS off-state to show only Headlamp organization plugins across pages', async () => {
    state.mode = 'aks';
    state.config = { displayOnlyAksOptimizedPlugins: false };
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const q = new URL(new Headers(init.headers).get('Forward-To')!).searchParams;
      return q.get('offset') === '0'
        ? response(
            Array.from({ length: 60 }, (_, i) => plugin(`p${i}`)),
            62
          )
        : response([other, thirdParty], 62);
    });
    render(<PluginList />);
    await waitFor(() => expect(state.list).toHaveBeenCalled());
    expect(queries().every(q => q.get('org') === 'headlamp')).toBe(true);
    expect(queries().map(q => q.get('offset'))).toEqual(['0', '60']);
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await screen.findByText(other.display_name);
    expect(screen.queryByText(thirdParty.display_name)).toBeNull();
    expect(screen.getByRole('checkbox')).toHaveProperty('checked', false);
  });

  it('waits for initialization and ignores stale responses when the effective mode changes', async () => {
    state.mode = 'loading';
    const view = render(<PluginList />);
    expect(fetchMock).not.toHaveBeenCalled();
    const pending: ((value: Response) => void)[] = [];
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>(resolve => {
          pending.push(resolve);
        })
    );
    state.mode = 'headlamp';
    view.rerender(<PluginList />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fetchMock.mockImplementation(async () => response([flux, thirdParty]));
    state.mode = 'aks';
    view.rerender(<PluginList />);
    await screen.findByText(flux.display_name);
    await act(async () => {
      pending.forEach(resolve => resolve(response([other])));
    });
    expect(screen.queryByText(other.display_name)).toBeNull();
    expect(screen.queryByText(thirdParty.display_name)).toBeNull();
  });

  it('confirms before disabling AKS optimization and writes only the AKS preference', async () => {
    state.mode = 'aks';
    render(<PluginList />);
    await screen.findByText(flux.display_name);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('dialog').textContent).toContain(
      'Do you want to show plugins that are not AKS optimized?'
    );
    expect(configStore.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(configStore.update).toHaveBeenCalledExactlyOnceWith({
      displayOnlyAksOptimizedPlugins: false,
    });
  });

  it('reports fetch failures', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<PluginList />);
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Failed to fetch plugins'
    );
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('offers a retry instead of loading forever when fetching fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const succeed = fetchMock.getMockImplementation()!;
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<PluginList />);
    await screen.findByRole('alert');
    expect(screen.queryByText('Loading')).toBeNull();
    fetchMock.mockImplementation(succeed);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText(flux.display_name);
    expect(screen.queryByRole('alert')).toBeNull();
    log.mockRestore();
  });
});
