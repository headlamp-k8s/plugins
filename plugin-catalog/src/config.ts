import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export interface PluginCatalogConfig {
  displayOnlyOfficialPlugins?: boolean;
  displayOnlyVerifiedPlugins?: boolean;
  displayOnlyAksOptimizedPlugins?: boolean;
}

export const configStore = new ConfigStore<PluginCatalogConfig>('@headlamp-k8s/plugin-catalog');
export const usePluginCatalogConfig = configStore.useConfig();
