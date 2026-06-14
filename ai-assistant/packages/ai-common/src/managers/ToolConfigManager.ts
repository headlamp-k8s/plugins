/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Describes a tool that can be exposed to the AI assistant.
 */
type ToolInfo = {
  /** Stable identifier used in settings and tool calls. */
  id: string;
  /** Human-readable tool name. */
  name: string;
  /** Short summary shown in tool selection UIs. */
  description: string;
  /** Origin of the tool implementation. */
  source: 'built-in' | 'mcp';
};

/**
 * Built-in tools available without querying MCP servers.
 */
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

/**
 * Returns the built-in tools registry.
 */
export function getAllAvailableTools(): ToolInfo[] {
  return AVAILABLE_TOOLS;
}

/**
 * Returns whether a tool is enabled in plugin settings.
 */
export function isToolEnabled(pluginSettings: any, toolId: string): boolean {
  if (!pluginSettings || typeof pluginSettings !== 'object') return true;
  if (!pluginSettings.enabledTools) return true;
  // If enabledTools is present, check if toolId is explicitly set
  if (toolId in pluginSettings.enabledTools) {
    return !!pluginSettings.enabledTools[toolId];
  }
  return true; // Default to enabled
}

/**
 * Toggles a tool's enabled state in plugin settings.
 */
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

/**
 * Returns enabled built-in tool identifiers from plugin settings.
 */
export function getEnabledToolIds(pluginSettings: any): string[] {
  const allTools = getAllAvailableTools();
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

/**
 * Sets enabled built-in tools in plugin settings.
 */
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

/**
 * Returns whether a tool comes from the built-in registry.
 */
export function isBuiltInTool(toolName: string): boolean {
  return AVAILABLE_TOOLS.some(tool => tool.id === toolName);
}

/**
 * Returns whether a tool is provided by an MCP server.
 */
export async function isMCPTool(toolName: string): Promise<boolean> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  const tool = allTools.find(t => t.id === toolName);
  return tool?.source === 'mcp';
}

/**
 * Returns the source of the named tool.
 */
export async function getToolSource(toolName: string): Promise<'built-in' | 'mcp' | 'unknown'> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  const tool = allTools.find(t => t.id === toolName);
  return tool?.source || 'unknown';
}

/**
 * Splits an MCP tool name into server and tool components.
 */
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

/**
 * Returns built-in tools plus any MCP tools exposed by the desktop API.
 */
export async function getAllAvailableToolsIncludingMCP(): Promise<ToolInfo[]> {
  const builtInTools = getAllAvailableTools();

  // Try to get MCP tools if running in Electron environment
  try {
    if (typeof window !== 'undefined' && window.desktopApi?.mcp) {
      const mcpResponse = await window.desktopApi.mcp.getToolsConfig();
      if (mcpResponse.success && mcpResponse.config) {
        const mcpTools: ToolInfo[] = [];
        // Parse the structure: { serverName: { toolName: { enabled, description, ... } } }
        for (const [serverName, serverTools] of Object.entries(mcpResponse.config)) {
          for (const [toolName, toolConfig] of Object.entries(serverTools as Record<string, any>)) {
            mcpTools.push({
              id: `${serverName}__${toolName}`,
              name: toolName,
              description: toolConfig.description || `MCP tool: ${toolName}`,
              source: 'mcp' as const,
            });
          }
        }
        return [...builtInTools, ...mcpTools];
      }
    }
  } catch (error) {
    console.warn('Failed to fetch MCP tools for tool config management:', error);
  }

  return builtInTools;
}

/**
 * Returns enabled tool identifiers, including MCP tools.
 */
export async function getEnabledToolIdsIncludingMCP(pluginSettings: any): Promise<string[]> {
  const allTools = await getAllAvailableToolsIncludingMCP();
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

/**
 * Initializes tool state so missing settings default to all tools enabled.
 */
export async function initializeToolsState(pluginSettings: any): Promise<string[]> {
  const allTools = await getAllAvailableToolsIncludingMCP();

  // If we have no enabledTools config at all, enable all tools by default
  if (!pluginSettings || !pluginSettings.enabledTools) {
    return allTools.map(tool => tool.id);
  }

  // If we have partial config, use the isToolEnabled logic which defaults to true
  return allTools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}
