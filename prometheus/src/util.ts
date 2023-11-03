import React from 'react';
import { useBetween } from 'use-between';

export interface PluginSettings {
  isVisible: boolean;
}

const SETTINGS_KEY = 'plugins.settings.prom_metrics';
const STORAGE_DELAY = 500; // ms

// Stores the settings in the local storage
export function storeSettings(settings: PluginSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): PluginSettings {
  const settings = localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    return JSON.parse(settings);
  }
  return { isVisible: true };
}

const _pluginSettings: PluginSettings = {
  isVisible: true,
};

export const useSettings = () => {
  const [isVisible, setIsVisible] = React.useState(!!loadSettings().isVisible);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    let isAlive = true;
    _pluginSettings.isVisible = isVisible;

    if (!!timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // We use a timeout to avoid storing the settings on every change
    timeoutRef.current = setTimeout(() => {
      if (isAlive) {
        storeSettings({ isVisible });
      }
    }, STORAGE_DELAY);

    return () => {
      if (!!timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isAlive = false;
    };
  }, [isVisible]);

  return {
    isVisible,
    setIsVisible,
  };
};

export const usePluginSettings = () => useBetween(useSettings);
