// Frontend MCP client that communicates with Electron main process
// This replaces the direct MCP client import to avoid spawn issues in renderer process

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
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

// desktopApi is already declared on Window by @kinvolk/headlamp-plugin as `any`.
// We use a helper to access it with proper typing.
function getDesktopMCPApi(): ElectronMCPApi | undefined {
  const api = (window as any).desktopApi;
  if (api && typeof api.mcp !== 'undefined') {
    return api.mcp as ElectronMCPApi;
  }
  return undefined;
}

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
