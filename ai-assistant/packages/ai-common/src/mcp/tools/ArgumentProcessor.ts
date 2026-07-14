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

import * as argumentProcessing from './processArguments';
import { mcpToolSchemaRegistry, type MCPToolsConfigLoader } from './schemaRegistry';
import type {
  ArgumentMap,
  JSONSchemaProperty,
  MCPToolSchema,
  ProcessedArguments,
  UserContext,
} from './types';

/** Loads MCP schemas and orchestrates pure argument processing. */
export class MCPArgumentProcessor {
  /**
   * Returns the host-injected tool configuration loader.
   *
   * @returns The current loader, or `null` when none is configured.
   */
  static get getToolsConfig(): MCPToolsConfigLoader | null {
    return mcpToolSchemaRegistry.loader;
  }

  /**
   * Sets the host-injected tool configuration loader.
   *
   * @param loader - Loader to use, or `null` to disable schema loading.
   */
  static set getToolsConfig(loader: MCPToolsConfigLoader | null) {
    mcpToolSchemaRegistry.loader = loader;
  }

  /**
   * Loads available MCP tool schemas from the host once per registry lifecycle.
   *
   * @returns A promise that resolves after loading is attempted.
   */
  static async loadSchemas(): Promise<void> {
    await mcpToolSchemaRegistry.load();
  }

  /**
   * Validates arguments, applies required defaults, and returns UI-facing metadata.
   *
   * @param toolName - Fully qualified tool name whose schema should be used.
   * @param aiProcessedArgs - Model-prepared arguments to validate and enrich.
   * @param userContext - Optional request context used for intelligent defaults.
   * @returns Original, processed, suggested, error, and intelligent-fill metadata.
   */
  static async processArguments(
    toolName: string,
    aiProcessedArgs: ArgumentMap = {},
    userContext?: UserContext
  ): Promise<ProcessedArguments> {
    await this.loadSchemas();
    return argumentProcessing.processArguments(
      toolName,
      aiProcessedArgs,
      mcpToolSchemaRegistry.getCached(toolName),
      userContext
    );
  }

  /**
   * Returns an empty placeholder value that satisfies a required field schema.
   *
   * @param fieldSchema - Field schema whose type determines the placeholder.
   * @returns Type-appropriate empty value or schema default.
   */
  private static getEmptyValueForRequiredField(fieldSchema: JSONSchemaProperty): unknown {
    return argumentProcessing.getEmptyValueForRequiredField(fieldSchema);
  }

  /**
   * Builds suggested argument values from schema metadata and optional user context.
   *
   * @param schema - Tool schema containing properties and required fields.
   * @param userContext - Optional request context used for contextual suggestions.
   * @returns Suggested values keyed by argument name.
   */
  private static generateIntelligentSuggestions(
    schema: MCPToolSchema,
    userContext?: UserContext
  ): ArgumentMap {
    return argumentProcessing.generateIntelligentSuggestions(schema, userContext);
  }

  /**
   * Suggests a string value for a field based on its name, description, and schema.
   *
   * @param propertyName - Argument name used for naming heuristics.
   * @param description - Field description used for semantic hints.
   * @param schema - Field schema containing enum and default values.
   * @returns Suggested string, or `undefined` when no conservative value exists.
   */
  private static suggestStringValue(
    propertyName: string,
    description: string,
    schema: JSONSchemaProperty
  ): string | undefined {
    return argumentProcessing.suggestStringValue(propertyName, description, schema);
  }

  /**
   * Suggests a numeric value for a field based on schema defaults and common patterns.
   *
   * @param propertyName - Argument name used for naming heuristics.
   * @param description - Field description used for semantic hints.
   * @param schema - Field schema containing default and minimum values.
   * @returns Suggested number, or `undefined` when no conservative value exists.
   */
  private static suggestNumberValue(
    propertyName: string,
    description: string,
    schema: JSONSchemaProperty
  ): number | undefined {
    return argumentProcessing.suggestNumberValue(propertyName, description, schema);
  }

  /**
   * Suggests conservative defaults for boolean fields based on naming patterns.
   *
   * @param propertyName - Argument name used for boolean heuristics.
   * @returns Suggested boolean, or `undefined` when no heuristic matches.
   */
  private static suggestBooleanValue(propertyName: string): boolean | undefined {
    return argumentProcessing.suggestBooleanValue(propertyName);
  }

  /**
   * Suggests an empty array for optional array arguments.
   *
   * @returns An empty array suggestion.
   */
  private static suggestArrayValue(): unknown[] | undefined {
    return argumentProcessing.suggestArrayValue();
  }

  /**
   * Suggests an empty object for optional object arguments.
   *
   * @returns An empty object suggestion.
   */
  private static suggestObjectValue(): ArgumentMap | undefined {
    return argumentProcessing.suggestObjectValue();
  }

  /**
   * Removes empty optional values while keeping required fields and schema defaults.
   *
   * @param args - Arguments to clean without mutating the input.
   * @param schema - Tool schema that identifies required fields and defaults.
   * @returns Cleaned argument values.
   */
  static cleanupArguments(args: ArgumentMap, schema: MCPToolSchema): ArgumentMap {
    return argumentProcessing.cleanupArguments(args, schema);
  }

  /**
   * Validates required fields and basic type compatibility for processed arguments.
   *
   * @param args - Processed arguments to validate.
   * @param schema - Tool schema containing requirements and expected types.
   * @returns Validation error messages; empty when arguments are valid.
   */
  private static validateArgumentsWithEmptyObjectSupport(
    args: ArgumentMap,
    schema: MCPToolSchema
  ): string[] {
    return argumentProcessing.validateArgumentsWithEmptyObjectSupport(args, schema);
  }

  /**
   * Returns the cached schema for a tool after loading schemas if needed.
   *
   * @param toolName - Fully qualified tool name to look up.
   * @returns The loaded schema, or `null` when unavailable.
   */
  static async getToolSchema(toolName: string): Promise<MCPToolSchema | null> {
    return mcpToolSchemaRegistry.get(toolName);
  }

  /**
   * Returns the names of all MCP tools with loaded schemas.
   *
   * @returns Fully qualified tool names in registry order.
   */
  static async getAvailableTools(): Promise<string[]> {
    return mcpToolSchemaRegistry.list();
  }
}
