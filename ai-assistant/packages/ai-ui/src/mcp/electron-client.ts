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

// Frontend MCP client that communicates with Electron main process
// This replaces the direct MCP client import to avoid spawn issues in renderer process

import type { ToolClient } from '@headlamp-k8s/ai-common/mcp/client/ToolClient';
import type { MCPSettings, MCPToolsConfig, MCPToolState } from '@headlamp-k8s/ai-common/mcp/types';
import type { ElectronMCPApi, MCPTool } from '../types/electron';

/** Metadata describing an MCP tool exposed by Electron. */
interface ElectronMCPTool extends MCPTool {
  /** Server that provides the tool. */
  server?: string;
}

/**
 * Returns the Electron MCP bridge when running in the desktop environment.
 *
 * @returns Renderer MCP bridge, or `undefined` outside Electron.
 */
function getDesktopMCPApi(): ElectronMCPApi | undefined {
  return typeof window === 'undefined' ? undefined : window.desktopApi?.mcp;
}
// Type augmentation is handled by src/types/electron.d.ts

/**
 * Wraps Electron MCP IPC calls in a renderer-friendly client API.
 *
 * Each operation resolves the bridge again so a client created before preload
 * injection can become available without being reconstructed.
 */
class ElectronMCPClient implements ToolClient {
  /**
   * Reports whether the Electron MCP bridge is currently available.
   *
   * @returns Whether MCP operations can be sent through Electron.
   */
  isAvailable(): boolean {
    return getDesktopMCPApi() !== undefined;
  }

  /**
   * Gets available MCP tools from the Electron main process.
   *
   * @returns Discovered tools, or an empty array when unavailable or unsuccessful.
   */
  async getTools(): Promise<ElectronMCPTool[]> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      console.warn('MCP client not available - not running in Electron environment');
      return [];
    }
    if (!mcpApi.getTools) {
      return this.getEnabledTools();
    }

    try {
      const response = await mcpApi.getTools();
      if (response.success && response.tools) {
        return response.tools;
      }
      console.warn('Failed to get MCP tools:', response.error);
      return [];
    } catch (error) {
      console.error('Error getting MCP tools from Electron:', error);
      return [];
    }
  }

  /**
   * Executes an MCP tool through the Electron main process.
   *
   * @param toolName - Qualified name of the tool to execute.
   * @param args - Arguments supplied to the tool.
   * @param toolCallId - Optional correlation identifier for the tool call.
   * @returns Raw result supplied by the Electron bridge.
   * @throws When the bridge is unavailable or execution fails.
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string
  ): Promise<unknown> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      throw new Error('MCP client not available - not running in Electron environment');
    }

    try {
      const response = await mcpApi.executeTool(toolName, args, toolCallId);

      if (response.success) {
        return response.result;
      }
      throw new Error(response.error || 'Unknown error executing MCP tool');
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Gets MCP client status from the Electron main process.
   *
   * @returns Initialization and client-presence status, defaulting to false values on failure.
   */
  async getStatus(): Promise<{ isInitialized: boolean; hasClient: boolean }> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return { isInitialized: false, hasClient: false };
    }

    try {
      return await mcpApi.getStatus();
    } catch (error) {
      console.error('Error getting MCP status:', error);
      return { isInitialized: false, hasClient: false };
    }
  }

  /**
   * Resets the MCP client in the Electron main process.
   *
   * @returns Whether the reset succeeded.
   */
  async resetClient(): Promise<boolean> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return false;
    }

    try {
      const response = await mcpApi.resetClient();
      return response.success;
    } catch (error) {
      console.error('Error resetting MCP client:', error);
      return false;
    }
  }

  /**
   * Gets MCP server configuration from the Electron main process.
   *
   * @returns Success envelope containing configuration or an error description.
   */
  async getConfig(): Promise<{ success: boolean; config?: MCPSettings; error?: string }> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }

    try {
      return await mcpApi.getConfig();
    } catch (error) {
      console.error('Error getting MCP config:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Gets persisted MCP tool configuration from the Electron main process.
   *
   * @returns Success envelope containing tool state or an error description.
   */
  async getToolsConfig(): Promise<{
    success: boolean;
    config?: MCPToolsConfig;
    error?: string;
  }> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }

    try {
      return await mcpApi.getToolsConfig();
    } catch (error) {
      console.error('Error getting MCP tools config:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Updates persisted MCP tool configuration in the Electron main process.
   *
   * @param config - Tool state grouped by server and tool name.
   * @returns Whether the update succeeded.
   */
  async updateToolsConfig(config: MCPToolsConfig): Promise<boolean> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return false;
    }

    try {
      const response = await mcpApi.updateToolsConfig(config);
      return response.success;
    } catch (error) {
      console.error('Error updating MCP tools config:', error);
      return false;
    }
  }

  /**
   * Enables or disables a specific MCP tool.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @param enabled - New enabled state.
   * @returns Whether the update succeeded.
   */
  async setToolEnabled(serverName: string, toolName: string, enabled: boolean): Promise<boolean> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return false;
    }

    try {
      const response = await mcpApi.setToolEnabled(serverName, toolName, enabled);
      return response.success;
    } catch (error) {
      console.error('Error setting tool enabled state:', error);
      return false;
    }
  }

  /**
   * Gets persisted state for a specific MCP tool.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @returns Tool state, or `null` when unavailable or unsuccessful.
   */
  async getToolStats(serverName: string, toolName: string): Promise<MCPToolState | null> {
    const mcpApi = getDesktopMCPApi();
    if (!mcpApi) {
      return null;
    }

    try {
      const response = await mcpApi.getToolStats(serverName, toolName);
      return response.success ? response.stats ?? null : null;
    } catch (error) {
      console.error('Error getting tool stats:', error);
      return null;
    }
  }

  /**
   * Parses an MCP tool name into server and tool components.
   *
   * @param fullToolName - Name in `serverName__toolName` format.
   * @returns Parsed server and bare tool names; unqualified names use server `default`.
   */
  parseToolName(fullToolName: string): { serverName: string; toolName: string } {
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
   * Checks whether a specific MCP tool is enabled.
   *
   * Missing configuration and omitted `enabled` fields are treated as enabled.
   *
   * @param fullToolName - Qualified or unqualified tool name.
   * @returns Whether the tool is enabled.
   */
  async isToolEnabled(fullToolName: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return true; // Default to enabled if not in Electron
    }

    try {
      const { serverName, toolName } = this.parseToolName(fullToolName);
      const toolsConfig = await this.getToolsConfig();

      if (!toolsConfig.success || !toolsConfig.config) {
        return true; // Default to enabled if config not available
      }

      const serverConfig = toolsConfig.config[serverName];
      if (!serverConfig || !serverConfig[toolName]) {
        return true; // Default to enabled for new tools
      }

      return serverConfig[toolName].enabled !== false;
    } catch (error) {
      console.error('Error checking tool enabled state:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Gets all enabled tools represented in persisted Electron configuration.
   *
   * @returns Enabled tools with qualified names and server metadata.
   */
  async getEnabledTools(): Promise<ElectronMCPTool[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const toolsConfigResponse = await this.getToolsConfig();
      if (!toolsConfigResponse.success || !toolsConfigResponse.config) {
        return [];
      }

      const enabledTools: ElectronMCPTool[] = [];
      for (const [serverName, serverTools] of Object.entries(toolsConfigResponse.config)) {
        for (const [toolName, toolConfig] of Object.entries(serverTools)) {
          if (toolConfig.enabled !== false) {
            enabledTools.push({
              name: `${serverName}__${toolName}`,
              description: toolConfig.description,
              inputSchema: toolConfig.inputSchema,
              server: serverName,
            });
          }
        }
      }

      return enabledTools;
    } catch (error) {
      console.error('Error getting enabled tools:', error);
      return [];
    }
  }
}

// Export a function that returns enabled tools (compatible with existing interface)
/**
 * Returns enabled Electron MCP tools using a new client instance.
 *
 * @returns Enabled tools available through the Electron bridge.
 */
const tools = async function (): Promise<ElectronMCPTool[]> {
  const client = new ElectronMCPClient();
  return client.getEnabledTools();
};

// Export both the client class and the tools function for flexibility
export { ElectronMCPClient };
export default tools;
