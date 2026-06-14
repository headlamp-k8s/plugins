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

/** Metadata describing an MCP tool exposed by Electron. */
interface MCPTool {
  /** Fully qualified tool name. */
  name: string;
  /** Optional description shown in the UI. */
  description?: string;
  /** JSON schema describing accepted input arguments. */
  inputSchema?: any;
  /** Server that provides the tool. */
  server?: string;
}

/** Standard response envelope returned by Electron MCP IPC calls. */
interface MCPResponse {
  /** Whether the request completed successfully. */
  success: boolean;
  /** Tool definitions returned by discovery calls. */
  tools?: MCPTool[];
  /** Raw result returned from a tool execution. */
  result?: any;
  /** Error message when the request fails. */
  error?: string;
  /** Optional tool call identifier echoed by the backend. */
  toolCallId?: string;
}

/** Electron bridge methods exposed for MCP operations in the renderer. */
interface ElectronMCPApi {
  /** Fetches the list of available MCP tools. */
  getTools: () => Promise<MCPResponse>;
  /** Executes a specific MCP tool through Electron. */
  executeTool: (
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string
  ) => Promise<MCPResponse>;
  /** Returns renderer-visible MCP initialization status. */
  getStatus: () => Promise<{ isInitialized: boolean; hasClient: boolean }>;
  /** Resets the Electron-side MCP client. */
  resetClient: () => Promise<MCPResponse>;
  /** Retrieves the persisted MCP server configuration. */
  getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  /** Updates the persisted MCP server configuration. */
  updateConfig: (config: any) => Promise<MCPResponse>;
  /** Retrieves per-tool enablement configuration. */
  getToolsConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  /** Updates per-tool enablement configuration. */
  updateToolsConfig: (config: any) => Promise<MCPResponse>;
  /** Enables or disables a specific tool on a server. */
  setToolEnabled: (serverName: string, toolName: string, enabled: boolean) => Promise<MCPResponse>;
  /** Returns execution statistics for a specific tool. */
  getToolStats: (
    serverName: string,
    toolName: string
  ) => Promise<{ success: boolean; stats?: any; error?: string }>;
}

// desktopApi is already declared on Window by @kinvolk/headlamp-plugin as `any`.
// We use a helper to access it with proper typing.
/** Returns the Electron MCP bridge when running in the desktop environment. */
function getDesktopMCPApi(): ElectronMCPApi | undefined {
  const api = (window as any).desktopApi;
  if (api && typeof api.mcp !== 'undefined') {
    return api.mcp as ElectronMCPApi;
  }
  return undefined;
}
// Type augmentation is handled by src/types/electron.d.ts

/** Wraps Electron MCP IPC calls in a renderer-friendly client API. */
class ElectronMCPClient {
  private isElectron: boolean;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && getDesktopMCPApi() !== undefined;
  }

  /**
   * Check if running in Electron environment with MCP support
   */
  isAvailable(): boolean {
    return this.isElectron;
  }

  /**
   * Get available MCP tools from Electron main process
   */
  async getTools(): Promise<MCPTool[]> {
    if (!this.isElectron) {
      console.warn('MCP client not available - not running in Electron environment');
      return [];
    }

    try {
      const mcpApi = getDesktopMCPApi()!;
      const response = await mcpApi.getTools();
      console.log('mcp response from getting tools is', response);
      console.log('mcp window desktop api', mcpApi.getTools);
      if (response.success && response.tools) {
        console.log('Retrieved MCP tools from Electron:', response.tools.length, 'tools');
        return response.tools;
      } else {
        console.warn('Failed to get MCP tools:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Error getting MCP tools from Electron:', error);
      return [];
    }
  }

  /**
   * Execute an MCP tool via Electron main process
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string
  ): Promise<any> {
    if (!this.isElectron) {
      throw new Error('MCP client not available - not running in Electron environment');
    }

    try {
      console.debug('args for tool executed is ', args);
      const response = await getDesktopMCPApi()!.executeTool(toolName, args, toolCallId);

      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.error || 'Unknown error executing MCP tool');
      }
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get MCP client status from Electron main process
   */
  async getStatus(): Promise<{ isInitialized: boolean; hasClient: boolean }> {
    if (!this.isElectron) {
      return { isInitialized: false, hasClient: false };
    }

    try {
      return await getDesktopMCPApi()!.getStatus();
    } catch (error) {
      console.error('Error getting MCP status:', error);
      return { isInitialized: false, hasClient: false };
    }
  }

  /**
   * Reset/restart MCP client in Electron main process
   */
  async resetClient(): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }

    try {
      const response = await getDesktopMCPApi()!.resetClient();
      return response.success;
    } catch (error) {
      console.error('Error resetting MCP client:', error);
      return false;
    }
  }

  /**
   * Get MCP configuration from Electron main process
   */
  async getConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }

    try {
      const response = await window.desktopApi!.mcp.getConfig();
      return response;
    } catch (error) {
      console.error('Error getting MCP config:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get MCP tools configuration from Electron main process
   */
  async getToolsConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
    if (!this.isElectron) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }

    try {
      const response = await window.desktopApi!.mcp.getToolsConfig();
      return response;
    } catch (error) {
      console.error('Error getting MCP tools config:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update MCP tools configuration in Electron main process
   */
  async updateToolsConfig(config: any): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }

    try {
      const response = await window.desktopApi!.mcp.updateToolsConfig(config);
      console.debug('response from updating mcp tools config is ', response);
      return response.success;
    } catch (error) {
      console.error('Error updating MCP tools config:', error);
      return false;
    }
  }

  /**
   * Enable or disable a specific MCP tool
   */
  async setToolEnabled(serverName: string, toolName: string, enabled: boolean): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }

    try {
      const response = await window.desktopApi!.mcp.setToolEnabled(serverName, toolName, enabled);
      return response.success;
    } catch (error) {
      console.error('Error setting tool enabled state:', error);
      return false;
    }
  }

  /**
   * Get tool statistics for a specific MCP tool
   */
  async getToolStats(serverName: string, toolName: string): Promise<any | null> {
    if (!this.isElectron) {
      return null;
    }

    try {
      const response = await window.desktopApi!.mcp.getToolStats(serverName, toolName);
      return response.success ? response.stats : null;
    } catch (error) {
      console.error('Error getting tool stats:', error);
      return null;
    }
  }

  /**
   * Parse MCP tool name to extract server and tool components
   * Format: "serverName__toolName"
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
   * Check if a specific tool is enabled
   */
  async isToolEnabled(fullToolName: string): Promise<boolean> {
    if (!this.isElectron) {
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

      return serverConfig[toolName].enabled;
    } catch (error) {
      console.error('Error checking tool enabled state:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Get all enabled MCP tools
   */
  async getEnabledTools(): Promise<MCPTool[]> {
    if (!this.isElectron) {
      return [];
    }

    try {
      const toolsConfigResponse = await this.getToolsConfig();
      if (!toolsConfigResponse.success || !toolsConfigResponse.config) {
        return [];
      }

      const enabledTools: MCPTool[] = [];
      for (const [serverName, serverTools] of Object.entries(toolsConfigResponse.config)) {
        for (const [toolName, toolConfig] of Object.entries(serverTools as Record<string, any>)) {
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
/** Returns the enabled Electron MCP tools using the default client instance. */
const tools = async function (): Promise<MCPTool[]> {
  const client = new ElectronMCPClient();
  return client.getEnabledTools();
};

// Export both the client class and the tools function for flexibility
export { ElectronMCPClient };
export default tools;
