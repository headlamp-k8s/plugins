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

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DynamicStructuredTool, DynamicTool, ToolSchemaBase } from '@langchain/core/tools';
import { z } from 'zod';
import type { ConversationMessage as Prompt } from '../../conversation/types';
import { NullToolClient, type ToolClient } from '../../mcp/client/ToolClient';
import { MCPOutputFormatter } from '../../mcp/langchain/formatToolOutput';
import type { MCPToolsConfig, MCPToolState } from '../../mcp/types';
import { AVAILABLE_TOOLS, getToolByName } from '../catalog/builtInTools';
import type { KubernetesToolContext } from '../kubernetes/context';
import { KubernetesTool } from '../kubernetes/langchain/KubernetesTool';
import type { ToolExecutionResult } from '../ToolRuntime';
import { LangChainTool } from './LangChainTool';

/** Normalized MCP discovery entry used to create a LangChain tool. */
interface MCPToolData {
  /** Server-qualified tool name. */
  name: string;
  /** Description exposed to the language model. */
  description: string;
  /** JSON Schema accepted by the MCP tool. */
  inputSchema: MCPInputSchema;
  /** MCP server that owns the tool. */
  server: string;
  /** Whether persisted settings permit the tool to run. */
  enabled: boolean;
}

/** JSON Schema property fields used when mapping MCP arguments. */
interface MCPInputProperty {
  /** JSON Schema primitive or container type. */
  type?: string;
  /** Description included in the model-facing tool summary. */
  description?: string;
  /** Default applied when a required argument is missing. */
  default?: unknown;
}

/** JSON Schema root used by an MCP tool. */
interface MCPInputSchema extends Record<string, unknown> {
  /** Input fields keyed by argument name. */
  properties?: Record<string, MCPInputProperty>;
  /** Argument names that must always be present. */
  required?: string[];
}

/**
 * Returns whether a value is a non-array argument object.
 *
 * @param value - Candidate tool arguments.
 * @returns Whether the value is a non-null, non-array object.
 */
function isArgumentMap(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Manages built-in and MCP-backed tools for LangChain requests. */
export class LangChainToolManager {
  private tools: LangChainTool[] = [];
  private toolHandlers: Map<string, LangChainTool> = new Map();
  private mcpTools: (DynamicTool | DynamicStructuredTool)[] = [];
  private mcpToolsInitialized: boolean = false;
  private mcpInitializationPromise: Promise<void> | null = null;
  private boundModel: BaseChatModel | null = null;
  private providerId: string | null = null;
  private mcpFormatter: MCPOutputFormatter | null = null;
  private mcpClient: ToolClient;

  /**
   * Creates a tool manager and starts loading configured tools.
   *
   * @param kubernetesContext - Optional context forwarded before catalog initialization; it is skipped when no tool is present yet.
   * @param enabledToolIds - Optional allowlist of built-in tool IDs.
   * @param mcpClient - Optional MCP bridge, defaulting to a no-op client.
   */
  constructor({
    kubernetesContext,
    enabledToolIds,
    mcpClient,
  }: {
    /** Optional Kubernetes context forwarded before built-in tool initialization. */
    kubernetesContext?: KubernetesToolContext;
    /** Optional allowlist of built-in tool IDs. */
    enabledToolIds?: string[];
    /** MCP bridge adapter. Defaults to a no-op when not provided. */
    mcpClient?: ToolClient;
  } = {}) {
    if (kubernetesContext) {
      this.configureKubernetesContext(kubernetesContext);
    }
    this.mcpClient = mcpClient ?? new NullToolClient();
    this.initializeTools(enabledToolIds);
    this.mcpInitializationPromise = this.initializeMCPTools();
  }

  /**
   * Initializes enabled built-in tools from the catalog.
   *
   * Individual construction failures are logged without stopping other tools.
   *
   * @param enabledToolIds - Optional allowlist; absence enables every catalog tool.
   * @returns No value.
   */
  private initializeTools(enabledToolIds?: string[]): void {
    // Initialize built-in tools first
    for (const ToolClass of AVAILABLE_TOOLS) {
      const tempTool = new ToolClass();
      if (enabledToolIds && !enabledToolIds.includes(tempTool.config.name)) {
        continue; // Skip tools not enabled
      }
      try {
        this.addTool(tempTool);
      } catch (error) {
        console.error(`Failed to load tool ${ToolClass.name}:`, error);
      }
    }
    // MCP tools are initialized via mcpInitializationPromise in the constructor
  }

  /**
   * Discovers enabled MCP tools through the injected client.
   *
   * Configured, enabled servers are the source of truth; stale tool state from
   * other servers is ignored. Failures clear MCP inventory and are contained.
   *
   * @returns No value after discovery has completed or failed.
   */
  private async initializeMCPTools(): Promise<void> {
    try {
      if (!this.mcpClient.isAvailable()) {
        this.mcpToolsInitialized = true;
        return;
      }

      // First check the server config to know which servers are actually configured.
      // This is the user's source of truth — getToolsConfig() may return stale/cached
      // tools from servers that have been removed but not yet fully disconnected.
      const serverConfigResponse = await this.mcpClient.getConfig();
      const configuredServerNames = new Set<string>();

      if (serverConfigResponse.success && serverConfigResponse.config?.servers) {
        for (const server of serverConfigResponse.config.servers) {
          if (server.enabled !== false && server.name) {
            configuredServerNames.add(server.name);
          }
        }
      }

      // If no servers are configured (or all disabled), clear MCP tools immediately
      // regardless of what getToolsConfig() might return (stale cache)
      if (configuredServerNames.size === 0) {
        this.mcpTools = [];
        this.mcpToolsInitialized = true;
        return;
      }

      // Get tools configuration (discovered tools from connected servers)
      const toolsConfigResponse = await this.mcpClient.getToolsConfig();

      if (
        !toolsConfigResponse.success ||
        !toolsConfigResponse.config ||
        Object.keys(toolsConfigResponse.config).length === 0
      ) {
        this.mcpTools = []; // Ensure MCP tools are cleared
        this.mcpToolsInitialized = true;
        return;
      }

      // Create tools from configuration, but only from servers that are actually configured
      const mcpToolsData: MCPToolData[] = [];
      Object.entries(toolsConfigResponse.config).forEach(([serverName, serverTools]) => {
        // Skip tools from servers that are no longer in the user's config
        if (!configuredServerNames.has(serverName)) {
          return;
        }
        Object.entries(serverTools).forEach(([toolName, toolConfig]: [string, MCPToolState]) => {
          const fullToolName = `${serverName}__${toolName}`;
          mcpToolsData.push({
            name: fullToolName,
            description: toolConfig.description || `Tool: ${toolName} from ${serverName} server`,
            inputSchema: (toolConfig.inputSchema ?? {}) as MCPInputSchema,
            server: serverName,
            enabled: toolConfig.enabled !== false,
          });
        });
      });

      // Filter MCP tools using the new configuration system
      const filteredMcpTools: typeof mcpToolsData = [];

      for (const toolData of mcpToolsData) {
        // MCP tools are controlled by their own configuration, not the built-in allowlist.
        // Check if tool is enabled in MCP configuration
        if (!toolData.enabled) {
          continue;
        }

        // Then check the new MCP-specific configuration
        const isEnabled = await this.mcpClient.isToolEnabled(toolData.name);
        if (!isEnabled) {
          continue;
        }

        filteredMcpTools.push(toolData);
      }

      if (filteredMcpTools.length > 0) {
        // Convert MCP tools to LangChain DynamicStructuredTool format
        this.mcpTools = filteredMcpTools.map(
          toolData =>
            new DynamicStructuredTool({
              name: toolData.name,
              description: this.buildMCPToolDescription(toolData),
              schema:
                toolData.inputSchema && Object.keys(toolData.inputSchema).length > 0
                  ? (toolData.inputSchema as ToolSchemaBase)
                  : z.object({}),
              /**
               * Maps and executes one dynamically discovered MCP tool.
               *
               * @param args - LangChain-produced arguments to normalize.
               * @returns String form of the bridge result.
               */
              func: async (args: Record<string, unknown>) => {
                try {
                  // Handle argument mapping for MCP tools
                  // LangChain may wrap args in different formats, need to handle properly
                  const mappedArgs = this.mapMCPToolArguments(args, toolData.inputSchema);

                  // Execute the MCP tool through the host bridge.
                  const result = await this.mcpClient.executeTool(toolData.name, mappedArgs);
                  // Extract actual result from MCP response
                  const actualResult =
                    typeof result === 'object' && result !== null && 'result' in result
                      ? result.result
                      : result;

                  // Ensure we return a string response
                  const response =
                    typeof actualResult === 'string'
                      ? actualResult
                      : JSON.stringify(actualResult) ?? '';
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
      this.mcpTools = [];
      this.mcpToolsInitialized = true;
      // Continue without MCP tools - this is not a fatal error
    }
  }

  /**
   * Builds a rich MCP tool description that includes parameter information.
   * Parameter details are embedded alongside the structured schema.
   *
   * @param toolData - Normalized MCP discovery entry.
   * @returns Model-facing description with required markers and property details.
   */
  private buildMCPToolDescription(toolData: MCPToolData): string {
    let desc = toolData.description || `MCP tool: ${toolData.name}`;
    const schema = toolData.inputSchema;
    if (schema?.properties && Object.keys(schema.properties).length > 0) {
      const params = Object.entries(schema.properties)
        .map(([name, prop]) => {
          const required = schema.required?.includes(name) ? ' (required)' : '';
          return `  - ${name}${required}: ${prop.description || prop.type || 'any'}`;
        })
        .join('\n');
      desc += `\n\nParameters:\n${params}`;
    }
    return desc;
  }

  /**
   * Maps LangChain arguments to an MCP input schema.
   *
   * Schema fields are filtered, `input` wrappers are unwrapped, primitive
   * values are assigned to a single, common, required, or first property, and
   * missing required values receive type-based defaults.
   *
   * @param args - Unknown, wrapped, primitive, or object arguments.
   * @param inputSchema - Optional MCP input schema.
   * @returns Normalized argument map, or an empty map when arguments cannot be mapped.
   */
  private mapMCPToolArguments(
    args: unknown,
    inputSchema?: MCPInputSchema
  ): Record<string, unknown> {
    if (!inputSchema) {
      return isArgumentMap(args) ? args : {};
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
      (isArgumentMap(args) && Object.keys(args).length === 0)
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
    if (isArgumentMap(args)) {
      // Remove any non-schema fields like 'input' that shouldn't be there
      const schemaPropertyNames = Object.keys(schemaProps);
      const cleanArgs: Record<string, unknown> = {};

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
        if (isArgumentMap(inputValue)) {
          return this.filterMCPArguments(inputValue, inputSchema);
        }

        // For primitive values with multiple schema properties, try common mappings
        if (
          typeof inputValue === 'string' ||
          typeof inputValue === 'number' ||
          typeof inputValue === 'boolean'
        ) {
          // Try common parameter names
          if (typeof inputValue === 'string' && schemaProps.query) {
            return { query: inputValue };
          }
          if (typeof inputValue === 'string' && schemaProps.path) {
            return { path: inputValue };
          }
          if (typeof inputValue === 'string' && schemaProps.directory) {
            return { directory: inputValue };
          }
          if (typeof inputValue === 'string' && schemaProps.file) {
            return { file: inputValue };
          }
          if (typeof inputValue === 'string' && schemaProps.name) {
            return { name: inputValue };
          }

          // If no common mapping found, map to first required property, then first property
          const requiredProps = inputSchema?.required || [];
          const targetProp = requiredProps.length > 0 ? requiredProps[0] : schemaPropertyNames[0];
          if (targetProp) {
            return { [targetProp]: inputValue };
          }
        }

        return this.createDefaultParameterStructure(inputSchema);
      }
    }

    // If args structure matches or is already properly formatted, filter and return
    return this.filterMCPArguments(args, inputSchema);
  }

  /**
   * Filters MCP arguments to schema fields and fills missing required properties.
   *
   * Required fields retain provided empty values. Optional fields are included
   * only when meaningful. Without a schema, an argument object is returned directly.
   *
   * @param args - Candidate argument value.
   * @param inputSchema - Optional MCP input schema.
   * @returns Filtered map with required defaults, or an empty map for non-object input.
   */
  private filterMCPArguments(args: unknown, inputSchema?: MCPInputSchema): Record<string, unknown> {
    if (!isArgumentMap(args)) return {};
    if (!inputSchema) return args;

    const schemaProps = inputSchema?.properties;
    const requiredProps = inputSchema?.required || [];

    if (!schemaProps) {
      return args;
    }

    const filteredArgs: Record<string, unknown> = {};

    // Always include all required properties, even if they have empty/default values
    for (const requiredProp of requiredProps) {
      if (requiredProp in args) {
        filteredArgs[requiredProp] = args[requiredProp];
      } else {
        // If required property is missing, add a default value based on schema
        const propSchema = schemaProps[requiredProp];
        if (propSchema) {
          if (propSchema.type === 'string') {
            filteredArgs[requiredProp] = propSchema.default ?? '';
          } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
            filteredArgs[requiredProp] = propSchema.default ?? 0;
          } else if (propSchema.type === 'boolean') {
            filteredArgs[requiredProp] = propSchema.default ?? false;
          } else if (propSchema.type === 'array') {
            filteredArgs[requiredProp] = propSchema.default ?? [];
          } else if (propSchema.type === 'object') {
            filteredArgs[requiredProp] = propSchema.default ?? {};
          } else {
            filteredArgs[requiredProp] = propSchema.default ?? {};
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
   * Checks whether an optional argument has a meaningful value.
   *
   * @param value - Value to inspect.
   * @returns `false` for nullish, empty-string, `NaN`, empty-array, and empty-object values.
   */
  private hasActualValue(value: unknown): boolean {
    // Null, undefined, or empty string are not actual values
    if (value === null || value === undefined || value === '') {
      return false;
    }

    // NaN is not an actual value
    if (typeof value === 'number' && Number.isNaN(value)) {
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
   * Creates type-based defaults for required schema properties.
   *
   * @param inputSchema - MCP input schema containing properties and required names.
   * @returns New map of required properties declared in the schema.
   */
  private createDefaultParameterStructure(inputSchema: MCPInputSchema): Record<string, unknown> {
    if (!inputSchema || !inputSchema.properties) {
      return {};
    }

    const defaultParams: Record<string, unknown> = {};
    const requiredProps = inputSchema.required || [];
    const schemaProps = inputSchema.properties;

    for (const requiredProp of requiredProps) {
      if (requiredProp in schemaProps) {
        const propSchema = schemaProps[requiredProp];

        // Create appropriate default values based on type
        if (propSchema.type === 'string') {
          defaultParams[requiredProp] = propSchema.default ?? '';
        } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
          defaultParams[requiredProp] = propSchema.default ?? 0;
        } else if (propSchema.type === 'boolean') {
          defaultParams[requiredProp] = propSchema.default ?? false;
        } else if (propSchema.type === 'array') {
          defaultParams[requiredProp] = propSchema.default ?? [];
        } else if (propSchema.type === 'object') {
          defaultParams[requiredProp] = propSchema.default ?? {};
        } else {
          // For unknown types, try to use the default or provide an empty object
          defaultParams[requiredProp] = propSchema.default ?? {};
        }
      }
    }

    return defaultParams;
  }

  /**
   * Configures the built-in Kubernetes tool when available and changed.
   *
   * @param context - Kubernetes dependencies and selection state.
   * @returns No value.
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
   * Adds a built-in tool unless its name is already registered.
   *
   * @param tool - LangChain tool wrapper to register.
   * @returns No value.
   */
  private addTool(tool: LangChainTool): void {
    // Check for duplicate tool names
    if (this.toolHandlers.has(tool.config.name)) {
      console.warn(`Tool with name '${tool.config.name}' already exists, skipping`);
      return;
    }

    this.tools.push(tool);
    this.toolHandlers.set(tool.config.name, tool);
  }

  /**
   * Refreshes MCP tools through the injected client.
   * Call this when MCP configuration changes (servers added/removed/reset).
   *
   * A stored fallback model is rebound when one exists.
   *
   * @returns No value after discovery and optional rebinding.
   */
  async refreshMCPTools(): Promise<void> {
    this.mcpToolsInitialized = false;
    this.mcpTools = [];
    await this.initializeMCPTools();

    // Rebind model if we have one, to update tool bindings
    if (this.boundModel && this.providerId) {
      await this.bindToModelAsync(this.boundModel, this.providerId);
    }
  }

  /**
   * Gets built-in and currently discovered MCP LangChain tools.
   *
   * Callers needing complete MCP inventory must first await
   * `waitForMCPToolsInitialization()`.
   *
   * @returns New combined array of built-in adapters and current MCP tools.
   */
  getLangChainTools() {
    const regularTools = this.tools.map(tool => tool.createLangChainTool());
    return [...regularTools, ...this.mcpTools];
  }

  /**
   * Gets the current MCP LangChain tool array.
   *
   * @returns Internal MCP tool array, which may be incomplete during discovery.
   */
  getMCPTools() {
    return this.mcpTools;
  }

  /**
   * Checks current built-in and MCP inventory for a tool name.
   *
   * @param toolName - Exact built-in or qualified MCP tool name.
   * @returns Whether the tool is currently present.
   */
  hasTool(toolName: string): boolean {
    // Check built-in tools first
    if (this.toolHandlers.has(toolName)) {
      return true;
    }

    // Check MCP tools
    return this.mcpTools.some(tool => tool.name === toolName);
  }

  /**
   * Executes a built-in or currently discovered MCP tool.
   *
   * Built-in and MCP execution failures are normally returned as structured
   * results. MCP output is error-detected and optionally model-formatted.
   *
   * @param toolName - Exact built-in or qualified MCP tool name.
   * @param args - Tool arguments; MCP adapters normalize them against their schema.
   * @param toolCallId - Optional built-in tool-call correlation ID.
   * @param pendingPrompt - Optional pending message passed to built-in handlers.
   * @returns Execution result with serialized content and error metadata when applicable.
   * @throws If inventory changes after the initial availability check and no handler remains.
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ): Promise<ToolExecutionResult> {
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
      try {
        return await regularTool.handler(args, toolCallId, pendingPrompt);
      } catch (error) {
        return {
          content: JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : 'Tool execution failed',
            toolName,
          }),
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: { error: 'tool_execution_error', toolName, isError: true },
        };
      }
    }

    // Check if it's an MCP tool
    const mcpTool = this.mcpTools.find(tool => tool.name === toolName);
    if (mcpTool) {
      try {
        const rawResult = await mcpTool.invoke(args);

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
              originalArgs: args,
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
              originalArgs: args,
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
              originalArgs: args,
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
            originalArgs: args,
          },
        };
      } catch (error) {
        console.error(`Error executing MCP tool ${toolName}:`, error);

        // Format execution errors properly if formatter is available
        let errorContent: string;
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
            originalArgs: args,
          });
        } else {
          errorContent = JSON.stringify({
            error: true,
            message: `Error executing MCP tool: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            toolName,
            originalArgs: args,
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
   * Binds currently available tools to a LangChain model.
   *
   * This synchronous method does not wait for MCP discovery. It creates the MCP
   * formatter lazily and returns the original model when no tools exist or binding fails.
   * Only those fallback paths retain `boundModel`; a successful bound model is
   * returned without being stored for later refresh rebinding.
   *
   * @param model - Chat model supporting LangChain tool binding.
   * @param providerId - Provider identifier used in binding diagnostics.
   * @returns Tool-bound model, or the original model on empty inventory or failure.
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

      // @todo: need to fix return type of this bindToModel method.
      // @ts-ignore
      return model.bindTools(langChainTools);
    } catch (error) {
      console.error(`Error binding tools to ${providerId} model:`, error);
      this.boundModel = model;
      return model;
    }
  }

  /**
   * Waits for MCP discovery and then binds all available tools.
   *
   * @param model - Chat model supporting LangChain tool binding.
   * @param providerId - Provider identifier used in binding diagnostics.
   * @returns Tool-bound model, or the original model when binding cannot be completed.
   */
  async bindToModelAsync(model: BaseChatModel, providerId: string): Promise<BaseChatModel> {
    // Wait for MCP tools to initialize before binding
    await this.waitForMCPToolsInitialization();

    return this.bindToModel(model, providerId);
  }

  /**
   * Waits for the currently tracked MCP initialization attempt.
   *
   * @returns No value after the tracked attempt settles.
   */
  async waitForMCPToolsInitialization(): Promise<void> {
    if (this.mcpInitializationPromise) {
      await this.mcpInitializationPromise;
    }
  }

  /**
   * Checks whether the latest discovery path marked MCP initialization complete.
   *
   * @returns Current initialization flag.
   */
  areMCPToolsInitialized(): boolean {
    return this.mcpToolsInitialized;
  }

  /**
   * Gets names from current built-in and MCP inventory.
   *
   * @returns New array of built-in names followed by qualified MCP names.
   */
  getToolNames(): string[] {
    const regularToolNames = this.tools.map(tool => tool.config.name);
    const mcpToolNames = this.mcpTools.map(tool => tool.name);
    return [...regularToolNames, ...mcpToolNames];
  }

  /**
   * Gets the injected MCP client.
   *
   * @returns Active client or the no-op fallback.
   */
  getMCPClient(): ToolClient {
    return this.mcpClient;
  }

  /**
   * Sets one MCP tool's enabled state and refreshes inventory on success.
   *
   * @param toolName - Qualified MCP tool name.
   * @param enabled - New enabled state.
   * @returns Whether persistence succeeded; unavailable clients return `false`.
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
   * Checks one MCP tool's enabled state.
   *
   * @param toolName - Qualified MCP tool name.
   * @returns Client result, or `true` when MCP is unavailable.
   */
  async isMCPToolEnabled(toolName: string): Promise<boolean> {
    if (!this.mcpClient.isAvailable()) {
      return true;
    }
    return await this.mcpClient.isToolEnabled(toolName);
  }

  /**
   * Gets persisted state for one MCP tool.
   *
   * @param toolName - Qualified MCP tool name.
   * @returns Tool state, or `null` when MCP is unavailable or state is absent.
   */
  async getMCPToolStats(toolName: string): Promise<MCPToolState | null> {
    if (!this.mcpClient.isAvailable()) {
      return null;
    }

    const { serverName, toolName: actualToolName } = this.mcpClient.parseToolName(toolName);
    return await this.mcpClient.getToolStats(serverName, actualToolName);
  }

  /**
   * Gets persisted MCP tool configuration.
   *
   * @returns Client envelope or an unavailable-client failure.
   */
  async getMCPToolsConfig(): Promise<{
    /** Whether configuration was read successfully. */
    success: boolean;
    /** Tool state grouped by server and bare tool name. */
    config?: MCPToolsConfig;
    /** Optional failure description. */
    error?: string;
  }> {
    if (!this.mcpClient.isAvailable()) {
      return {
        success: false,
        error: 'MCP client not available - not running in Electron environment',
      };
    }
    return await this.mcpClient.getToolsConfig();
  }

  /**
   * Replaces MCP tool configuration and refreshes inventory on success.
   *
   * @param config - Complete tool state grouped by server.
   * @returns Whether persistence succeeded; unavailable clients return `false`.
   */
  async updateMCPToolsConfig(config: MCPToolsConfig): Promise<boolean> {
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
   * Detects explicit JSON errors or common error text in MCP output.
   *
   * Non-empty error values except `false`, numeric zero, and an empty string
   * are treated as errors.
   *
   * @param result - Raw MCP result string.
   * @returns Whether the result matches an error signal.
   */
  private detectMCPError(result: string): boolean {
    try {
      const parsed = JSON.parse(result);

      // Check for explicit error indicators
      if (parsed.success === false || parsed.error === true) {
        return true;
      }

      // Check for non-empty, non-zero error codes (0 conventionally means no error)
      if (
        parsed.error !== undefined &&
        parsed.error !== null &&
        parsed.error !== false &&
        parsed.error !== 0 &&
        parsed.error !== ''
      ) {
        return true;
      }

      // Check for error messages
      if (parsed.message?.toLowerCase().includes('error')) {
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
   * Extracts an error message from MCP output.
   *
   * JSON fields are checked in error, message, details order. Non-JSON text is
   * returned directly or truncated to 200 characters plus an ellipsis.
   *
   * @param result - Raw MCP result string.
   * @returns Extracted, fallback, or truncated error message.
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
