import React from 'react';
import { useBetween } from 'use-between';
import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { StoredProviderConfig } from './utils/ProviderConfigManager';

export const PLUGIN_NAME = '@headlamp-k8s/headlamp-ai';
export const getSettingsURL = () => `/settings/plugins/${encodeURIComponent(PLUGIN_NAME)}`;

export const pluginStore = new ConfigStore(PLUGIN_NAME);
export const usePluginConfig = pluginStore.useConfig();

function usePluginSettings() {
  const [event, setEvent] = React.useState(null);
  // Add states to track providers and active provider
  const [savedProviders, setSavedProviders] = React.useState<StoredProviderConfig[]>([]);
  const [activeProvider, setActiveProvider] = React.useState<StoredProviderConfig | null>(null);

  // Get the current configuration
  const conf = pluginStore.get();

  // Add state to control UI panel visibility - initialize from stored settings
  const [isUIPanelOpen, setIsUIPanelOpenState] = React.useState(conf?.isUIPanelOpen ?? false);

  // Wrap setIsUIPanelOpen to also update the stored configuration
  const setIsUIPanelOpen = (isOpen: boolean) => {
    setIsUIPanelOpenState(isOpen);
    // Save the panel state to configuration
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      isUIPanelOpen: isOpen,
    });
  };

  return {
    event,
    setEvent,
    savedProviders,
    setSavedProviders,
    activeProvider,
    setActiveProvider,
    isUIPanelOpen,
    setIsUIPanelOpen,
  };
}

export const useGlobalState = () => useBetween(usePluginSettings);
