import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import type {
  EventListEvent,
  ResourceDetailsViewLoadedEvent,
  ResourceListViewLoadedEvent,
} from '@kinvolk/headlamp-plugin/lib/plugin/registry';
import React from 'react';
import { useBetween } from 'use-between';
import { SavedConfigurations, StoredProviderConfig } from './utils/ProviderConfigManager';
import {
  getAllAvailableToolsIncludingMCP,
  initializeToolsState,
} from './utils/ToolConfigManager';

export const PLUGIN_NAME = '@headlamp-k8s/ai-assistant';
export const getSettingsURL = () => `/settings/plugins/${encodeURIComponent(PLUGIN_NAME)}`;

//@todo: In index.tsx the setEvent uses things from event.data into the root of the event.
//       Why does it do this? Maybe it can just use event.data as is?
//       This would simplify things and avoid copying and casts/type gymnastics.

//@todo: Can we have these names be the same? It's confusing having three names.
//      EventListEvent, OBJECT_EVENTS and headlamp.object-events

// @todo: We can't just do something like this...
//   because these types actually copy from "data" to top level... and add other fields.
// type HeadlampEventPayload =
//   | {
//       type: 'headlamp.home-page-loaded';
//       clusters: any;
//       errors: any;
//     }
//   | EventListEvent
//   | ResourceDetailsViewLoadedEvent
//   | ResourceListViewLoadedEvent;
/**
 * Event fired when a resource is loaded in the details view.
 */
// export interface ResourceDetailsViewLoadedEvent {
//     type: HeadlampEventType.DETAILS_VIEW;
//     data: {
//         /** The resource that was loaded. */
//         resource: KubeObject;
//         /** The error, if an error has occurred */
//         error?: Error;
//     };
// }
// /**
//  * Event fired when a list view is loaded for a resource.
//  */
// export interface ResourceListViewLoadedEvent {
//     type: HeadlampEventType.LIST_VIEW;
//     data: {
//         /** The list of resources that were loaded. */
//         resources: KubeObject[];
//         /** The kind of resource that was loaded. */
//         resourceKind: string;
//         /** The error, if an error has occurred */
//         error?: Error;
//     };
// }
// /**
//  * Event fired when kubernetes events are loaded (for a resource or not).
//  */
// export interface EventListEvent {
//     type: HeadlampEventType.OBJECT_EVENTS;
//     data: {
//         /** The resource for which the events were loaded. */
//         resource?: KubeObject;
//         /** The list of events that were loaded. */
//         events: Event[];
//     };
// }

// interface HeadlampEvent {
//   type?: string;
//   title?: string;
//   resource?: any;
//   items?: any[];
//   resources?: any[];
//   resourceKind?: string;
//   errors?: any[];
//   objectEvent?: {
//     events?: any[];
//   };
// }

export type HeadlampEventPayload =
  | {
      type: 'headlamp.home-page-loaded';
      title?: string;
      items?: any[];
      clusters: any;
      errors: any;
      resource?: EventListEvent['data']['resource'];
      resources?: any;
      resourceKind?: string;
      objectEvent?: any;
    }
  | {
      type: EventListEvent['type'];
      title?: string;
      items?: any[];
      objectEvent: EventListEvent['data'];
      resource?: EventListEvent['data']['resource'];
      resources: any;
      // resourceKind: EventListEvent['data']['resourceKind'];
      resourceKind: string;
    }
  | {
      type: ResourceDetailsViewLoadedEvent['type'];
      title: string;
      items?: any[];
      resource: ResourceDetailsViewLoadedEvent['data']['resource'];
      resources: any;
      resourceKind: string;
      // resourceKind: ResourceDetailsViewLoadedEvent['data']['resourceKind'];
      objectEvent?: ResourceDetailsViewLoadedEvent['data'];
    }
  | {
      type: ResourceListViewLoadedEvent['type'];
      title?: string;
      items?: any[];
      //@todo: "resource" is not set in index.tsx with setEvent. Is this a bug?
      resource: any;
      resources: ResourceListViewLoadedEvent['data']['resources'];
      resourceKind: ResourceListViewLoadedEvent['data']['resourceKind'];
      objectEvent?: ResourceListViewLoadedEvent['data'];
    };

interface PluginConfig extends SavedConfigurations {
  /** Is the AI Assistant UI panel open? */
  isUIPanelOpen?: boolean;
  /** Is the config popover shown? */
  configPopoverShown?: boolean;
  /** Saved provider configurations */
  savedProviders?: StoredProviderConfig[];
  /** Currently active provider configuration */
  activeProvider?: StoredProviderConfig;
  /** Is the plugin in test mode? */
  testMode?: boolean;
  /** Latest Headlamp event payload */
  event?: HeadlampEventPayload | null; //@todo: should this be HeadlampEventPayload?
  /** Enabled tool IDs */
  enabledTools?: string[];
  /** MCP configuration */
  mcpConfig?: any;
}

export const pluginStore = new ConfigStore<PluginConfig>(PLUGIN_NAME);
export const usePluginConfig = pluginStore.useConfig();

function usePluginSettings() {
  const [event, setEvent] = React.useState<HeadlampEventPayload | null>(null);
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
      initializeToolsState(conf)
        .then(initializedTools => {
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
        })
        .catch(error => {
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
  const setEnabledTools = async (tools: string[]) => {
    setEnabledToolsState(tools);

    // Save the tools configuration with explicit enabled/disabled states
    const currentConf = pluginStore.get() || {};

    // Get all available tools (built-in + MCP) and create explicit enabled/disabled map
    const allTools = await getAllAvailableToolsIncludingMCP();
    const enabledToolsMap: Record<string, boolean> = {};

    allTools.forEach(tool => {
      enabledToolsMap[tool.id] = tools.includes(tool.id);
    });

    pluginStore.update({
      ...currentConf,
      enabledTools: enabledToolsMap,
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
  initializeToolsState,
} from './utils/ToolConfigManager';
