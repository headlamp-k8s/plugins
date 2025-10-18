// Frontend MCP client that communicates with Electron main process
// This replaces the direct MCP client import to avoid spawn issues in renderer process

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
  server?: string; // Add server information
}

interface MCPResponse {
  success: boolean;
  tools?: MCPTool[];
  result?: any;
  error?: string;
  toolCallId?: string;
}

interface ElectronMCPApi {
  executeTool: (
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string
  ) => Promise<MCPResponse>;
  getStatus: () => Promise<{ isInitialized: boolean; hasClient: boolean }>;
  resetClient: () => Promise<MCPResponse>;
  getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateConfig: (config: any) => Promise<MCPResponse>;
  getToolsConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateToolsConfig: (config: any) => Promise<MCPResponse>;
  setToolEnabled: (serverName: string, toolName: string, enabled: boolean) => Promise<MCPResponse>;
  getToolStats: (serverName: string, toolName: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
}

declare global {
  interface Window {
    desktopApi?: {
      mcp: ElectronMCPApi;
    };
  }
}

class ElectronMCPClient {
  private isElectron: boolean;

  constructor() {
    this.isElectron =
      typeof window !== 'undefined' &&
      typeof window.desktopApi !== 'undefined' &&
      typeof window.desktopApi.mcp !== 'undefined';
  }

  /**
   * Check if running in Electron environment with MCP support
   */
  isAvailable(): boolean {
    return this.isElectron;
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
      const response = await window.desktopApi!.mcp.executeTool(toolName, args, toolCallId);

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
      return await window.desktopApi!.mcp.getStatus();
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
      const response = await window.desktopApi!.mcp.resetClient();
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
      const allTools = await this.getEnabledTools();
      const enabledTools: MCPTool[] = [];

      for (const tool of allTools) {
        const isEnabled = await this.isToolEnabled(tool.name);
        if (isEnabled) {
          enabledTools.push(tool);
        }
      }

      return enabledTools;
    } catch (error) {
      console.error('Error getting enabled tools:', error);
      return [];
    }
  }
}

// Export a function that returns tools (compatible with existing interface)
const tools = async function (): Promise<MCPTool[]> {
  const client = new ElectronMCPClient();
  return (await client.getToolsConfig()).config;
};

// Export both the client class and the tools function for flexibility
export { ElectronMCPClient };
export default tools;
