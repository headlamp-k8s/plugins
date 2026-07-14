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

import { isToolEnabled } from '../settings/enabledTools';
import { getAllAvailableTools, type ToolInfo } from './toolDefinitions';

/** Loads persisted MCP tool configuration from a host environment. */
export type MCPToolCatalogLoader = () => Promise<{
  success: boolean;
  config?: unknown;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns built-in tools plus enabled MCP tools supplied by the host. */
export async function getAllAvailableToolsIncludingMCP(
  loadMCPTools?: MCPToolCatalogLoader
): Promise<ToolInfo[]> {
  const builtInTools = getAllAvailableTools();
  if (!loadMCPTools) return builtInTools;

  try {
    const response = await loadMCPTools();
    if (!response.success || !isRecord(response.config)) return builtInTools;

    const mcpTools: ToolInfo[] = [];
    for (const [serverName, serverTools] of Object.entries(response.config)) {
      if (!isRecord(serverTools)) continue;
      for (const [toolName, toolConfig] of Object.entries(serverTools)) {
        if (!isRecord(toolConfig) || toolConfig.enabled === false) continue;
        mcpTools.push({
          id: `${serverName}__${toolName}`,
          name: toolName,
          description:
            typeof toolConfig.description === 'string'
              ? toolConfig.description
              : `MCP tool: ${toolName}`,
          source: 'mcp',
        });
      }
    }
    return [...builtInTools, ...mcpTools];
  } catch (error) {
    console.warn('Failed to fetch MCP tools for tool config management:', error);
    return builtInTools;
  }
}

/** Returns whether a discovered tool is supplied by an MCP server. */
export async function isMCPTool(
  toolName: string,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<boolean> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.find(tool => tool.id === toolName)?.source === 'mcp';
}

/** Returns the source of a discovered tool. */
export async function getToolSource(
  toolName: string,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<ToolInfo['source'] | 'unknown'> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.find(tool => tool.id === toolName)?.source ?? 'unknown';
}

/** Returns enabled identifiers from the complete discovered tool catalog. */
export async function getEnabledToolIdsIncludingMCP(
  pluginSettings: unknown,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<string[]> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

/** Initializes enabled state, defaulting missing settings to every discovered tool. */
export async function initializeToolsState(
  pluginSettings: unknown,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<string[]> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  const settings =
    pluginSettings !== null && typeof pluginSettings === 'object'
      ? (pluginSettings as Record<string, unknown>)
      : {};
  if (!settings.enabledTools) return tools.map(tool => tool.id);
  return tools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}
