import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DynamicTool } from '@langchain/core/tools';
import { Prompt } from '../../ai/manager';
import { KubernetesTool, KubernetesToolContext } from './kubernetes';
import { AVAILABLE_TOOLS, getToolByName } from './registry';
import { ToolBase, ToolResponse } from './ToolBase';
import tools, { ElectronMCPClient } from '../../ai/mcp/electron-client';

export class ToolManager {
  private tools: ToolBase[] = [];
  private toolHandlers: Map<string, ToolBase> = new Map();
  private mcpTools: DynamicTool[] = [];
  private mcpClient: ElectronMCPClient;

  constructor(enabledToolIds?: string[]) {
    this.mcpClient = new ElectronMCPClient();
    this.initializeTools(enabledToolIds);
  }

  /**
   * Initialize only enabled tools from the registry
   */
  private initializeTools(enabledToolIds?: string[]): void {
    // Initialize MCP tools with proper error handling
    this.initializeMCPTools();

    for (const ToolClass of AVAILABLE_TOOLS) {
      const tempTool = new ToolClass();
      if (enabledToolIds && !enabledToolIds.includes(tempTool.config.name)) {
        console.log('AI Assistant: Skipping tool (disabled)', tempTool.config.name);
        continue; // Skip tools not enabled
      }
      try {
        const tool = tempTool;
        this.addTool(tool);
      } catch (error) {
        console.error(`Failed to load tool ${ToolClass.name}:`, error);
      }
    }
  }

  /**
   * Initialize MCP tools from Electron main process
   */
  private async initializeMCPTools(): Promise<void> {
    try {
      console.log('Initializing MCP tools from Electron...');
      const mcpToolsData = await tools();
      
      if (mcpToolsData && mcpToolsData.length > 0) {
        console.log(`Successfully loaded ${mcpToolsData.length} MCP tools from Electron`);
        
        // Convert MCP tools to LangChain DynamicTool format
        this.mcpTools = mcpToolsData.map(toolData => 
          new DynamicTool({
            name: toolData.name,
            description: toolData.description || `MCP tool: ${toolData.name}`,
            schema: toolData.inputSchema,
            func: async (args: any) => {
              try {
                const result = await this.mcpClient.executeTool(toolData.name, args);
                return typeof result === 'string' ? result : JSON.stringify(result);
              } catch (error) {
                console.error(`Error executing MCP tool ${toolData.name}:`, error);
                throw error;
              }
            }
          })
        );
        
        console.log(`Converted ${this.mcpTools.length} MCP tools to LangChain format`);
      } else {
        console.log('No MCP tools available or MCP client not initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize MCP tools from Electron:', error instanceof Error ? error.message : 'Unknown error');
      // Continue without MCP tools - this is not a fatal error
    }
  }
  /**
   * Configure external dependencies for tools that need them
   */
  configureKubernetesContext(context: KubernetesToolContext): void {
    // Only configure if the tool is enabled and present
    if (!this.hasTool('kubernetes_api_request')) {
      console.warn(
        'AI Assistant: KubernetesTool is disabled or not present, skipping context configuration'
      );
      return;
    }
    const kubeTool = getToolByName('kubernetes_api_request', this.tools) as KubernetesTool;
    if (kubeTool) {
      // Only set context and log if the tool context has actually changed
      if (!kubeTool.hasContext() || kubeTool.isContextDifferent(context)) {
        kubeTool.setContext(context);
      }
    } else {
      console.warn('KubernetesTool not found, cannot configure context');
    }
  }

  /**
   * Add a tool to the manager (internal method)
   */
  private addTool(tool: ToolBase): void {
    // Check for duplicate tool names
    if (this.toolHandlers.has(tool.config.name)) {
      console.warn(`Tool with name '${tool.config.name}' already exists, skipping`);
      return;
    }

    this.tools.push(tool);
    this.toolHandlers.set(tool.config.name, tool);
  }

  /**
   * Get all configured tools as LangChain tools (including MCP tools)
   */
  getLangChainTools() {
    const regularTools = this.tools.map(tool => tool.createLangChainTool());
    return [...regularTools, ...this.mcpTools];
  }

  /**
   * Get all MCP tools as LangChain tools
   */
  getMCPTools() {
    return this.mcpTools;
  }

  /**
   * Execute a tool by name with the given arguments
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ): Promise<ToolResponse> {
    if (!this.hasTool(toolName)) {
      return {
        content: JSON.stringify({
          error: true,
          message: `Tool '${toolName}' is disabled or not available.`,
        }),
        shouldAddToHistory: true,
        shouldProcessFollowUp: false,
        metadata: { error: 'tool_disabled', toolName },
      };
    }
    const tool = this.toolHandlers.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    return await tool.handler(args, toolCallId, pendingPrompt);
  }

  /**
   * Bind all tools to a LangChain model
   */
  bindToModel(model: BaseChatModel, providerId: string): BaseChatModel {
    try {
      const langChainTools = this.getLangChainTools();
      if (langChainTools.length === 0) {
        console.warn('No tools configured for binding');
        return model;
      }

      console.log(`Binding ${langChainTools.length} tools to ${providerId} model:`, 
        langChainTools.map(t => t.name));

      return model.bindTools(langChainTools);
    } catch (error) {
      console.error(`Error binding tools to ${providerId} model:`, error);
      return model;
    }
  }

  /**
   * Get list of all configured tool names
   */
  getToolNames(): string[] {
    return this.tools.map(tool => tool.config.name);
  }

  /**
   * Check if a specific tool is configured
   */
  hasTool(toolName: string): boolean {
    return this.toolHandlers.has(toolName);
  }
}
