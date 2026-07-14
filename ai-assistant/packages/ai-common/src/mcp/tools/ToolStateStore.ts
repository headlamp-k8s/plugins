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

import type { Storage } from '../persistence/Storage';
import type { MCPToolsConfig } from '../types';
import { parseMCPToolName } from './toolName';

/**
 * MCPToolStateStore manages configuration for MCP (Model Context Protocol)
 * tools, including enabled/disabled state and usage statistics.
 *
 * Example:
 * ```ts
 *  const toolStatePath = path.join(app.getPath('userData'), 'mcp-tools-config.json');
 *  const toolState = new MCPToolStateStore(toolStatePath);
 *
 *  // Example inputSchema
 *  const exampleSchema = {
 *    type: 'object',
 *     properties: {
 *       param1: { type: 'string', description: 'Parameter 1' },
 *       param2: { type: 'number', description: 'Parameter 2' },
 *     },
 *    required: ['param1'],
 *  };
 *
 *  // Initialize default config for available tools
 *  toolState.initializeToolsConfig('my-cluster', [
 *    { name: 'tool-a', inputSchema: exampleSchema, description: 'Tool A description' },
 *    { name: 'tool-b', inputSchema: exampleSchema, description: 'Tool B description' },
 *  ]);
 *
 *  // Enable or disable a tool
 *  toolState.setToolEnabled('my-cluster', 'tool-a', false);
 *
 *  // Check if a tool is enabled
 *  const isEnabled = toolState.isToolEnabled('my-cluster', 'tool-a');
 *
 *  // Get all disabled tools for a server
 *  const disabledTools = toolState.getDisabledTools('my-cluster');
 *
 *  // Record tool usage
 *  toolState.recordToolUsage('my-cluster', 'tool-a');
 *
 *  // Get tool statistics
 *  const toolStats = toolState.getToolStats('my-cluster', 'tool-a');
 *
 *  // Replace entire tools configuration
 *  toolState.replaceToolsConfig({
 *   'my-cluster': [
 *     { name: 'tool-a', inputSchema: {...}, description: 'Tool A description' },
 *     { name: 'tool-b', inputSchema: {...}, description: 'Tool B description' },
 *   ],
 *   'another-cluster': [
 *     { name: 'tool-c', inputSchema: {...}, description: 'Tool C description' },
 *   ],
 *  });
 *
 *  // Reset configuration
 *  toolState.resetConfig();
 *
 *  // Get the complete configuration
 *  const completeConfig = toolState.getConfig();
 *
 *  // Set the complete configuration
 *  toolState.setConfig(completeConfig);
 * ```
 */

/**
 * Returns `schema` if it looks like a JSON Schema object (plain object with a
 * string `type`, `properties`, or `required` field), or `null` otherwise.
 *
 * This guards against accidentally persisting Zod schema objects, which
 * LangChain tools expose on their `.schema` property. Zod schemas are not
 * serialisable and do not have the shape that `validateToolArgs` expects.
 */
function toJsonSchema(schema: unknown): Record<string, unknown> | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null;
  const s = schema as Record<string, unknown>;
  const looksLikeJsonSchema =
    typeof s['type'] === 'string' ||
    (typeof s['properties'] === 'object' && s['properties'] !== null) ||
    Array.isArray(s['required']);
  return looksLikeJsonSchema ? s : null;
}

export class ToolStateStore {
  private storage: Storage;
  private config: MCPToolsConfig = {};
  /** Timer used to debounce rapid successive writes. */
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** Serializes writes so an older snapshot cannot finish after a newer one. */
  private writeQueue: Promise<void> = Promise.resolve();

  /**
   * Creates a store backed by the given StorageAdapter.
   *
   * Pass a `FileStorageAdapter` for Node/Electron-main environments.
   * Browser/renderer code should supply a localStorage or IPC-backed adapter
   * so this module never pulls in Node's `fs`.
   */
  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * Initialize the MCP client.
   */
  async initialize(): Promise<void> {
    return await this.loadConfig();
  }

  /**
   * Load MCP tools configuration from file
   */
  private async loadConfig(): Promise<void> {
    try {
      const raw = await this.storage.read();
      if (raw !== null) {
        this.config = JSON.parse(raw);
      } else {
        this.config = {};
      }
    } catch (error) {
      console.error('Error loading MCP tools configuration:', error);
      this.config = {};
    }
  }

  /**
   * Persist the current configuration to disk asynchronously.
   *
   * Writes are debounced so that rapid state changes (e.g. bulk tool toggles)
   * are coalesced into a single file write, avoiding both event-loop blocking
   * (writeFileSync) and excessive I/O churn.
   */
  private saveConfig(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        const data = JSON.stringify(this.config, null, 2);
        this.writeQueue = this.writeQueue
          .then(() => this.storage.write(data))
          .catch(error => {
            console.error('Error saving MCP tools configuration:', error);
          });
      } catch (error) {
        console.error('Error saving MCP tools configuration:', error);
      }
    }, 50);
  }

  /**
   * Flush any pending debounced write immediately (synchronous).
   *
   * Intended for use in tests and shutdown paths where the pending write must
   * complete before reading the file or exiting.
   */
  flushSync(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    try {
      this.storage.writeSync(JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving MCP tools configuration:', error);
    }
  }

  /**
   * Get the enabled state of a specific tool
   */
  isToolEnabled(serverName: string, toolName: string): boolean {
    const serverConfig = this.config[serverName];
    if (!serverConfig) {
      // Default to enabled for new tools
      return true;
    }

    const toolState = serverConfig[toolName];
    if (!toolState) {
      // Default to enabled for new tools
      return true;
    }

    return toolState.enabled !== false; // default-enabled: treat missing/undefined as true
  }

  /**
   * Set the enabled state of a specific tool
   */
  setToolEnabled(serverName: string, toolName: string, enabled: boolean): void {
    if (!this.config[serverName]) {
      this.config[serverName] = {};
    }

    if (!this.config[serverName][toolName]) {
      this.config[serverName][toolName] = {
        enabled: true,
        usageCount: 0,
      };
    }

    this.config[serverName][toolName].enabled = enabled;
    this.saveConfig();
  }

  /**
   * Get all disabled tools for a server
   */
  getDisabledTools(serverName: string): string[] {
    const serverConfig = this.config[serverName];
    if (!serverConfig) {
      return [];
    }

    return Object.entries(serverConfig)
      .filter(([, toolState]) => toolState.enabled === false)
      .map(([toolName]) => toolName);
  }

  /**
   * Get all enabled tools for a server
   */
  getEnabledTools(serverName: string): string[] {
    const serverConfig = this.config[serverName];
    if (!serverConfig) {
      return [];
    }

    return Object.entries(serverConfig)
      .filter(([, toolState]) => toolState.enabled !== false)
      .map(([toolName]) => toolName);
  }

  /**
   * Update tool usage statistics
   */
  recordToolUsage(serverName: string, toolName: string): void {
    if (!this.config[serverName]) {
      this.config[serverName] = {};
    }

    if (!this.config[serverName][toolName]) {
      this.config[serverName][toolName] = {
        enabled: true,
        usageCount: 0,
      };
    }

    const toolState = this.config[serverName][toolName];
    toolState.lastUsed = new Date().toISOString();
    toolState.usageCount = (toolState.usageCount || 0) + 1;
    this.saveConfig();
  }

  /**
   * Get the complete configuration
   */
  getConfig(): MCPToolsConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Set the complete configuration
   */
  setConfig(newConfig: MCPToolsConfig): void {
    this.config = JSON.parse(JSON.stringify(newConfig));
    this.saveConfig();
  }

  /**
   * Reset configuration to empty state
   */
  resetConfig(): void {
    this.config = {};
    this.saveConfig();
  }

  /**
   * Initialize default configuration for available tools with schemas
   */
  initializeToolsConfig(
    serverName: string,
    toolsInfo: Array<{
      name: string;
      inputSchema?: unknown;
      description?: string;
    }>
  ): void {
    if (!this.config[serverName]) {
      this.config[serverName] = {};
    }

    const serverConfig = this.config[serverName];
    let hasChanges = false;

    for (const toolInfo of toolsInfo) {
      const toolName = toolInfo.name;

      if (!serverConfig[toolName]) {
        serverConfig[toolName] = {
          enabled: true,
          usageCount: 0,
          inputSchema: toJsonSchema(toolInfo.inputSchema) ?? null,
          description: toolInfo.description || '',
        };
        hasChanges = true;
      } else {
        // Always update schema and description for existing tools
        let toolChanged = false;

        // Update schema if it's different or missing.
        // Run through toJsonSchema() first to strip non-serialisable values
        // (e.g. Zod schemas) before JSON.stringify comparison.
        const safeNewSchema = toJsonSchema(toolInfo.inputSchema) ?? null;
        const currentSchema = JSON.stringify(serverConfig[toolName].inputSchema ?? null);
        const newSchema = JSON.stringify(safeNewSchema);
        if (currentSchema !== newSchema) {
          serverConfig[toolName].inputSchema = safeNewSchema;
          toolChanged = true;
        }

        // Update description if it's different or missing
        const currentDescription = serverConfig[toolName].description || '';
        const newDescription = toolInfo.description || '';
        if (currentDescription !== newDescription) {
          serverConfig[toolName].description = newDescription;
          toolChanged = true;
        }

        if (toolChanged) {
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      this.saveConfig();
    }
  }

  /**
   * Get tool statistics
   */
  getToolStats(serverName: string, toolName: string): MCPToolsConfig[string][string] | null {
    const serverConfig = this.config[serverName];
    if (!serverConfig || !serverConfig[toolName]) {
      return null;
    }

    return { ...serverConfig[toolName] };
  }

  /**
   * Replace the entire tools configuration with a new set of tools
   * This overwrites all existing tools with only the current ones
   */
  replaceToolsConfig(
    toolsByServer: Record<
      string,
      Array<{
        name: string;
        inputSchema?: unknown;
        description?: string;
      }>
    >
  ): void {
    // Create a new config object
    const newConfig: MCPToolsConfig = {};

    for (const [serverName, toolsInfo] of Object.entries(toolsByServer)) {
      newConfig[serverName] = {};

      for (const toolInfo of toolsInfo) {
        const toolName = toolInfo.name;

        // Check if this tool existed in the old config to preserve enabled state and usage count
        const oldToolState = this.config[serverName]?.[toolName];

        newConfig[serverName][toolName] = {
          enabled: oldToolState?.enabled ?? true, // Preserve enabled state or default to true
          usageCount: oldToolState?.usageCount ?? 0, // Preserve usage count or default to 0
          inputSchema: toJsonSchema(toolInfo.inputSchema) ?? null,
          description: toolInfo.description || '',
        };
      }
    }

    // Replace the entire config
    this.config = newConfig;
    this.saveConfig();
  }

  /**
   * Replace the entire configuration with a new config object
   */
  replaceConfig(newConfig: MCPToolsConfig): void {
    this.config = newConfig;
    this.saveConfig();
  }

  /**
   * Initialize tools configuration for all available tools from client tools.
   * This completely replaces the existing config with current tools.
   *
   * @param clientTools - Array of available tools with their schemas.
   *   Each tool should have a `name` property and optionally `schema`/`inputSchema` and `description`.
   */
  initConfigFromClientTools(
    clientTools: Array<{
      name: string;
      schema?: unknown;
      inputSchema?: unknown;
      description?: string;
    }>
  ): void {
    if (!clientTools || clientTools.length === 0) {
      // Clear the config if no tools are available
      this.replaceConfig({});
      return;
    }

    // Group tools by server name with their schemas
    const toolsByServer: Record<
      string,
      Array<{
        name: string;
        inputSchema?: unknown;
        description?: string;
      }>
    > = {};

    for (const tool of clientTools) {
      // Extract server name from tool name (format: "serverName__toolName")
      const { serverName, toolName } = parseMCPToolName(tool.name);

      // Prefer the explicit `inputSchema` field (already JSON Schema) over
      // `schema`, which LangChain tools expose as a Zod object. Zod schemas
      // are not serialisable and `validateToolArgs` expects JSON Schema shape
      // (with `properties`/`required`). Only store an object that actually
      // looks like JSON Schema.
      const toolSchema = toJsonSchema(tool.inputSchema) ?? toJsonSchema(tool.schema) ?? null;

      if (!toolsByServer[serverName]) {
        toolsByServer[serverName] = [];
      }

      toolsByServer[serverName].push({
        name: toolName,
        inputSchema: toolSchema,
        description: tool.description || '',
      });
    }

    // Replace the entire configuration with current tools
    this.replaceToolsConfig(toolsByServer);
  }
}
