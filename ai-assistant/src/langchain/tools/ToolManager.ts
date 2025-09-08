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
                // Handle argument mapping for MCP tools
                // LangChain may wrap args in different formats, need to handle properly
                let mappedArgs = this.mapMCPToolArguments(args, toolData.inputSchema);
                
                console.log(`MCP tool ${toolData.name} called with original args:`, JSON.stringify(args));
                console.log(`MCP tool ${toolData.name} calling with mapped args:`, JSON.stringify(mappedArgs));
                
                const result = await this.mcpClient.executeTool(toolData.name, mappedArgs);
                console.log(`MCP tool ${toolData.name} returned result:`, result);
                console.log(`MCP tool ${toolData.name} result type:`, typeof result);
                
                // Ensure we return a string response
                const response = typeof result === 'string' ? result : JSON.stringify(result);
                console.log(`MCP tool ${toolData.name} final response:`, response);
                
                return response;
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
   * Map LangChain tool arguments to MCP tool expected format
   * Handles common argument wrapping patterns and schema mismatches
   */
  private mapMCPToolArguments(args: any, inputSchema?: any): any {
    console.log('Mapping MCP tool arguments:', { args, inputSchema });
    
    if (!inputSchema) {
      // If no schema, return args as-is
      return args;
    }

    const schemaProps = inputSchema?.properties;
    
    // Handle tools that expect no parameters
    if (!schemaProps || Object.keys(schemaProps).length === 0) {
      // Return empty object for tools that expect no parameters
      console.log('Tool expects no parameters, returning empty object');
      return {};
    }

    // Handle empty/null/undefined args
    if (!args || args === '' || args === '""' || (typeof args === 'object' && Object.keys(args).length === 0)) {
      // Check if the tool has required parameters
      const requiredProps = inputSchema?.required || [];
      if (requiredProps.length === 0) {
        // Tool has no required parameters, safe to return empty object
        console.log('Tool has no required parameters, returning empty object');
        return {};
      } else {
        // Tool has required parameters but got empty args
        console.log('Tool has required parameters but got empty args, returning empty object (will let validation handle it)');
        return {};
      }
    }

    // If args is wrapped in an "input" key but the schema doesn't expect it
    if (args && typeof args === 'object' && 'input' in args && !schemaProps.input) {
      const inputValue = args.input;
      
      // Handle empty input
      if (!inputValue || inputValue === '' || inputValue === '""') {
        const requiredProps = inputSchema?.required || [];
        if (requiredProps.length === 0) {
          console.log('Unwrapped input is empty and no required params, returning empty object');
          return {};
        }
      }
      
      // If the input is a primitive value and the schema has only one property
      const schemaPropertyNames = Object.keys(schemaProps);
      if (schemaPropertyNames.length === 1 && (typeof inputValue === 'string' || typeof inputValue === 'number' || typeof inputValue === 'boolean')) {
        // Map the primitive value to the single expected property
        console.log(`Mapping primitive value to single property: ${schemaPropertyNames[0]}`);
        return { [schemaPropertyNames[0]]: inputValue };
      }
      
      // If the input is an object, try to unwrap it
      if (typeof inputValue === 'object' && inputValue !== null) {
        console.log('Unwrapping object input');
        return inputValue;
      }
      
      // For primitive values with multiple schema properties, try common mappings
      if (typeof inputValue === 'string') {
        // Try common parameter names
        if (schemaProps.path) {
          console.log('Mapping string to path parameter');
          return { path: inputValue };
        }
        if (schemaProps.directory) {
          console.log('Mapping string to directory parameter');
          return { directory: inputValue };
        }
        if (schemaProps.file) {
          console.log('Mapping string to file parameter');
          return { file: inputValue };
        }
        if (schemaProps.name) {
          console.log('Mapping string to name parameter');
          return { name: inputValue };
        }
        
        // If no common mapping found, map to first property
        if (schemaPropertyNames.length > 0) {
          console.log(`Mapping string to first property: ${schemaPropertyNames[0]}`);
          return { [schemaPropertyNames[0]]: inputValue };
        }
      }
      
      // Return the unwrapped input and let the tool handle validation
      console.log('Returning unwrapped input value');
      return inputValue;
    }

    // If args structure matches or is already properly formatted, return as-is
    console.log('Args appear to be in correct format, returning as-is');
    return args;
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
   * Check if a specific tool is configured (including MCP tools)
   */
  hasTool(toolName: string): boolean {
    // Check regular tools first
    if (this.toolHandlers.has(toolName)) {
      return true;
    }
    
    // Check MCP tools
    return this.mcpTools.some(tool => tool.name === toolName);
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

    // Check if it's a regular tool first
    const regularTool = this.toolHandlers.get(toolName);
    if (regularTool) {
      return await regularTool.handler(args, toolCallId, pendingPrompt);
    }

    // Check if it's an MCP tool
    const mcpTool = this.mcpTools.find(tool => tool.name === toolName);
    if (mcpTool) {
      try {
        const result = await mcpTool.func(args);
        return {
          content: result,
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: { toolName, source: 'mcp' },
        };
      } catch (error) {
        console.error(`Error executing MCP tool ${toolName}:`, error);
        return {
          content: JSON.stringify({
            error: true,
            message: `Error executing MCP tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }),
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: { error: 'mcp_execution_error', toolName },
        };
      }
    }

    throw new Error(`Tool ${toolName} not found`);
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
}
