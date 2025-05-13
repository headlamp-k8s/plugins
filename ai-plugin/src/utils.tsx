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
  // Add state to control UI panel visibility
  const [isUIPanelOpen, setIsUIPanelOpen] = React.useState(false);

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
