import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useBetween } from 'use-between';
import { StoredProviderConfig } from './utils/ProviderConfigManager';
import { initializeToolsState } from './utils/ToolConfigManager';

export const PLUGIN_NAME = '@headlamp-k8s/ai-assistant';
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

  // Add state for enabled tools - will be initialized properly using initializeToolsState
  const [enabledTools, setEnabledToolsState] = React.useState<string[]>([]);
  const [toolsInitialized, setToolsInitialized] = React.useState(false);

  // Initialize tools state properly on first load
  React.useEffect(() => {
    if (!toolsInitialized) {
      initializeToolsState(conf).then(initializedTools => {
        setEnabledToolsState(initializedTools);
        setToolsInitialized(true);
        
        // If this is the first time and we have tools to save, save them
        if (!conf?.enabledTools && initializedTools.length > 0) {
          const currentConf = pluginStore.get() || {};
          pluginStore.update({
            ...currentConf,
            enabledTools: initializedTools,
          });
        }
      }).catch(error => {
        console.error('Failed to initialize tools state:', error);
        // Fallback to existing behavior
        setEnabledToolsState(conf?.enabledTools ?? []);
        setToolsInitialized(true);
      });
    }
  }, [conf, toolsInitialized]);

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

  // Wrap setEnabledTools to also update the stored configuration
  const setEnabledTools = (tools: string[]) => {
    setEnabledToolsState(tools);
    // Save the tools configuration
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      enabledTools: tools,
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
    enabledTools,
    setEnabledTools,
    toolsInitialized,
  };
}

export const useGlobalState = () => useBetween(usePluginSettings);

// Export tool configuration utilities
export { 
  getAllAvailableTools, 
  isToolEnabled, 
  toggleTool,
  getAllAvailableToolsIncludingMCP,
  getEnabledToolIdsIncludingMCP,
  isMCPTool,
  parseMCPToolName,
  isBuiltInTool,
  initializeToolsState
} from './utils/ToolConfigManager';
