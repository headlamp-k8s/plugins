import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export const PLUGIN_NAME = '@headlamp-k8s/velero';
/** Default namespace where Velero Schedule and Backup CRs are expected. */
export const DEFAULT_VELERO_NAMESPACE = 'velero';

/** Plugin settings persisted in Headlamp (Settings → Plugins → Velero). */
export interface VeleroPluginConfig {
  veleroNamespace?: string;
}

export function getConfigStore(): ConfigStore<VeleroPluginConfig> {
  return new ConfigStore<VeleroPluginConfig>(PLUGIN_NAME);
}

/** Resolves the Velero namespace from plugin config, falling back to {@link DEFAULT_VELERO_NAMESPACE}. */
export function getVeleroNamespace(config?: VeleroPluginConfig): string {
  const namespace = config?.veleroNamespace?.trim();
  return namespace || DEFAULT_VELERO_NAMESPACE;
}

/** React hook returning the configured Velero namespace for the current Headlamp session. */
export function useVeleroNamespace(): string {
  const configStore = getConfigStore();
  const usePluginConfig = configStore.useConfig();
  const config = usePluginConfig();

  return getVeleroNamespace(config);
}
