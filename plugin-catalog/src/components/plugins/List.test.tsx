import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginList } from './List';

const { mockList, config } = vi.hoisted(() => ({
  mockList: vi.fn(),
  config: { displayOnlyOfficialPlugins: true, displayOnlyVerifiedPlugins: true },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => {
  return {
    ConfigStore: class {
      get() {
        return config;
      }
      useConfig() {
        return () => config;
      }
      update() {}
    },
    PluginManager: {
      list: mockList,
    },
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ConfirmDialog: () => null,
  SectionHeader: ({ title }: { title: ReactNode }) => <h1>{title}</h1>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('./PluginCard', () => ({
  PluginCard: ({ plugin }: { plugin: { display_name: string } }) => (
    <div>{plugin.display_name}</div>
  ),
}));

const plugin = {
  package_id: '1',
  name: 'test-plugin',
  display_name: 'Test Plugin',
  description: 'A test plugin',
  version: '1.0.0',
  logo_image_id: '',
  repository: { name: 'test-repo' },
};

describe('PluginList', () => {
  beforeEach(() => {
    mockList.mockResolvedValue([]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    config.displayOnlyOfficialPlugins = true;
  });

  it('shows an error with a retry instead of loading forever when Artifact Hub fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    render(<PluginList />);

    expect(await screen.findByText('Failed to load plugins from Artifact Hub.')).toBeTruthy();
    expect(screen.queryByText('Loading')).toBeNull();
    // The error shows up after the page has loaded, so screen readers only announce it as an alert.
    expect(screen.getByRole('alert').textContent).toBe('Failed to load plugins from Artifact Hub.');

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ packages: [plugin], metadata: { total: 1 } }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Test Plugin')).toBeTruthy();
    expect(screen.queryByText('Failed to load plugins from Artifact Hub.')).toBeNull();
  });

  it('ignores a failure from an older load once a newer load has succeeded', async () => {
    // Saved settings that differ from the defaults start a second load right after the first one.
    config.displayOnlyOfficialPlugins = false;
    let failFirstLoad = () => {};
    const firstLoad = new Promise(resolve => {
      failFirstLoad = () => resolve({ ok: false, status: 500 });
    });
    const success = {
      ok: true,
      json: async () => ({ packages: [plugin], metadata: { total: 1 } }),
    };
    let calls = 0;
    // The first load makes two requests (all plugins and the org's plugins); keep both pending.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => (++calls <= 2 ? firstLoad : Promise.resolve(success)))
    );

    render(<PluginList />);
    expect(await screen.findByText('Test Plugin')).toBeTruthy();

    await act(async () => {
      failFirstLoad();
      await firstLoad;
    });

    expect(screen.queryByText('Failed to load plugins from Artifact Hub.')).toBeNull();
    expect(screen.getByText('Test Plugin')).toBeTruthy();
  });
});
