import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { areFluxManagedActionsAllowed, FluxSettings, type PluginConfig, store } from '.';

const longClusterName = 'production-cluster-with-an-unbroken-context-name-'.repeat(4);
const clusters = vi.hoisted(() => ({ qa: {}, prod: {} } as Record<string, object>));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    K8s: { ...actual.K8s, useClustersConf: () => clusters },
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string>) =>
        key.replace(/{{(\w+)}}/g, (_, name) => options?.[name] ?? ''),
    }),
  };
});

const theme = createMuiTheme({ name: 'light', base: 'light' });

function renderSettings() {
  return render(
    <ThemeProvider theme={theme}>
      <FluxSettings />
    </ThemeProvider>
  );
}

function linkHRelSwitch() {
  return screen.getByLabelText('Link HelmReleases to Kustomizations instead of HelmRepositories');
}

function clusterSwitch(cluster: string) {
  return screen.getByLabelText(
    `Show edit, scale, delete and rollback actions on Flux-managed resources in ${cluster}`
  );
}

describe('areFluxManagedActionsAllowed', () => {
  it('allows actions only in clusters that were opted in', () => {
    const config = { allowFluxManagedActions: { qa: true, prod: false } };

    expect(areFluxManagedActionsAllowed(config, 'qa')).toBe(true);
    expect(areFluxManagedActionsAllowed(config, 'prod')).toBe(false);
    expect(areFluxManagedActionsAllowed(config, 'new-cluster')).toBe(false);
  });

  it('hides actions when nothing is stored', () => {
    expect(areFluxManagedActionsAllowed(undefined, 'qa')).toBe(false);
    expect(areFluxManagedActionsAllowed({}, 'qa')).toBe(false);
  });
});

describe('FluxSettings', () => {
  beforeEach(() => {
    store.set({} as PluginConfig);
  });

  afterEach(() => {
    delete clusters[longClusterName];
  });

  it('allows unbroken cluster names to wrap and keeps their switches usable', () => {
    clusters[longClusterName] = {};
    renderSettings();

    const label = screen.getByText(longClusterName);
    expect(getComputedStyle(label).overflowWrap).toBe('anywhere');
    fireEvent.click(label);

    expect(areFluxManagedActionsAllowed(store.get(), longClusterName)).toBe(true);
    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(false);
    expect(areFluxManagedActionsAllowed(store.get(), 'prod')).toBe(false);
  });

  it('enables actions only in the cluster whose switch was turned on', () => {
    renderSettings();

    fireEvent.click(screen.getByText('qa'));

    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(true);
    expect(areFluxManagedActionsAllowed(store.get(), 'prod')).toBe(false);
  });

  it('keeps both settings when switches are toggled one after another', () => {
    renderSettings();

    fireEvent.click(linkHRelSwitch());
    fireEvent.click(clusterSwitch('qa'));

    expect(store.get()).toMatchObject({
      linkHRelToKs: true,
      allowFluxManagedActions: { qa: true },
    });
  });

  it('keeps every cluster when cluster switches are toggled one after another', () => {
    renderSettings();

    fireEvent.click(clusterSwitch('qa'));
    fireEvent.click(clusterSwitch('prod'));

    expect(store.get()?.allowFluxManagedActions).toEqual({ qa: true, prod: true });
  });

  it('keeps a change when the page is left right after a toggle', () => {
    const { unmount } = renderSettings();

    fireEvent.click(clusterSwitch('qa'));
    unmount();

    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(true);
  });

  it('links each cluster switch to the warning', () => {
    renderSettings();

    for (const cluster of ['qa', 'prod']) {
      const warningId = clusterSwitch(cluster).getAttribute('aria-describedby');

      expect(warningId).toBeTruthy();
      expect(document.getElementById(warningId!)?.textContent).toContain(
        'Intended for testing in non-production clusters.'
      );
    }
  });

  it('uses section headings below the plugin page title', () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Map settings', level: 2 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Resource actions', level: 2 })).toBeTruthy();
  });
});
