// ToolConfigManager.ts
// Simple utility for managing AI tool enable/disable state in plugin settings

export type ToolInfo = {
  id: string;
  name: string;
  description: string;
};

// List of all available tools (add more here as needed)
const AVAILABLE_TOOLS: ToolInfo[] = [
  {
    id: 'kubernetes_api_request',
    name: 'Kubernetes API Request',
    description:
      'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
  },
  // Add more tools here as needed
];

// Returns the list of all available tools
export function getAllAvailableTools(): ToolInfo[] {
  return AVAILABLE_TOOLS;
}

// Checks if a tool is enabled in the plugin settings (default: true)
export function isToolEnabled(pluginSettings: any, toolId: string): boolean {
  if (!pluginSettings || typeof pluginSettings !== 'object') return true;
  if (!pluginSettings.enabledTools) return true;
  // If enabledTools is present, check if toolId is explicitly set
  if (toolId in pluginSettings.enabledTools) {
    return !!pluginSettings.enabledTools[toolId];
  }
  return true; // Default to enabled
}

// Toggles a tool's enabled state in the plugin settings
export function toggleTool(pluginSettings: any, toolId: string): any {
  const current = pluginSettings?.enabledTools?.[toolId];
  const newEnabled = !current;
  return {
    ...pluginSettings,
    enabledTools: {
      ...(pluginSettings?.enabledTools || {}),
      [toolId]: newEnabled,
    },
  };
}

// Returns a list of enabled tool IDs from plugin settings
export function getEnabledToolIds(pluginSettings: any): string[] {
  const allTools = getAllAvailableTools();
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

// Sets the enabled tools list in plugin settings
export function setEnabledTools(pluginSettings: any, enabledToolIds: string[]): any {
  const enabledTools: Record<string, boolean> = {};

  // Get all available tools and set their enabled state
  const allTools = getAllAvailableTools();
  allTools.forEach(tool => {
    enabledTools[tool.id] = enabledToolIds.includes(tool.id);
  });

  return {
    ...pluginSettings,
    enabledTools,
  };
}
