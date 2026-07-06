import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export const PLUGIN_NAME = '@headlamp-k8s/velero';
export const DEFAULT_VELERO_NAMESPACE = 'velero';

export interface VeleroPluginConfig {
  veleroNamespace?: string;
}

export function getConfigStore(): ConfigStore<VeleroPluginConfig> {
  return new ConfigStore<VeleroPluginConfig>(PLUGIN_NAME);
}

export function getVeleroNamespace(config?: VeleroPluginConfig): string {
  const namespace = config?.veleroNamespace?.trim();
  return namespace || DEFAULT_VELERO_NAMESPACE;
}

export function useVeleroNamespace(): string {
  const configStore = getConfigStore();
  const usePluginConfig = configStore.useConfig();
  const config = usePluginConfig();

  return getVeleroNamespace(config);
}
