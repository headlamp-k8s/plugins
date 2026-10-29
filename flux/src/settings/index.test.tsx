import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { areFluxManagedActionsAllowed, FluxSettings, type PluginConfig, store } from '.';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    K8s: { ...actual.K8s, useClustersConf: () => ({ qa: {}, prod: {} }) },
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string>) =>
        key.replace(/{{(\w+)}}/g, (_, name) => options?.[name] ?? ''),
    }),
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  NameValueTable: ({ rows }: { rows: Array<{ name: ReactNode; value: ReactNode }> }) => (
    <div>
      {rows.map((row, index) => (
        <div key={index}>
          {row.name}
          {row.value}
        </div>
      ))}
    </div>
  ),
}));

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

  it('enables actions only in the cluster whose switch was turned on', () => {
    render(<FluxSettings />);

    fireEvent.click(clusterSwitch('qa'));

    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(true);
    expect(areFluxManagedActionsAllowed(store.get(), 'prod')).toBe(false);
  });

  it('keeps both settings when switches are toggled one after another', () => {
    render(<FluxSettings />);

    fireEvent.click(linkHRelSwitch());
    fireEvent.click(clusterSwitch('qa'));

    expect(store.get()).toMatchObject({
      linkHRelToKs: true,
      allowFluxManagedActions: { qa: true },
    });
  });

  it('keeps every cluster when cluster switches are toggled one after another', () => {
    render(<FluxSettings />);

    fireEvent.click(clusterSwitch('qa'));
    fireEvent.click(clusterSwitch('prod'));

    expect(store.get()?.allowFluxManagedActions).toEqual({ qa: true, prod: true });
  });

  it('keeps a change when the page is left right after a toggle', () => {
    const { unmount } = render(<FluxSettings />);

    fireEvent.click(clusterSwitch('qa'));
    unmount();

    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(true);
  });

  it('links each cluster switch to the warning', () => {
    render(<FluxSettings />);

    const warningId = clusterSwitch('qa').getAttribute('aria-describedby');

    expect(warningId).toBeTruthy();
    expect(document.getElementById(warningId!)?.textContent).toContain(
      'Intended for testing in non-production clusters.'
    );
  });
});
