import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export interface PluginCatalogConfig {
  displayOnlyOfficialPlugins?: boolean;
  displayOnlyVerifiedPlugins?: boolean;
}

export const configStore = new ConfigStore<PluginCatalogConfig>('@headlamp-k8s/plugin-catalog');
export const usePluginCatalogConfig = configStore.useConfig();
