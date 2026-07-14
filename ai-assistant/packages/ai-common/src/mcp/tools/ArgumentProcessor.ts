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
  /** Injected by the host to fetch tool configuration without importing electron-client. */
  static get getToolsConfig(): MCPToolsConfigLoader | null {
    return mcpToolSchemaRegistry.loader;
  }

  static set getToolsConfig(loader: MCPToolsConfigLoader | null) {
    mcpToolSchemaRegistry.loader = loader;
  }

  /** Loads available MCP tool schemas from the Electron client once per session. */
  static async loadSchemas(): Promise<void> {
    await mcpToolSchemaRegistry.load();
  }

  /** Validates arguments, applies required defaults, and returns UI-facing metadata. */
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

  /** Returns an empty placeholder value that satisfies a required field schema. */
  private static getEmptyValueForRequiredField(fieldSchema: JSONSchemaProperty): unknown {
    return argumentProcessing.getEmptyValueForRequiredField(fieldSchema);
  }

  /** Builds suggested argument values from schema metadata and optional user context. */
  private static generateIntelligentSuggestions(
    schema: MCPToolSchema,
    userContext?: UserContext
  ): ArgumentMap {
    return argumentProcessing.generateIntelligentSuggestions(schema, userContext);
  }

  /** Suggests a string value for a field based on its name, description, and schema. */
  private static suggestStringValue(
    propertyName: string,
    description: string,
    schema: JSONSchemaProperty
  ): string | undefined {
    return argumentProcessing.suggestStringValue(propertyName, description, schema);
  }

  /** Suggests a numeric value for a field based on schema defaults and common patterns. */
  private static suggestNumberValue(
    propertyName: string,
    description: string,
    schema: JSONSchemaProperty
  ): number | undefined {
    return argumentProcessing.suggestNumberValue(propertyName, description, schema);
  }

  /** Suggests conservative defaults for boolean fields based on naming patterns. */
  private static suggestBooleanValue(propertyName: string): boolean | undefined {
    return argumentProcessing.suggestBooleanValue(propertyName);
  }

  /** Suggests an empty array for optional array arguments. */
  private static suggestArrayValue(): unknown[] | undefined {
    return argumentProcessing.suggestArrayValue();
  }

  /** Suggests an empty object for optional object arguments. */
  private static suggestObjectValue(): ArgumentMap | undefined {
    return argumentProcessing.suggestObjectValue();
  }

  /** Removes empty optional values while keeping required fields and schema defaults. */
  static cleanupArguments(args: ArgumentMap, schema: MCPToolSchema): ArgumentMap {
    return argumentProcessing.cleanupArguments(args, schema);
  }

  /** Validates required fields and basic type compatibility for processed arguments. */
  private static validateArgumentsWithEmptyObjectSupport(
    args: ArgumentMap,
    schema: MCPToolSchema
  ): string[] {
    return argumentProcessing.validateArgumentsWithEmptyObjectSupport(args, schema);
  }

  /** Returns the cached schema for a tool after loading schemas if needed. */
  static async getToolSchema(toolName: string): Promise<MCPToolSchema | null> {
    return mcpToolSchemaRegistry.get(toolName);
  }

  /** Returns the names of all MCP tools with loaded schemas. */
  static async getAvailableTools(): Promise<string[]> {
    return mcpToolSchemaRegistry.list();
  }
}
