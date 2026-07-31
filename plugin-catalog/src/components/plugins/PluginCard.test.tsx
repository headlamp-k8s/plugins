import { PluginManager } from '@kinvolk/headlamp-plugin/lib';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PluginPackage } from './List';
import { PluginCard } from './PluginCard';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  PluginManager: {
    install: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    getStatus: vi.fn(async () => ({ type: 'success', message: 'ok' })),
    list: vi.fn(),
  },
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (!params) {
        return key;
      }
      return Object.entries(params).reduce(
        (msg, [name, value]) => msg.replace(`{{${name}}}`, value),
        key
      );
    },
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}));

vi.mock('./plugin-icon.svg', () => ({
  default: () => <svg data-testid="plugin-icon" />,
}));

const store = configureStore({
  reducer: (state = { drawerMode: { isDetailDrawerEnabled: false } }) => state,
});

function renderCard(plugin: PluginPackage) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <PluginCard plugin={plugin} />
      </BrowserRouter>
    </Provider>
  );
}

const basePlugin: PluginPackage = {
  package_id: 'pkg-1',
  name: 'sample_plugin',
  normalized_name: 'sample_plugin',
  logo_image_id: '',
  stars: 0,
  display_name: 'Sample Plugin',
  description: 'A sample plugin for tests',
  version: '1.0.0',
  deprecated: false,
  has_values_schema: false,
  signed: false,
  production_organizations_count: 0,
  ts: 0,
  official: false,
  repository: {
    url: 'https://example.com',
    kind: 21,
    name: 'headlamp',
    official: false,
    user_alias: '',
    display_name: 'Headlamp',
    repository_id: 'repo-1',
    scanner_disabled: false,
    verified_publisher: false,
  },
};

describe('PluginCard install/update actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Install button calls PluginManager.install', async () => {
    const user = userEvent.setup();
    renderCard({ ...basePlugin, isInstalled: false });

    await user.click(screen.getByRole('button', { name: 'Install' }));

    expect(PluginManager.install).toHaveBeenCalledWith(
      'headlamp_sample_plugin',
      'Sample Plugin',
      'https://artifacthub.io/packages/headlamp/headlamp/sample_plugin'
    );
  });

  test('Update button uses installedPluginName without listing plugins', async () => {
    const user = userEvent.setup();
    renderCard({
      ...basePlugin,
      isInstalled: true,
      isUpdateAvailable: true,
      installedPluginName: 'Sample Plugin Installed',
    });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(PluginManager.list).not.toHaveBeenCalled();
    expect(PluginManager.update).toHaveBeenCalledWith(
      'headlamp_sample_plugin',
      'Sample Plugin Installed'
    );
  });

  test('in-progress action shows an accessible Cancel control', async () => {
    const user = userEvent.setup();
    vi.mocked(PluginManager.getStatus).mockImplementation(
      () => new Promise(() => undefined) as ReturnType<typeof PluginManager.getStatus>
    );

    renderCard({ ...basePlugin, isInstalled: false });
    await user.click(screen.getByRole('button', { name: 'Install' }));

    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeTruthy();
  });
});
