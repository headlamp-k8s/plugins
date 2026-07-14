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
 * Manages persisted MCP tool state, including enablement, schemas, descriptions,
 * and usage statistics.
 *
 * Example:
 * ```ts
 *  const toolState = new ToolStateStore(storage);
 *  await toolState.initialize();
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
 * Returns `schema` if it looks like a JSON Schema object (non-array object with a
 * string `type`, `properties`, or `required` field), or `null` otherwise.
 *
 * This guards against accidentally persisting Zod schema objects, which
 * LangChain tools expose on their `.schema` property. Zod schemas are not
 * serialisable and do not have the shape that `validateToolArgs` expects.
 *
 * @param schema - Candidate JSON Schema or provider-specific schema value.
 * @returns The original schema object when it has a recognized JSON Schema field, otherwise `null`.
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
   * Creates a store backed by the given storage implementation.
   *
   * Pass `FileStorage` for Node/Electron-main environments. Browser/renderer
   * code should supply a localStorage or IPC-backed implementation
   * so this module never pulls in Node's `fs`.
   *
   * @param storage - Persistence implementation used for reads and writes.
   */
  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * Initializes store state from persistence.
   *
   * @returns No value after loading or resetting invalid persisted state.
   */
  async initialize(): Promise<void> {
    return await this.loadConfig();
  }

  /**
   * Loads MCP tool configuration from storage.
   *
   * Missing data and read or parse failures reset the in-memory configuration.
   *
   * @returns No value.
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
   * Persists the current configuration through storage asynchronously.
   *
   * Writes are debounced so that rapid state changes (e.g. bulk tool toggles)
   * are coalesced into a single file write, avoiding both event-loop blocking
   * (writeFileSync) and excessive I/O churn.
   *
   * @returns No value; serialization and storage failures are logged asynchronously.
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
   * Writes the current configuration synchronously and cancels a pending timer.
   *
   * Already-started asynchronous writes in the queue are not awaited.
   *
   * @returns No value; serialization and storage failures are logged.
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
   * Gets the enabled state of a specific tool.
   *
   * @param serverName - MCP server containing the tool.
   * @param toolName - Tool name within the server.
   * @returns `false` only for an explicitly disabled tool; unknown state defaults to `true`.
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
   * Sets the enabled state of a specific tool and schedules persistence.
   *
   * @param serverName - MCP server containing the tool.
   * @param toolName - Tool name within the server.
   * @param enabled - New enabled state.
   * @returns No value.
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
   * Gets explicitly disabled tools for a server.
   *
   * @param serverName - MCP server to inspect.
   * @returns Tool names whose enabled state is exactly `false`.
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
   * Gets enabled and default-enabled tools for a server.
   *
   * @param serverName - MCP server to inspect.
   * @returns Tool names whose enabled state is not `false`.
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
   * Records one tool use and schedules persistence.
   *
   * @param serverName - MCP server containing the tool.
   * @param toolName - Tool name within the server.
   * @returns No value.
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
   * Gets a deep JSON clone of the complete configuration.
   *
   * @returns Configuration snapshot detached from store state.
   */
  getConfig(): MCPToolsConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Sets the complete configuration from a deep JSON clone.
   *
   * @param newConfig - Configuration to clone and persist.
   * @returns No value.
   */
  setConfig(newConfig: MCPToolsConfig): void {
    this.config = JSON.parse(JSON.stringify(newConfig));
    this.saveConfig();
  }

  /**
   * Resets configuration to an empty state and schedules persistence.
   *
   * @returns No value.
   */
  resetConfig(): void {
    this.config = {};
    this.saveConfig();
  }

  /**
   * Initializes or refreshes available tools for one server.
   *
   * Existing enablement and usage fields are retained, tools absent from
   * `toolsInfo` are not removed, and changed schemas or descriptions are persisted.
   *
   * @param serverName - MCP server whose tools should be initialized.
   * @param toolsInfo - Current tool names and optional metadata.
   * @returns No value.
   */
  initializeToolsConfig(
    serverName: string,
    toolsInfo: Array<{
      /** Tool name within the server. */
      name: string;
      /** Candidate JSON input schema. */
      inputSchema?: unknown;
      /** Optional user-facing tool description. */
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
   * Gets a shallow copy of one tool's persisted state.
   *
   * @param serverName - MCP server containing the tool.
   * @param toolName - Tool name within the server.
   * @returns Shallow state copy, or `null` when the server or tool is unknown.
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
   *
   * Existing enabled state and usage count are preserved for retained tools;
   * other prior fields and tools are discarded.
   *
   * @param toolsByServer - Complete current tool inventory grouped by server.
   * @returns No value.
   */
  replaceToolsConfig(
    toolsByServer: Record<
      string,
      Array<{
        /** Tool name within the server. */
        name: string;
        /** Candidate JSON input schema. */
        inputSchema?: unknown;
        /** Optional user-facing tool description. */
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
   * Replaces the entire configuration by reference and schedules persistence.
   *
   * Unlike `setConfig`, this method does not clone its input.
   *
   * @param newConfig - Configuration object to adopt directly.
   * @returns No value.
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
   * @returns No value.
   */
  initConfigFromClientTools(
    clientTools: Array<{
      /** Qualified `<server>__<tool>` name. */
      name: string;
      /** Provider schema used when no explicit input schema is valid. */
      schema?: unknown;
      /** Preferred JSON input schema. */
      inputSchema?: unknown;
      /** Optional user-facing tool description. */
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
        /** Unqualified tool name within the server. */
        name: string;
        /** Validated JSON input schema. */
        inputSchema?: unknown;
        /** User-facing tool description. */
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
