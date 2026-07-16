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

import type { MCPToolSchema, ProcessorToolsConfig } from './types';

/** Loads persisted MCP tool metadata from the host environment. */
export type MCPToolsConfigLoader = () => Promise<{
  /** Whether the host configuration request succeeded. */
  success: boolean;
  /** Persisted tool metadata grouped by server when available. */
  config?: ProcessorToolsConfig;
}>;

/** Loads and caches MCP tool schemas for argument processing. */
export class MCPToolSchemaRegistry {
  private toolSchemas = new Map<string, MCPToolSchema>();
  private loaded = false;

  /** Host-provided tool-configuration loader. */
  loader: MCPToolsConfigLoader | null = null;

  /**
   * Loads schemas once per registry lifecycle.
   *
   * @returns A promise that resolves after loading is attempted.
   */
  async load(): Promise<void> {
    if (this.loaded) return;
    const loader = this.loader;
    if (!loader) return;

    try {
      const response = await loader();
      if (response.config) {
        for (const [serverName, serverTools] of Object.entries(response.config)) {
          for (const [toolName, toolConfig] of Object.entries(serverTools)) {
            const fullToolName = `${serverName}__${toolName}`;
            this.toolSchemas.set(fullToolName, {
              name: fullToolName,
              description: toolConfig.description,
              inputSchema: toolConfig.inputSchema as MCPToolSchema['inputSchema'],
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load MCP tool schemas:', error);
    } finally {
      this.loaded = true;
    }
  }

  /**
   * Returns a schema after ensuring the registry has attempted loading.
   *
   * @param toolName - Fully qualified tool name to look up.
   * @returns The loaded schema, or `null` when no schema is registered.
   */
  async get(toolName: string): Promise<MCPToolSchema | null> {
    await this.load();
    return this.toolSchemas.get(toolName) ?? null;
  }

  /**
   * Returns a schema already present in the cache without loading.
   *
   * @param toolName - Fully qualified tool name to look up.
   * @returns The cached schema, or `null` when it is absent.
   */
  getCached(toolName: string): MCPToolSchema | null {
    return this.toolSchemas.get(toolName) ?? null;
  }

  /**
   * Returns all loaded tool names.
   *
   * @returns Fully qualified names for every registered schema.
   */
  async list(): Promise<string[]> {
    await this.load();
    return Array.from(this.toolSchemas.keys());
  }

  /**
   * Returns whether a load attempt has completed.
   *
   * @returns Whether loading has completed or failed for this lifecycle.
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Clears cached schemas, loading state, and the host loader.
   *
   * @returns No value.
   */
  reset(): void {
    this.toolSchemas.clear();
    this.loaded = false;
    this.loader = null;
  }
}

/** Shared registry used by the static argument-processor API. */
export const mcpToolSchemaRegistry = new MCPToolSchemaRegistry();
