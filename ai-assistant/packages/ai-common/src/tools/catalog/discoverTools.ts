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
  /** Whether the host configuration request succeeded. */
  success: boolean;
  /** Unvalidated MCP tool configuration grouped by server and tool name. */
  config?: unknown;
}>;

/**
 * Checks whether a value is a non-array object record.
 *
 * @param value - Unvalidated value to inspect.
 * @returns Whether the value can be read as a string-keyed record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns built-in tools plus enabled MCP tools supplied by the host.
 *
 * @param loadMCPTools - Optional host loader for persisted MCP tool metadata.
 * @returns Built-ins followed by valid enabled MCP tools; built-ins only on failure.
 */
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

/**
 * Checks whether a discovered tool is supplied by an MCP server.
 *
 * @param toolName - Full tool identifier to find.
 * @param loadMCPTools - Optional host loader for persisted MCP tool metadata.
 * @returns Whether the discovered tool has MCP provenance.
 */
export async function isMCPTool(
  toolName: string,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<boolean> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.find(tool => tool.id === toolName)?.source === 'mcp';
}

/**
 * Returns the source of a discovered tool.
 *
 * @param toolName - Full tool identifier to find.
 * @param loadMCPTools - Optional host loader for persisted MCP tool metadata.
 * @returns `built-in`, `mcp`, or `unknown` when no tool matches.
 */
export async function getToolSource(
  toolName: string,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<ToolInfo['source'] | 'unknown'> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.find(tool => tool.id === toolName)?.source ?? 'unknown';
}

/**
 * Returns enabled identifiers from the complete discovered tool catalog.
 *
 * @param pluginSettings - Persisted enabled-tool settings.
 * @param loadMCPTools - Optional host loader for persisted MCP tool metadata.
 * @returns Discovered tool identifiers considered enabled by settings.
 */
export async function getEnabledToolIdsIncludingMCP(
  pluginSettings: unknown,
  loadMCPTools?: MCPToolCatalogLoader
): Promise<string[]> {
  const tools = await getAllAvailableToolsIncludingMCP(loadMCPTools);
  return tools.map(tool => tool.id).filter(toolId => isToolEnabled(pluginSettings, toolId));
}

/**
 * Initializes enabled state, defaulting missing settings to every discovered tool.
 *
 * @param pluginSettings - Persisted settings to inspect for an enabled-tools value.
 * @param loadMCPTools - Optional host loader for persisted MCP tool metadata.
 * @returns Every discovered ID when settings are missing, otherwise enabled IDs.
 */
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
