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
  getTools: () => Promise<MCPResponse>;
  executeTool: (
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string
  ) => Promise<MCPResponse>;
  getStatus: () => Promise<{ isInitialized: boolean; hasClient: boolean }>;
  resetClient: () => Promise<MCPResponse>;
  getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateConfig: (config: any) => Promise<MCPResponse>;
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
   * Get available MCP tools from Electron main process
   */
  async getTools(): Promise<MCPTool[]> {
    if (!this.isElectron) {
      console.warn('MCP client not available - not running in Electron environment');
      return [];
    }

    try {
      const response = await window.desktopApi!.mcp.getTools();
      console.log('mcp response from getting tools is', response);
      console.log('mcp window desktop api', window.desktopApi!.mcp.getTools);
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
      console.log('args for tool executed is ', args);
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
}

// Export a function that returns tools (compatible with existing interface)
const tools = async function (): Promise<MCPTool[]> {
  const client = new ElectronMCPClient();
  console.log('mcp electron client is ', client);
  return await client.getTools();
};

// Export both the client class and the tools function for flexibility
export { ElectronMCPClient };
export default tools;
