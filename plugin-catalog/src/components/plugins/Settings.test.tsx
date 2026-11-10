import '../../index';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalogMode } from '../../aks';
import { configStore } from '../../config';
import { Settings } from './Settings';

const { registerPluginSettings } = vi.hoisted(() => ({
  registerPluginSettings: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', async () => {
  const { ConfigStore } = await vi.importActual<
    typeof import('@kinvolk/headlamp-plugin/lib/plugin/configStore')
  >('@kinvolk/headlamp-plugin/lib/plugin/configStore');
  return {
    ConfigStore,
    Headlamp: { isRunningAsApp: () => false },
    registerPluginSettings,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('./List', () => ({ PluginList: () => null }));
vi.mock('./Detail', () => ({ PluginDetail: () => null }));
vi.mock('./InstalledList', () => ({ PluginInstalledList: () => null }));
vi.mock('../../aks', () => ({ useCatalogMode: vi.fn(() => 'headlamp') }));

function renderSettings() {
  return render(
    <Provider store={store}>
      <Settings />
    </Provider>
  );
}

describe('Plugin Catalog settings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    configStore.set({});
    vi.mocked(useCatalogMode).mockReturnValue('headlamp');
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('defaults both filters on without saving defaults on mount', () => {
    renderSettings();

    expect(screen.getByRole('checkbox', { name: 'Display only official plugins' })).toHaveProperty(
      'checked',
      true
    );
    expect(screen.getByRole('checkbox', { name: 'Display only verified plugins' })).toHaveProperty(
      'checked',
      true
    );
    expect(configStore.get()).toEqual({});
  });

  it.each([
    [
      'Display only official plugins',
      'displayOnlyOfficialPlugins',
      'Show only official packages from Artifact Hub.',
    ],
    [
      'Display only verified plugins',
      'displayOnlyVerifiedPlugins',
      'Show only packages from verified publishers on Artifact Hub.',
    ],
  ] as const)(
    'immediately persists %s without replacing other settings',
    (label, key, description) => {
      const initial = {
        displayOnlyOfficialPlugins: true,
        displayOnlyVerifiedPlugins: true,
        anotherSetting: 'preserved',
      };
      configStore.set(initial);
      const { unmount } = renderSettings();

      expect(screen.getByRole('checkbox', { name: label, description })).toHaveProperty(
        'checked',
        true
      );
      fireEvent.click(screen.getByText(label));
      expect(configStore.get()).toEqual({ ...initial, [key]: false });

      vi.runOnlyPendingTimers();
      expect(
        JSON.parse(localStorage.getItem('pluginConfigs')!)['@headlamp-k8s/plugin-catalog']
      ).toEqual({ ...initial, [key]: false });

      unmount();
      renderSettings();
      expect(screen.getByRole('checkbox', { name: label })).toHaveProperty('checked', false);
      fireEvent.click(screen.getByRole('checkbox', { name: label }));
      expect(configStore.get()).toEqual(initial);
    }
  );

  it('registers settings without the host Save/Cancel footer', () => {
    expect(registerPluginSettings).toHaveBeenCalledExactlyOnceWith(
      '@headlamp-k8s/plugin-catalog',
      Settings
    );
  });

  it('preserves both modes preferences when AKS is enabled and disabled', () => {
    const initial = {
      displayOnlyOfficialPlugins: false,
      displayOnlyVerifiedPlugins: true,
      displayOnlyAksOptimizedPlugins: false,
    };
    configStore.set(initial);
    vi.mocked(useCatalogMode).mockReturnValue('aks');
    const { rerender } = renderSettings();
    expect(screen.queryByRole('checkbox', { name: 'Display only official plugins' })).toBeNull();
    expect(
      screen.getByRole('checkbox', { name: 'Display only AKS optimized Plugins' })
    ).toHaveProperty('checked', false);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(configStore.get()).toEqual({ ...initial, displayOnlyAksOptimizedPlugins: true });

    vi.mocked(useCatalogMode).mockReturnValue('headlamp');
    rerender(
      <Provider store={store}>
        <Settings />
      </Provider>
    );
    expect(
      screen.queryByRole('checkbox', { name: 'Display only AKS optimized Plugins' })
    ).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Display only official plugins' })).toHaveProperty(
      'checked',
      false
    );
    expect(screen.getByRole('checkbox', { name: 'Display only verified plugins' })).toHaveProperty(
      'checked',
      true
    );

    vi.mocked(useCatalogMode).mockReturnValue('aks');
    rerender(
      <Provider store={store}>
        <Settings />
      </Provider>
    );
    expect(screen.getByRole('checkbox')).toHaveProperty('checked', true);
  });

  it('defaults the AKS filter on without writing preferences', () => {
    vi.mocked(useCatalogMode).mockReturnValue('aks');
    renderSettings();
    expect(screen.getByRole('checkbox')).toHaveProperty('checked', true);
    expect(configStore.get()).toEqual({});
  });
});
