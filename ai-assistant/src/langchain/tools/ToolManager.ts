import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DynamicTool } from '@langchain/core/tools';
import { Prompt } from '../../ai/manager';
import { ElectronMCPClient } from '../../ai/mcp/electron-client';
import { MCPOutputFormatter } from '../formatters/MCPOutputFormatter';
import { KubernetesTool, KubernetesToolContext } from './kubernetes';
import { AVAILABLE_TOOLS, getToolByName } from './registry';
import { ToolBase, ToolResponse } from './ToolBase';

export class ToolManager {
  private tools: ToolBase[] = [];
  private toolHandlers: Map<string, ToolBase> = new Map();
  private mcpTools: any[] = [];
  private mcpToolsInitialized: boolean = false;
  private mcpInitializationPromise: Promise<void> | null = null;
  private boundModel: BaseChatModel | null = null;
  private providerId: string | null = null;
  private mcpFormatter: MCPOutputFormatter | null = null;
  private mcpClient: ElectronMCPClient;

  constructor(private kubernetesContext?: KubernetesToolContext, enabledToolIds?: string[]) {
    this.mcpClient = new ElectronMCPClient();
    this.initializeTools(enabledToolIds);
    this.mcpInitializationPromise = this.initializeMCPTools();
  }

  /**
   * Initialize only enabled tools from the registry
   */
  private initializeTools(enabledToolIds?: string[]): void {
    // Initialize regular tools first
    for (const ToolClass of AVAILABLE_TOOLS) {
      const tempTool = new ToolClass();
      if (enabledToolIds && !enabledToolIds.includes(tempTool.config.name)) {
        continue; // Skip tools not enabled
      }
      try {
        const tool = tempTool;
        this.addTool(tool);
      } catch (error) {
        console.error(`Failed to load tool ${ToolClass.name}:`, error);
      }
    }

    // Initialize MCP tools asynchronously but start immediately
    this.initializeMCPTools();
  }

  /**
   * Initialize MCP tools from Electron main process
   */
  private async initializeMCPTools(): Promise<void> {
    try {
      
      if (!this.mcpClient.isAvailable()) {
        this.mcpToolsInitialized = true;
        return;
      }

      // Get tools configuration (source of truth)
      const toolsConfigResponse = await this.mcpClient.getToolsConfig();

      if (!toolsConfigResponse.success || !toolsConfigResponse.config) {
        this.mcpToolsInitialized = true;
        return;
      }

      // Create tools from configuration
      const mcpToolsData: any[] = [];
      Object.entries(toolsConfigResponse.config).forEach(([serverName, serverTools]: [string, any]) => {
        Object.entries(serverTools).forEach(([toolName, toolConfig]: [string, any]) => {
          const fullToolName = `${serverName}__${toolName}`;
          mcpToolsData.push({
            name: fullToolName,
            description: `Tool: ${toolName} from ${serverName} server`,
            inputSchema: {}, // We'll get this later if needed
            server: serverName,
            enabled: toolConfig.enabled !== false
          });
        });
      });

      // Filter MCP tools using the MCP configuration (not legacy enabledToolIds)
      const filteredMcpTools: typeof mcpToolsData = [];
      
      for (const toolData of mcpToolsData) {
        // MCP tools are controlled by their own configuration system, not legacy enabledToolIds
        // Check if tool is enabled in MCP configuration
        if (!toolData.enabled) {
          continue;
        }

        filteredMcpTools.push(toolData);
      }

      if (filteredMcpTools.length > 0) {
        // Convert MCP tools to LangChain DynamicTool format
        this.mcpTools = filteredMcpTools.map(
          toolData =>
            new DynamicTool({
              name: toolData.name,
              description: toolData.description || `MCP tool: ${toolData.name}`,
              schema: toolData.inputSchema,
              func: async (args: any) => {
                try {
                  // Handle argument mapping for MCP tools
                  // LangChain may wrap args in different formats, need to handle properly
                  const mappedArgs = this.mapMCPToolArguments(args, toolData.inputSchema);

                  // Execute MCP tool through Electron API
                  const result = await window.desktopApi?.mcp.executeTool(
                    toolData.name,
                    mappedArgs
                  );
                  // Extract actual result from MCP response
                  const actualResult = result?.result || result;

                  // Ensure we return a string response
                  const response =
                    typeof actualResult === 'string' ? actualResult : JSON.stringify(actualResult);
                  return response;
                } catch (error) {
                  console.error(`Error executing MCP tool ${toolData.name}:`, error);
                  throw error;
                }
              },
            })
        );

        this.mcpToolsInitialized = true;

        // If we have a bound model, rebind with the new MCP tools
        if (this.boundModel && this.providerId) {
          this.boundModel = this.bindToModel(this.boundModel, this.providerId);
        }
      } else {
        this.mcpToolsInitialized = true;
      }
    } catch (error) {
      this.mcpToolsInitialized = true;
      // Continue without MCP tools - this is not a fatal error
    }
  }

  /**
   * Map LangChain tool arguments to MCP tool expected format
   * Handles common argument wrapping patterns and schema mismatches
   */
  private mapMCPToolArguments(args: any, inputSchema?: any): any {
    if (!inputSchema) {
      // If no schema, return args as-is
      return args;
    }

    const schemaProps = inputSchema?.properties;

    // Handle tools that expect no parameters
    if (!schemaProps || Object.keys(schemaProps).length === 0) {
      // Return empty object for tools that expect no parameters
      return {};
    }

    // Handle empty/null/undefined args
    if (
      !args ||
      args === '' ||
      args === '""' ||
      (typeof args === 'object' && Object.keys(args).length === 0)
    ) {
      // Check if the tool has required parameters
      const requiredProps = inputSchema?.required || [];
      if (requiredProps.length === 0) {
        // Tool has no required parameters, safe to return empty object
        return {};
      } else {
        // Tool has required parameters but got empty args - create default structure
        return this.createDefaultParameterStructure(inputSchema);
      }
    }

    // First, check if args is properly structured for the schema
    if (args && typeof args === 'object') {
      // Remove any non-schema fields like 'input' that shouldn't be there
      const schemaPropertyNames = Object.keys(schemaProps);
      const cleanArgs: any = {};

      // Copy only fields that exist in the schema
      for (const [key, value] of Object.entries(args)) {
        if (schemaPropertyNames.includes(key)) {
          cleanArgs[key] = value;
        }
      }

      // If we found valid schema fields, use the cleaned args
      if (Object.keys(cleanArgs).length > 0) {
        return this.filterMCPArguments(cleanArgs, inputSchema);
      }

      // If no valid schema fields found, check for 'input' wrapper
      if ('input' in args && !schemaProps.input) {
        const inputValue = args.input;

        // Handle empty input
        if (!inputValue || inputValue === '' || inputValue === '""') {
          const requiredProps = inputSchema?.required || [];
          if (requiredProps.length === 0) {
            return {};
          }
        }

        // If the input is a primitive value and the schema has only one property
        if (
          schemaPropertyNames.length === 1 &&
          (typeof inputValue === 'string' ||
            typeof inputValue === 'number' ||
            typeof inputValue === 'boolean')
        ) {
          // Map the primitive value to the single expected property
          return { [schemaPropertyNames[0]]: inputValue };
        }

        // If the input is an object, try to unwrap it
        if (typeof inputValue === 'object' && inputValue !== null) {
          return this.filterMCPArguments(inputValue, inputSchema);
          return this.filterMCPArguments(inputValue, inputSchema);
        }

        // For primitive values with multiple schema properties, try common mappings
        if (typeof inputValue === 'string') {
          // Try common parameter names
          if (schemaProps.query) {
            return { query: inputValue };
          }
          if (schemaProps.path) {
            return { path: inputValue };
          }
          if (schemaProps.directory) {
            return { directory: inputValue };
          }
          if (schemaProps.file) {
            return { file: inputValue };
          }
          if (schemaProps.name) {
            return { name: inputValue };
          }

          // If no common mapping found, map to first required property, then first property
          const requiredProps = inputSchema?.required || [];
          const targetProp = requiredProps.length > 0 ? requiredProps[0] : schemaPropertyNames[0];
          if (targetProp) {
            return { [targetProp]: inputValue };
          }
        }

        // Return the unwrapped input and let the tool handle validation
        return inputValue;
        return inputValue;
      }
    }

    // If args structure matches or is already properly formatted, filter and return
    return this.filterMCPArguments(args, inputSchema);
  }

  /**
   * Filter MCP arguments to only include required fields and fields with actual values
   */
  private filterMCPArguments(args: any, inputSchema?: any): any {
    if (!inputSchema || !args || typeof args !== 'object') {
      return args;
    }

    const schemaProps = inputSchema?.properties;
    const requiredProps = inputSchema?.required || [];

    if (!schemaProps) {
      return args;
    }

    const filteredArgs: any = {};

    // Always include all required properties, even if they have empty/default values
    for (const requiredProp of requiredProps) {
      if (requiredProp in args) {
        filteredArgs[requiredProp] = args[requiredProp];
      } else {
        // If required property is missing, add a default value based on schema
        const propSchema = schemaProps[requiredProp];
        if (propSchema) {
          if (propSchema.type === 'string') {
            filteredArgs[requiredProp] = propSchema.default || '';
          } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
            filteredArgs[requiredProp] = propSchema.default || 0;
          } else if (propSchema.type === 'boolean') {
            filteredArgs[requiredProp] = propSchema.default || false;
          } else if (propSchema.type === 'array') {
            filteredArgs[requiredProp] = propSchema.default || [];
          } else if (propSchema.type === 'object') {
            filteredArgs[requiredProp] = propSchema.default || {};
          } else {
            filteredArgs[requiredProp] = propSchema.default || {};
          }
        }
      }
    }

    // Include optional properties only if they have actual values
    for (const [key, value] of Object.entries(args)) {
      // Skip if already included as required
      if (requiredProps.includes(key)) {
        continue;
      }

      // Skip if property is not in schema
      if (!(key in schemaProps)) {
        continue;
      }

      // Include only if value is meaningful (not empty string, null, undefined, or empty object/array)
      if (this.hasActualValue(value)) {
        filteredArgs[key] = value;
      }
    }
    return filteredArgs;
  }

  /**
   * Check if a value is meaningful (not empty/null/undefined)
   */
  private hasActualValue(value: any): boolean {
    // Null, undefined, or empty string are not actual values
    if (value === null || value === undefined || value === '') {
      return false;
    }

    // Empty arrays are not actual values
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    // Empty objects are not actual values
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    // Numbers (including 0), booleans, and non-empty strings are actual values
    return true;
  }

  /**
   * Create default parameter structure based on schema
   * For required parameters that are missing, provide appropriate defaults
   */
  private createDefaultParameterStructure(inputSchema: any): any {
    if (!inputSchema || !inputSchema.properties) {
      return {};
    }

    const defaultParams: any = {};
    const requiredProps = inputSchema.required || [];
    const schemaProps = inputSchema.properties;

    for (const requiredProp of requiredProps) {
      if (requiredProp in schemaProps) {
        const propSchema = schemaProps[requiredProp];

        // Create appropriate default values based on type
        if (propSchema.type === 'string') {
          defaultParams[requiredProp] = propSchema.default || '';
        } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
          defaultParams[requiredProp] = propSchema.default || 0;
        } else if (propSchema.type === 'boolean') {
          defaultParams[requiredProp] = propSchema.default || false;
        } else if (propSchema.type === 'array') {
          defaultParams[requiredProp] = propSchema.default || [];
        } else if (propSchema.type === 'object') {
          defaultParams[requiredProp] = propSchema.default || {};
        } else {
          // For unknown types, try to use the default or provide an empty object
          defaultParams[requiredProp] = propSchema.default || {};
        }
      }
    }

    return defaultParams;
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
        const rawResult = await mcpTool.func(args);

        // Check if the raw result indicates an error
        const isError = this.detectMCPError(rawResult);

        // Format the MCP output using AI if formatter is available
        let formattedContent = rawResult;
        if (this.mcpFormatter) {
          try {
            const formatted = await this.mcpFormatter.formatMCPOutput(rawResult, toolName);
            formattedContent = JSON.stringify({
              formatted: true,
              mcpOutput: formatted,
              raw: rawResult,
              isError: isError || formatted.type === 'error',
              originalArgs: args, // Include original arguments in the formatted content for retry functionality
            });
          } catch (formatError) {
            console.warn(`Failed to format MCP output for ${toolName}:`, formatError);
            // Fall back to simple formatting
            const simpleFormatted = this.mcpFormatter.formatSimple(rawResult, toolName);
            formattedContent = JSON.stringify({
              formatted: true,
              mcpOutput: simpleFormatted,
              raw: rawResult,
              isError: isError || simpleFormatted.type === 'error',
              originalArgs: args, // Include original arguments in the fallback formatting too
            });
          }
        } else {
          // No formatter available, but still detect errors
          if (isError) {
            formattedContent = JSON.stringify({
              error: true,
              message: this.extractErrorMessage(rawResult),
              toolName,
              raw: rawResult,
              originalArgs: args, // Include original arguments for error cases too
            });
          }
        }

        return {
          content: formattedContent,
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: {
            toolName,
            source: 'mcp',
            formatted: !!this.mcpFormatter,
            isError:
              isError ||
              (this.mcpFormatter && JSON.parse(formattedContent).mcpOutput?.type === 'error'),
            originalArgs: args, // Store original arguments for retry functionality
          },
        };
      } catch (error) {
        console.error(`Error executing MCP tool ${toolName}:`, error);

        // Format execution errors properly if formatter is available
        let errorContent;
        if (this.mcpFormatter) {
          const errorFormatted = {
            type: 'error' as const,
            title: `Tool Execution Failed: ${toolName}`,
            summary: 'The MCP tool failed to execute due to an internal error.',
            data: {
              message: 'Tool execution failed',
              details: error instanceof Error ? error.message : 'Unknown execution error',
              suggestions: [
                'Check if the tool is properly configured and accessible',
                'Verify the input parameters match the tool requirements',
                'Try again in a few moments as this may be a temporary issue',
              ],
            },
            insights: ['Tool execution errors may indicate configuration or connectivity issues'],
            warnings: ['This tool is currently unavailable'],
            actionable_items: ['Review tool configuration and try again'],
            metadata: {
              toolName,
              responseSize: 0,
              processingTime: 0,
              dataPoints: 0,
            },
          };

          errorContent = JSON.stringify({
            formatted: true,
            mcpOutput: errorFormatted,
            raw: error instanceof Error ? error.message : 'Unknown error',
            isError: true,
            originalArgs: args, // Include original arguments in error formatting too
          });
        } else {
          errorContent = JSON.stringify({
            error: true,
            message: `Error executing MCP tool: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            toolName,
            originalArgs: args, // Include original arguments in simple error format too
          });
        }

        return {
          content: errorContent,
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: { error: 'mcp_execution_error', toolName, isError: true },
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
      // Store for potential rebinding when MCP tools are loaded
      this.providerId = providerId;

      // Initialize MCP formatter with the model
      if (!this.mcpFormatter) {
        this.mcpFormatter = new MCPOutputFormatter(model);
      }

      const langChainTools = this.getLangChainTools();
      if (langChainTools.length === 0) {
        console.warn('No tools configured for binding');
        this.boundModel = model;
        return model;
      }
      this.boundModel = model.bindTools(langChainTools);
      return this.boundModel;
    } catch (error) {
      console.error(`Error binding tools to ${providerId} model:`, error);
      this.boundModel = model;
      return model;
    }
  }

  /**
   * Bind all tools to a LangChain model, waiting for MCP tools to initialize first
   */
  async bindToModelAsync(model: BaseChatModel, providerId: string): Promise<BaseChatModel> {
    // Wait for MCP tools to initialize before binding
    await this.waitForMCPToolsInitialization();
    
    return this.bindToModel(model, providerId);
  }

  /**
   * Wait for MCP tools to be initialized
   */
  async waitForMCPToolsInitialization(): Promise<void> {
    if (this.mcpInitializationPromise) {
      await this.mcpInitializationPromise;
    }
  }

  /**
   * Check if MCP tools are initialized
   */
  areMCPToolsInitialized(): boolean {
    return this.mcpToolsInitialized;
  }

  /**
   * Get list of all configured tool names (including MCP tools)
   */
  getToolNames(): string[] {
    const regularToolNames = this.tools.map(tool => tool.config.name);
    const mcpToolNames = this.mcpTools.map(tool => tool.name);
    return [...regularToolNames, ...mcpToolNames];
  }

  /**
   * Get MCP client instance for configuration management
   */
  getMCPClient(): ElectronMCPClient {
    return this.mcpClient;
  }

  /**
   * Enable or disable an MCP tool
   */
  async setMCPToolEnabled(toolName: string, enabled: boolean): Promise<boolean> {
    if (!this.mcpClient.isAvailable()) {
      return false;
    }

    const { serverName, toolName: actualToolName } = this.mcpClient.parseToolName(toolName);
    const result = await this.mcpClient.setToolEnabled(serverName, actualToolName, enabled);
    
    if (result) {
      // Reinitialize MCP tools to reflect the change
      this.mcpToolsInitialized = false;
      this.mcpInitializationPromise = this.initializeMCPTools();
      await this.mcpInitializationPromise;
      
      // If we have a bound model, rebind with the updated tools
      if (this.boundModel && this.providerId) {
        this.boundModel = this.bindToModel(this.boundModel, this.providerId);
      }
    }
    
    return result;
  }

  /**
   * Check if an MCP tool is enabled
   */
  async isMCPToolEnabled(toolName: string): Promise<boolean> {
    if (!this.mcpClient.isAvailable()) {
      return true;
    }
    return await this.mcpClient.isToolEnabled(toolName);
  }

  /**
   * Get MCP tool statistics
   */
  async getMCPToolStats(toolName: string): Promise<any | null> {
    if (!this.mcpClient.isAvailable()) {
      return null;
    }
    
    const { serverName, toolName: actualToolName } = this.mcpClient.parseToolName(toolName);
    return await this.mcpClient.getToolStats(serverName, actualToolName);
  }

  /**
   * Get MCP tools configuration
   */
  async getMCPToolsConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
    if (!this.mcpClient.isAvailable()) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }
    return await this.mcpClient.getToolsConfig();
  }

  /**
   * Update MCP tools configuration
   */
  async updateMCPToolsConfig(config: any): Promise<boolean> {
    if (!this.mcpClient.isAvailable()) {
      return false;
    }
    
    const result = await this.mcpClient.updateToolsConfig(config);
    
    if (result) {
      // Reinitialize MCP tools to reflect the changes
      this.mcpToolsInitialized = false;
      this.mcpInitializationPromise = this.initializeMCPTools();
      await this.mcpInitializationPromise;
      
      // If we have a bound model, rebind with the updated tools
      if (this.boundModel && this.providerId) {
        this.boundModel = this.bindToModel(this.boundModel, this.providerId);
      }
    }
    
    return result;
  }

  /**
   * Detect if an MCP tool result indicates an error
   */
  private detectMCPError(result: string): boolean {
    try {
      const parsed = JSON.parse(result);

      // Check for explicit error indicators
      if (parsed.success === false || parsed.error === true) {
        return true;
      }

      // Check for error messages
      if (parsed.error || parsed.message?.toLowerCase().includes('error')) {
        return true;
      }

      // Check for schema mismatch or other common error patterns
      if (typeof parsed.error === 'string' && parsed.error.length > 0) {
        return true;
      }

      return false;
    } catch {
      // If not JSON, check for common error patterns in the string
      const lowerResult = result.toLowerCase();
      return (
        lowerResult.includes('error') ||
        lowerResult.includes('failed') ||
        lowerResult.includes('exception') ||
        lowerResult.includes('invalid') ||
        lowerResult.includes('schema mismatch')
      );
    }
  }

  /**
   * Extract error message from MCP tool result
   */
  private extractErrorMessage(result: string): string {
    try {
      const parsed = JSON.parse(result);

      // Try various fields that might contain the error message
      if (parsed.error && typeof parsed.error === 'string') {
        return parsed.error;
      }

      if (parsed.message) {
        return parsed.message;
      }

      if (parsed.details) {
        return parsed.details;
      }

      return 'Tool execution failed with an unspecified error';
    } catch {
      // Not JSON, return the raw result or a cleaned version
      return result.length > 200 ? result.substring(0, 200) + '...' : result;
    }
  }
}
