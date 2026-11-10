import { describe, expect, it } from 'vitest';
import { isAksOptimizedPlugin, selectCatalogMode } from './aks';

const aks = { name: 'aks-desktop', isEnabled: true, isCompatible: true, isLoaded: true };

describe('catalog mode', () => {
  it('waits for plugin initialization', () => {
    expect(selectCatalogMode({})).toBe('loading');
    expect(selectCatalogMode({ plugins: { loaded: false, pluginSettings: [aks] } })).toBe(
      'loading'
    );
  });

  it('uses AKS mode only for the selected, enabled, compatible AKS plugin', () => {
    const mode = (pluginSettings: (typeof aks)[]) =>
      selectCatalogMode({ plugins: { loaded: true, pluginSettings } });
    expect(mode([aks])).toBe('aks');
    expect(mode([])).toBe('headlamp');
    expect(mode([{ ...aks, name: 'azure-aks' }])).toBe('headlamp');
    expect(mode([{ ...aks, isEnabled: false }])).toBe('headlamp');
    expect(mode([{ ...aks, isCompatible: false }])).toBe('headlamp');
    expect(mode([{ ...aks, isLoaded: false }])).toBe('headlamp');
    expect(mode([{ ...aks, isLoaded: false }, aks])).toBe('aks');
    expect(
      mode([
        { ...aks, isLoaded: false },
        { ...aks, isEnabled: false },
      ])
    ).toBe('headlamp');
  });
});

describe('AKS optimized plugins', () => {
  it.each(['headlamp_flux', 'headlamp_cert-manager', 'headlamp_keda'])(
    'matches %s only in the expected repository',
    normalized_name => {
      expect(
        isAksOptimizedPlugin({ normalized_name, repository: { name: 'headlamp-plugins' } })
      ).toBe(true);
      expect(isAksOptimizedPlugin({ normalized_name, repository: { name: 'another-repo' } })).toBe(
        false
      );
      expect(isAksOptimizedPlugin({ normalized_name })).toBe(false);
    }
  );

  it('rejects other plugins in the same repository', () => {
    expect(
      isAksOptimizedPlugin({
        normalized_name: 'headlamp_other',
        repository: { name: 'headlamp-plugins' },
      })
    ).toBe(false);
  });
});
