import tools from '../../ai/mcp/electron-client';

export interface MCPToolSchema {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface UserContext {
  userMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  kubernetesContext?: {
    selectedClusters?: string[];
    namespace?: string;
    currentResource?: any;
  };
  lastToolResults?: Record<string, any>;
  timeContext?: Date;
}

export interface ProcessedArguments {
  original: Record<string, any>;
  processed: Record<string, any>;
  schema: MCPToolSchema | null;
  suggestions: Record<string, any>;
  errors: string[];
  intelligentFills: Record<string, { value: any; reason: string; confidence: number }>;
}

export class MCPArgumentProcessor {
  private static toolSchemas: Map<string, MCPToolSchema> = new Map();
  private static schemasLoaded = false;

  /**
   * Load MCP tool schemas
   */
  static async loadSchemas(): Promise<void> {
    if (this.schemasLoaded) return;

    try {
      const mcpTools = await tools();
      if (mcpTools && Array.isArray(mcpTools)) {
        mcpTools.forEach(tool => {
          this.toolSchemas.set(tool.name, {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          });
        });
        this.schemasLoaded = true;
        console.log('MCPArgumentProcessor: Loaded schemas for', this.toolSchemas.size, 'tools');
      }
    } catch (error) {
      console.error('Failed to load MCP tool schemas:', error);
    }
  }

  /**
   * Validate and process arguments for MCP tools (simplified version)
   * Main argument generation is now handled by AI in LangChainManager
   */
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
            intelligentFills[requiredField] = {
              value: processed[requiredField],
              reason: `Required field provided with empty ${fieldSchema.type}`,
              confidence: 0.8,
            };
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

  /**
   * Get appropriate empty value for required field
   */
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

  /**
   * Generate intelligent suggestions based on tool schema and context
   */
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

  /**
   * Generate suggestion for a specific property
   */
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

  /**
   * Suggest string values based on property name and context
   */
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
      return '/Users/ashughildiyal/Desktop'; // Safe default path
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

  /**
   * Suggest number values
   */
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

  /**
   * Suggest boolean values
   */
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

  /**
   * Suggest array values
   */
  private static suggestArrayValue(): any[] | undefined {
    // Return empty array for optional arrays
    return [];
  }

  /**
   * Suggest object values
   */
  private static suggestObjectValue(): Record<string, any> | undefined {
    // Return empty object for optional objects
    return {};
  }

  /**
   * Clean up arguments by removing empty non-required fields
   */
  static cleanupArguments(args: Record<string, any>, schema: MCPToolSchema): Record<string, any> {
    if (!schema.inputSchema) return args;

    const cleaned: Record<string, any> = {};
    const required = schema.inputSchema.required || [];
    const properties = schema.inputSchema.properties || {};

    for (const [key, value] of Object.entries(args)) {
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

  /**
   * Check if a value is meaningful (not empty/null/undefined)
   */
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

  /**
   * Validate arguments against schema with support for empty objects/arrays
   */
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

  /**
   * Get tool schema
   */
  static async getToolSchema(toolName: string): Promise<MCPToolSchema | null> {
    await this.loadSchemas();
    return this.toolSchemas.get(toolName) || null;
  }

  /**
   * Get all available tool names
   */
  static async getAvailableTools(): Promise<string[]> {
    await this.loadSchemas();
    return Array.from(this.toolSchemas.keys());
  }
}
