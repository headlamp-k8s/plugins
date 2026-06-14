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

/** Describes the subset of MCP tool schema data used for argument processing. */
export interface MCPToolSchema {
  /** Full tool name, including any server prefix. */
  name: string;
  /** Optional description shown to users. */
  description?: string;
  /** JSON schema describing the tool input payload. */
  inputSchema?: {
    /** Root JSON schema type for the tool input. */
    type: string;
    /** Field definitions keyed by argument name. */
    properties?: Record<string, any>;
    /** Names of required arguments. */
    required?: string[];
  };
}

/** Supplies conversational context used to suggest or fill MCP arguments. */
export interface UserContext {
  /** Latest user message being processed. */
  userMessage?: string;
  /** Recent conversation messages for additional context. */
  conversationHistory?: Array<{ role: string; content: string }>;
  /** Kubernetes context that may help populate tool fields. */
  kubernetesContext?: {
    /** Currently selected clusters. */
    selectedClusters?: string[];
    /** Active namespace, if known. */
    namespace?: string;
    /** Current resource in focus. */
    currentResource?: any;
  };
  /** Recent tool results keyed by inferred context name. */
  lastToolResults?: Record<string, any>;
  /** Timestamp context used for time-sensitive suggestions. */
  timeContext?: Date;
}

/** Captures the result of validating and enriching tool arguments. */
export interface ProcessedArguments {
  /** Arguments received from the AI model before cleanup. */
  original: Record<string, any>;
  /** Final arguments after validation and inferred fills. */
  processed: Record<string, any>;
  /** Schema used during processing, if available. */
  schema: MCPToolSchema | null;
  /** Suggested field values for UI display. */
  suggestions: Record<string, any>;
  /** Validation errors found during processing. */
  errors: string[];
  /** Fields filled automatically, with explanation and confidence. */
  intelligentFills: Record<string, { value: any; reason: string; confidence: number }>;
}

/** Loads MCP schemas and helps validate, clean, and enrich tool arguments. */
export class MCPArgumentProcessor {
  private static toolSchemas: Map<string, MCPToolSchema> = new Map();
  private static schemasLoaded = false;
  /** Injected by the host to fetch tool configuration without importing electron-client. */
  static getToolsConfig: (() => Promise<{ success: boolean; config?: any }>) | null = null;

  /** Loads available MCP tool schemas from the Electron client once per session. */
  static async loadSchemas(): Promise<void> {
    if (this.schemasLoaded) return;

    try {
      if (!MCPArgumentProcessor.getToolsConfig) return;
      const toolsConfigResponse = await MCPArgumentProcessor.getToolsConfig();

      if (toolsConfigResponse && toolsConfigResponse.config) {
        // Parse the new structure: { "serverName": { "toolName": { enabled, inputSchema, ... } } }
        Object.entries(toolsConfigResponse.config).forEach(
          ([serverName, serverTools]: [string, any]) => {
            Object.entries(serverTools).forEach(([toolName, toolConfig]: [string, any]) => {
              const fullToolName = `${serverName}__${toolName}`;
              this.toolSchemas.set(fullToolName, {
                name: fullToolName,
                description: toolConfig.description,
                inputSchema: toolConfig.inputSchema,
              });
            });
          }
        );
        this.schemasLoaded = true;
      }
    } catch (error) {
      console.error('Failed to load MCP tool schemas:', error);
    }
  }

  /** Validates arguments, applies required defaults, and returns UI-facing metadata. */
  static async processArguments(
    toolName: string,
    aiProcessedArgs: Record<string, any> = {},
    userContext?: UserContext
  ): Promise<ProcessedArguments> {
    await this.loadSchemas();
    const schema = this.toolSchemas.get(toolName);
    const errors: string[] = [];
    const processed = { ...aiProcessedArgs };
    const intelligentFills: Record<string, { value: any; reason: string; confidence: number }> = {};

    // Check if arguments were enhanced by LLM
    const llmEnhanced = aiProcessedArgs._llmEnhanced;
    if (llmEnhanced) {
      // Remove metadata before processing
      delete processed._llmEnhanced;

      // Mark LLM-enhanced fields in intelligentFills
      for (const fieldName of llmEnhanced.enhancedFields || []) {
        if (fieldName in processed) {
          intelligentFills[fieldName] = {
            value: processed[fieldName],
            reason: 'AI-enhanced based on user request analysis',
            confidence: 0.9, // High confidence for LLM-enhanced fields
          };
        }
      }
    }

    if (!schema) {
      errors.push(`No schema found for tool: ${toolName}`);
      return {
        original: aiProcessedArgs,
        processed,
        schema: null,
        suggestions: {},
        errors,
        intelligentFills,
      };
    }

    // Ensure required fields have appropriate values (even if empty objects/arrays)
    if (schema.inputSchema?.required) {
      for (const requiredField of schema.inputSchema.required) {
        if (!(requiredField in processed) || processed[requiredField] === undefined) {
          const fieldSchema = schema.inputSchema.properties?.[requiredField];
          if (fieldSchema) {
            // Provide appropriate empty value based on type
            processed[requiredField] = this.getEmptyValueForRequiredField(fieldSchema);

            // Only mark as intelligent fill if not already enhanced by LLM
            if (!intelligentFills[requiredField]) {
              intelligentFills[requiredField] = {
                value: processed[requiredField],
                reason: `Required field provided with empty ${fieldSchema.type}`,
                confidence: 0.8,
              };
            }
          }
        }
      }
    }

    // Generate suggestions for UI display
    const suggestions = this.generateIntelligentSuggestions(schema, userContext);

    // Validate processed arguments
    const validationErrors = this.validateArgumentsWithEmptyObjectSupport(processed, schema);
    errors.push(...validationErrors);

    return {
      original: aiProcessedArgs,
      processed,
      schema,
      suggestions,
      errors,
      intelligentFills,
    };
  }

  /** Returns an empty placeholder value that satisfies a required field schema. */
  private static getEmptyValueForRequiredField(fieldSchema: any): any {
    const type = fieldSchema.type;

    switch (type) {
      case 'object':
        return {};
      case 'array':
        return [];
      case 'string':
        return fieldSchema.default || '';
      case 'number':
      case 'integer':
        return fieldSchema.default || fieldSchema.minimum || 0;
      case 'boolean':
        return fieldSchema.default !== undefined ? fieldSchema.default : false;
      default:
        return null;
    }
  }

  /** Builds suggested argument values from schema metadata and optional user context. */
  private static generateIntelligentSuggestions(
    schema: MCPToolSchema,
    userContext?: UserContext
  ): Record<string, any> {
    const suggestions: Record<string, any> = {};

    if (!schema.inputSchema?.properties) return suggestions;

    const properties = schema.inputSchema.properties;

    // Generate suggestions based on property types and names
    for (const [key, propertySchema] of Object.entries(properties)) {
      const suggestion = this.generatePropertySuggestion(key, propertySchema, userContext);
      if (suggestion !== undefined) {
        suggestions[key] = suggestion;
      }
    }

    return suggestions;
  }

  /** Suggests a value for one schema property using context and field heuristics. */
  private static generatePropertySuggestion(
    propertyName: string,
    propertySchema: any,
    userContext?: UserContext
  ): any {
    const type = propertySchema.type;
    const description = propertySchema.description?.toLowerCase() || '';

    // Check context data for matching values
    if (userContext) {
      // Check kubernetes context
      if (userContext.kubernetesContext) {
        const k8sContext = userContext.kubernetesContext;
        if (propertyName.toLowerCase().includes('namespace') && k8sContext.namespace) {
          return k8sContext.namespace;
        }
        if (propertyName.toLowerCase().includes('cluster') && k8sContext.selectedClusters?.length) {
          return k8sContext.selectedClusters[0];
        }
      }

      // Check last tool results
      if (userContext.lastToolResults) {
        const lowerPropName = propertyName.toLowerCase();
        for (const [contextKey, contextValue] of Object.entries(userContext.lastToolResults)) {
          if (
            contextKey.toLowerCase().includes(lowerPropName) ||
            lowerPropName.includes(contextKey.toLowerCase())
          ) {
            return contextValue;
          }
        }
      }
    }

    // Generate suggestions based on property name and type
    switch (type) {
      case 'string':
        return this.suggestStringValue(propertyName, description, propertySchema);
      case 'number':
      case 'integer':
        return this.suggestNumberValue(propertyName, description, propertySchema);
      case 'boolean':
        return this.suggestBooleanValue(propertyName);
      case 'array':
        return this.suggestArrayValue();
      case 'object':
        return this.suggestObjectValue();
      default:
        return undefined;
    }
  }

  /** Suggests a string value for a field based on its name, description, and schema. */
  private static suggestStringValue(
    propertyName: string,
    description: string,
    schema: any
  ): string | undefined {
    const lowerName = propertyName.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // Check for enum values
    if (schema.enum && Array.isArray(schema.enum)) {
      return schema.enum[0]; // Default to first enum value
    }

    // Path-related suggestions
    if (
      lowerName.includes('path') ||
      lowerName.includes('directory') ||
      lowerName.includes('dir')
    ) {
      if (lowerDesc.includes('current') || lowerDesc.includes('working')) {
        return '.';
      }
      if (lowerDesc.includes('home')) {
        return '~';
      }
      return undefined;
    }

    // File-related suggestions
    if (lowerName.includes('file') || lowerName.includes('filename')) {
      return '';
    }

    // Name suggestions
    if (lowerName.includes('name') && !lowerName.includes('filename')) {
      return '';
    }

    // Command suggestions
    if (lowerName.includes('command') || lowerName.includes('cmd')) {
      return '';
    }

    // Query suggestions
    if (lowerName.includes('query') || lowerName.includes('search')) {
      return '';
    }

    return undefined;
  }

  /** Suggests a numeric value for a field based on schema defaults and common patterns. */
  private static suggestNumberValue(
    propertyName: string,
    description: string,
    schema: any
  ): number | undefined {
    const lowerName = propertyName.toLowerCase();

    // Check for default in schema
    if (schema.default !== undefined) {
      return schema.default;
    }

    // Check for minimum value
    if (schema.minimum !== undefined) {
      return schema.minimum;
    }

    // Common number patterns
    if (lowerName.includes('port')) {
      return 8080;
    }
    if (lowerName.includes('timeout')) {
      return 30;
    }
    if (lowerName.includes('limit') || lowerName.includes('max')) {
      return 100;
    }
    if (lowerName.includes('count')) {
      return 10;
    }

    return undefined;
  }

  /** Suggests conservative defaults for boolean fields based on naming patterns. */
  private static suggestBooleanValue(propertyName: string): boolean | undefined {
    const lowerName = propertyName.toLowerCase();
    // Note: description analysis could be added here for more intelligent suggestions

    // Common boolean patterns
    if (lowerName.includes('enable') || lowerName.includes('enabled')) {
      return false; // Conservative default
    }
    if (lowerName.includes('disable') || lowerName.includes('disabled')) {
      return false;
    }
    if (lowerName.includes('recursive') || lowerName.includes('recurse')) {
      return false;
    }
    if (lowerName.includes('force')) {
      return false;
    }
    if (lowerName.includes('verbose')) {
      return false;
    }

    return undefined;
  }

  /** Suggests an empty array for optional array arguments. */
  private static suggestArrayValue(): any[] | undefined {
    return [];
  }

  /** Suggests an empty object for optional object arguments. */
  private static suggestObjectValue(): Record<string, any> | undefined {
    return {};
  }

  /** Removes empty optional values while keeping required fields and schema defaults. */
  static cleanupArguments(args: Record<string, any>, schema: MCPToolSchema): Record<string, any> {
    if (!schema.inputSchema) return args;

    const cleaned: Record<string, any> = {};
    const required = schema.inputSchema.required || [];
    const properties = schema.inputSchema.properties || {};

    for (const [key, value] of Object.entries(args)) {
      // Skip LLM metadata
      if (key === '_llmEnhanced') continue;

      const isRequired = required.includes(key);
      const propertySchema = properties[key];
      const hasDefault = propertySchema?.default !== undefined;

      // Include if:
      // 1. Required field
      // 2. Has a non-empty value
      // 3. Has a default value defined in schema
      if (isRequired || this.hasActualValue(value) || hasDefault) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /** Returns whether a value should be treated as meaningfully populated. */
  private static hasActualValue(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /** Validates required fields and basic type compatibility for processed arguments. */
  private static validateArgumentsWithEmptyObjectSupport(
    args: Record<string, any>,
    schema: MCPToolSchema
  ): string[] {
    const errors: string[] = [];

    if (!schema.inputSchema) return errors;

    const required = schema.inputSchema.required || [];
    const properties = schema.inputSchema.properties || {};

    // Check required fields (allow empty objects/arrays for required fields)
    for (const requiredField of required) {
      if (
        !(requiredField in args) ||
        args[requiredField] === undefined ||
        args[requiredField] === null
      ) {
        errors.push(`Required field '${requiredField}' is missing`);
      }
    }

    // Check type validation
    for (const [key, value] of Object.entries(args)) {
      if (properties[key] && value !== undefined && value !== null) {
        const expectedType = properties[key].type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (expectedType && actualType !== expectedType) {
          errors.push(`Field '${key}' should be ${expectedType}, got ${actualType}`);
        }
      }
    }

    return errors;
  }

  /** Returns the cached schema for a tool after loading schemas if needed. */
  static async getToolSchema(toolName: string): Promise<MCPToolSchema | null> {
    await this.loadSchemas();
    return this.toolSchemas.get(toolName) || null;
  }

  /** Returns the names of all MCP tools with loaded schemas. */
  static async getAvailableTools(): Promise<string[]> {
    await this.loadSchemas();
    return Array.from(this.toolSchemas.keys());
  }
}
