import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.useFakeTimers();
    store.set({} as PluginConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enables actions only in the cluster whose switch was turned on', () => {
    render(<FluxSettings />);

    fireEvent.click(clusterSwitch('qa'));
    act(() => vi.advanceTimersByTime(100));

    expect(areFluxManagedActionsAllowed(store.get(), 'qa')).toBe(true);
    expect(areFluxManagedActionsAllowed(store.get(), 'prod')).toBe(false);
  });

  it('keeps both settings when switches are toggled within the save delay', () => {
    render(<FluxSettings />);

    fireEvent.click(linkHRelSwitch());
    act(() => vi.advanceTimersByTime(50));
    fireEvent.click(clusterSwitch('qa'));
    act(() => vi.advanceTimersByTime(100));

    expect(store.get()).toMatchObject({
      linkHRelToKs: true,
      allowFluxManagedActions: { qa: true },
    });
  });

  it('keeps every cluster when cluster switches are toggled within the save delay', () => {
    render(<FluxSettings />);

    fireEvent.click(clusterSwitch('qa'));
    act(() => vi.advanceTimersByTime(50));
    fireEvent.click(clusterSwitch('prod'));
    act(() => vi.advanceTimersByTime(100));

    expect(store.get()?.allowFluxManagedActions).toEqual({ qa: true, prod: true });
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
