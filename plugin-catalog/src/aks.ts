import type { PluginInfo } from '@kinvolk/headlamp-plugin/lib/plugin/pluginsSlice';
import { useSelector } from 'react-redux';

type PluginState = {
  plugins?: {
    loaded: boolean;
    pluginSettings: Pick<PluginInfo, 'name' | 'isEnabled' | 'isCompatible' | 'isLoaded'>[];
  };
};

export function selectCatalogMode(state: PluginState): 'loading' | 'aks' | 'headlamp' {
  if (!state.plugins?.loaded) return 'loading';
  return state.plugins.pluginSettings.some(
    plugin =>
      plugin.name === 'aks-desktop' &&
      plugin.isEnabled !== false &&
      plugin.isCompatible === true &&
      plugin.isLoaded === true
  )
    ? 'aks'
    : 'headlamp';
}

export function useCatalogMode() {
  return useSelector(selectCatalogMode);
}

const aksOptimizedPlugins = ['headlamp_flux', 'headlamp_cert-manager', 'headlamp_keda'];

export function isAksOptimizedPlugin(plugin: {
  normalized_name: string;
  repository?: { name: string };
}): boolean {
  return (
    plugin.repository?.name === 'headlamp-plugins' &&
    aksOptimizedPlugins.includes(plugin.normalized_name)
  );
}
