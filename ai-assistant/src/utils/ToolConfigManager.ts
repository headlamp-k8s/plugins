// ToolConfigManager.ts
// Simple utility for managing AI tool enable/disable state in plugin settings

export type ToolInfo = {
  id: string;
  name: string;
  description: string;
  source: 'built-in' | 'mcp';
};

// List of all available tools (add more here as needed)
const AVAILABLE_TOOLS: ToolInfo[] = [
  {
    id: 'kubernetes_api_request',
    name: 'Kubernetes API Request',
    description:
      'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
    source: 'built-in',
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

// Check if a tool is a built-in tool (from AVAILABLE_TOOLS registry)
export function isBuiltInTool(toolName: string): boolean {
  return AVAILABLE_TOOLS.some(tool => tool.id === toolName);
}

// Check if a tool is an MCP tool by consulting the tool registry
// This is async because we need to fetch MCP tools to check
export async function isMCPTool(toolName: string): Promise<boolean> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  const tool = allTools.find(t => t.id === toolName);
  return tool?.source === 'mcp';
}

// Get the source of a tool (built-in or MCP)
export async function getToolSource(toolName: string): Promise<'built-in' | 'mcp' | 'unknown'> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  const tool = allTools.find(t => t.id === toolName);
  return tool?.source || 'unknown';
}

// Parse MCP tool name to extract server and tool components
export function parseMCPToolName(fullToolName: string): { serverName: string; toolName: string } {
  const parts = fullToolName.split('__');
  if (parts.length >= 2) {
    return {
      serverName: parts[0],
      toolName: parts.slice(1).join('__'),
    };
  }
  return {
    serverName: 'default',
    toolName: fullToolName,
  };
}

// Get all available tools (both built-in and MCP tools)
// This function needs to be async to fetch MCP tools
export async function getAllAvailableToolsIncludingMCP(): Promise<ToolInfo[]> {
  const builtInTools = getAllAvailableTools();
  
  // Try to get MCP tools if running in Electron environment
  try {
    if (typeof window !== 'undefined' && window.desktopApi?.mcp) {
      const mcpResponse = await window.desktopApi.mcp.getTools();
      if (mcpResponse.success && mcpResponse.tools) {
        const mcpTools: ToolInfo[] = mcpResponse.tools.map(tool => ({
          id: tool.name,
          name: tool.name,
          description: tool.description || `MCP tool: ${tool.name}`,
          source: 'mcp' as const,
        }));
        return [...builtInTools, ...mcpTools];
      }
    }
  } catch (error) {
    console.warn('Failed to fetch MCP tools for tool config management:', error);
  }
  
  return builtInTools;
}

// Get enabled tool IDs including MCP tools
export async function getEnabledToolIdsIncludingMCP(pluginSettings: any): Promise<string[]> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

// Initialize tools state properly on app load
// This ensures that on first load, all tools are enabled (default behavior)
// but respects any saved configuration if it exists
export async function initializeToolsState(pluginSettings: any): Promise<string[]> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  
  // If we have no enabledTools config at all, enable all tools by default
  if (!pluginSettings || !pluginSettings.enabledTools) {
    return allTools.map(tool => tool.id);
  }
  
  // If we have partial config, use the isToolEnabled logic which defaults to true
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}
