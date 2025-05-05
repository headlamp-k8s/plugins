import React from 'react';
import { useBetween } from 'use-between';
import { StoredProviderConfig } from './utils/ProviderConfigManager';

function usePluginSettings() {
  const [event, setEvent] = React.useState(null);
  // Add states to track providers and active provider
  const [savedProviders, setSavedProviders] = React.useState<StoredProviderConfig[]>([]);
  const [activeProvider, setActiveProvider] = React.useState<StoredProviderConfig | null>(null);

  return {
    event,
    setEvent,
    savedProviders,
    setSavedProviders,
    activeProvider,
    setActiveProvider,
  };
}

export const useGlobalState = () => useBetween(usePluginSettings);
