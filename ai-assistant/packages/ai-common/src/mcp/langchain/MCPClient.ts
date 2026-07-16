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

import type { DynamicStructuredTool } from '@langchain/core/tools';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import {
  hasClusterDependentServers,
  makeMcpServers,
  validateToolArgs,
} from '../config/serverConfig';
import { FileStorage } from '../persistence/FileStorage';
import { parseMCPToolName } from '../tools/toolName';
import { ToolStateStore } from '../tools/ToolStateStore';
import type { MCPSettings, MCPToolsConfig, MCPToolState } from '../types';

/**
 * Provides MCP settings (load/save) — implemented by consumers
 * (e.g. Electron settings file, in-memory store for tests).
 */
export interface MCPSettingsProvider {
  /**
   * Loads the currently persisted MCP settings.
   *
   * @returns Persisted settings, or `null` when none exist.
   */
  loadMCPSettings(): MCPSettings | null;
  /**
   * Persists MCP settings after a confirmed update.
   *
   * @param settings - Complete settings to persist.
   * @returns No value.
   */
  saveMCPSettings(settings: MCPSettings): void;
}

/**
 * Handles user confirmation for sensitive MCP operations.
 * Consumers supply platform-specific implementations
 * (e.g. Electron dialog boxes, CLI prompts, auto-approve for tests).
 */
export interface MCPConfirmationHandler {
  /**
   * Confirms a pending MCP settings change with the user.
   *
   * @param currentSettings - Persisted settings, or `null` when absent.
   * @param nextSettings - Proposed replacement settings.
   * @returns Whether the change is approved.
   */
  confirmSettingsChange(
    currentSettings: MCPSettings | null,
    nextSettings: MCPSettings
  ): Promise<boolean>;
  /**
   * Confirms a pending MCP tools configuration change.
   *
   * @param currentConfig - Current per-tool state.
   * @param nextConfig - Proposed replacement per-tool state.
   * @returns Whether the change is approved.
   */
  confirmToolsConfigChange(
    currentConfig: MCPToolsConfig,
    nextConfig: MCPToolsConfig
  ): Promise<boolean>;
  /**
   * Confirms a generic sensitive MCP operation.
   *
   * @param title - User-facing confirmation title.
   * @param message - User-facing operation description.
   * @param operation - Operation label supplied to the handler.
   * @returns Whether the operation is approved.
   */
  confirmOperation(title: string, message: string, operation: string): Promise<boolean>;
}

const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * MCPClient — MCP lifecycle and tool execution logic.
 *
 * Manages the lifecycle of a MultiServerMCPClient (from @langchain/mcp-adapters),
 * tool execution, tool state, cluster-change handling, and settings/config
 * operations. Server settings and confirmation UI are abstracted behind the
 * injected provider and handler; per-tool state uses file-backed storage at
 * the configured path.
 *
 * Example:
 * ```ts
 *   const core = new MCPClient(configPath, settingsProvider, confirmationHandler);
 *   await core.initialize();
 *   await core.handleClustersChange(['cluster-1']);
 *   const result = await core.executeTool('server__tool', { arg: 1 }, 'call-1');
 *   await core.cleanup();
 * ```
 */
export class MCPClient {
  private mcpToolState: ToolStateStore | null = null;
  private clientTools: DynamicStructuredTool[] = [];
  private client: MultiServerMCPClient | null = null;
  private isClientInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private clusters: string[] = [];
  private currentClusters: string[] | null = null;
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  /**
   * Creates a platform-agnostic MCP client core.
   *
   * Construction does not connect to servers; call `initialize()` first.
   *
   * @param configPath - File path used for persisted tool state.
   * @param settingsProvider - Platform implementation for MCP server settings.
   * @param confirmationHandler - Optional confirmation implementation; absence permits updates directly.
   */
  constructor(
    private readonly configPath: string,
    private readonly settingsProvider: MCPSettingsProvider,
    private readonly confirmationHandler?: MCPConfirmationHandler
  ) {}

  /**
   * Closes the current adapter client and resets connection initialization state.
   *
   * Close failures are logged and contained. Tool state, tool inventory,
   * outer initialization state, and cluster selections are retained.
   *
   * @returns No value after close is attempted.
   */
  private async closeAndReset(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error closing MCP client:', error);
      }
    }
    this.client = null;
    this.isClientInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Initializes tool-state storage and the underlying MCP client once.
   *
   * @returns No value after initialization completes.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    // Deduplicate concurrent initialize() calls so a single attempt is shared;
    // otherwise racing callers would each construct a ToolStateStore and start
    // a separate client initialization. A failed attempt is cleared so callers
    // may retry.
    if (this.initializePromise) {
      return this.initializePromise;
    }
    this.initializePromise = (async () => {
      this.mcpToolState = new ToolStateStore(new FileStorage(this.configPath));
      await this.initializeClient();
      this.initialized = true;

      if (DEBUG) {
        console.info('MCPClient: initialized');
      }
    })();
    try {
      await this.initializePromise;
    } catch (error) {
      this.initializePromise = null;
      throw error;
    }
  }

  /**
   * Initializes the underlying adapter client once or joins an in-progress attempt.
   *
   * @returns No value after the current initialization attempt settles.
   */
  private async initializeClient(): Promise<void> {
    if (DEBUG) {
      console.debug('MCPClient: initializeClient:', {
        isClientInitialized: this.isClientInitialized,
        initializationPromise: this.initializationPromise,
      });
    }

    if (this.isClientInitialized) {
      return;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (DEBUG) {
      console.debug('MCPClient: initializeClient: Starting doInitialize()...');
    }

    this.initializationPromise = this.doInitializeClient();
    return this.initializationPromise;
  }

  /**
   * Loads settings and creates the underlying multi-server client.
   *
   * Enabled server configuration receives the current cluster list. Discovered
   * tools use qualified names and a two-minute default invocation timeout. No
   * enabled servers is a successful initialized state without an adapter client;
   * that early path does not clear a previously discovered `clientTools` array.
   *
   * @returns No value after discovery and tool-state initialization.
   */
  private async doInitializeClient(): Promise<void> {
    try {
      const mcpSettings = this.settingsProvider.loadMCPSettings();
      const mcpServers = makeMcpServers(mcpSettings, this.clusters);

      if (Object.keys(mcpServers).length === 0) {
        if (DEBUG) {
          console.debug('MCPClient: doInitialize: No enabled MCP servers found');
        }
        this.isClientInitialized = true;
        return;
      }
      if (DEBUG) {
        console.debug(
          'MCPClient: doInitialize: Initializing with servers:',
          Object.keys(mcpServers)
        );
      }
      this.client = new MultiServerMCPClient({
        throwOnLoadError: false,
        prefixToolNameWithServerName: true,
        additionalToolNamePrefix: '',
        useStandardContentBlocks: true,
        mcpServers,
        defaultToolTimeout: 2 * 60 * 1000,
      });
      this.clientTools = await this.client.getTools();
      this.mcpToolState?.initConfigFromClientTools(this.clientTools);

      this.isClientInitialized = true;
      if (DEBUG) {
        console.debug(
          'MCPClient: doInitialize: initialized with',
          this.clientTools.length,
          'tools'
        );
      }
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      this.client = null;
      this.isClientInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Cleans up an initialized client.
   *
   * Connection state and tool inventory are cleared. The tool-state store and
   * cluster selections remain, and close failures do not reject cleanup.
   *
   * @returns No value.
   */
  async cleanup(): Promise<void> {
    const pendingInitialization = this.initializePromise;
    if (!this.initialized && !pendingInitialization) {
      return;
    }
    if (pendingInitialization) {
      try {
        await pendingInitialization;
      } catch {
        // Initialization already reset its state; cleanup still clears remnants.
      }
    }
    this.initialized = false;
    this.initializePromise = null;

    await this.closeAndReset();
    this.clientTools = [];

    if (DEBUG) {
      console.info('MCPClient: cleaned up');
    }
  }

  /**
   * Handles an ordered cluster-list change.
   *
   * Equal lists by JSON serialization are ignored. The current selection is
   * updated immediately; adapter clusters and connections restart only when
   * configured servers depend on cluster context. Restart failure restores only
   * `currentClusters`, not other connection state.
   *
   * @param newClusters - Ordered cluster names, or `null` for no selection.
   * @returns No value after any required restart.
   */
  async handleClustersChange(newClusters: string[] | null): Promise<void> {
    if (DEBUG) {
      console.info('MCPClient: clusters changed ->', newClusters);
    }

    if (!this.initialized) {
      throw new Error('MCPClient: not initialized');
    }

    if (JSON.stringify(this.currentClusters) === JSON.stringify(newClusters)) {
      return;
    }

    const oldClusters = this.currentClusters;
    this.currentClusters = newClusters;

    const mcpSettings = this.settingsProvider.loadMCPSettings();
    if (!hasClusterDependentServers(mcpSettings)) {
      if (DEBUG)
        console.debug('MCPClient: No cluster-dependent MCP servers found, skipping restart');
      return;
    }

    try {
      await this.closeAndReset();
      this.clusters = newClusters || [];
      await this.initializeClient();
      if (DEBUG) console.debug('MCPClient: restarted for new cluster:', newClusters);
    } catch (error) {
      console.error('MCPClient: Error restarting for cluster change:', error);
      this.currentClusters = oldClusters;
      throw error;
    }
  }

  /**
   * Executes a qualified MCP tool after enablement and schema validation.
   *
   * Successful execution records usage. Once tool state exists, execution,
   * validation, availability, and invocation failures are returned rather than thrown.
   *
   * @param toolName - Qualified `<server>__<tool>` name.
   * @param args - Arguments validated against persisted input schema.
   * @param toolCallId - Required correlation ID echoed in the result.
   * @returns Execution envelope, or `undefined` before tool-state storage exists.
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId: string
  ): Promise<
    | {
        /** Whether execution completed successfully. */
        success: boolean;
        /** Raw adapter result on success. */
        result?: unknown;
        /** Failure description on error. */
        error?: string;
        /** Caller-provided correlation ID. */
        toolCallId: string;
      }
    | undefined
  > {
    if (!this.mcpToolState) {
      return undefined;
    }
    try {
      await this.initializeClient();
      if (!this.client || this.clientTools.length === 0) {
        throw new Error('MCP client not initialized or no tools available');
      }
      const { serverName, toolName: actualToolName } = parseMCPToolName(toolName);

      const isEnabled = this.mcpToolState.isToolEnabled(serverName, actualToolName);
      if (!isEnabled) {
        throw new Error(`Tool ${actualToolName} from server ${serverName} is disabled`);
      }
      const tool = this.clientTools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      const toolStats = this.mcpToolState.getToolStats(serverName, actualToolName);
      const validation = validateToolArgs(toolStats?.inputSchema ?? null, args);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.error}`);
      }
      if (DEBUG) console.debug(`MCPClient: Executing tool: ${toolName}`);
      const result = await tool.invoke(args);
      if (DEBUG) console.debug(`MCPClient: tool ${toolName} executed successfully`);
      this.mcpToolState.recordToolUsage(serverName, actualToolName);
      return { success: true, result, toolCallId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolCallId,
      };
    }
  }

  /**
   * Gets adapter initialization and connection status.
   *
   * @returns Snapshot distinguishing completed initialization from an allocated client.
   */
  getStatus(): {
    /** Whether adapter initialization completed, including the no-server case. */
    isInitialized: boolean;
    /** Whether a multi-server adapter client currently exists. */
    hasClient: boolean;
  } {
    return {
      isInitialized: this.isClientInitialized,
      hasClient: this.client !== null,
    };
  }

  /**
   * Gets current MCP settings with a disabled empty default.
   *
   * Provider failures are returned with the same default configuration.
   *
   * @returns Settings envelope that always includes a configuration.
   */
  getConfig(): {
    /** Whether settings loaded successfully. */
    success: boolean;
    /** Loaded settings or the disabled empty default. */
    config: MCPSettings;
    /** Optional provider failure description. */
    error?: string;
  } {
    try {
      const currentSettings = this.settingsProvider.loadMCPSettings();
      return {
        success: true,
        config: currentSettings || { enabled: false, servers: [] },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        config: { enabled: false, servers: [] },
      };
    }
  }

  /**
   * Confirms, saves, and applies replacement MCP settings.
   *
   * Settings are saved before the connection restart and are not rolled back
   * if restart fails.
   *
   * @param mcpSettings - Complete replacement server settings.
   * @returns Success or cancellation/failure envelope.
   */
  async updateConfig(mcpSettings: MCPSettings): Promise<{
    /** Whether confirmation, persistence, and restart succeeded. */
    success: boolean;
    /** Optional cancellation or failure description. */
    error?: string;
  }> {
    try {
      const currentSettings = this.settingsProvider.loadMCPSettings();
      if (this.confirmationHandler) {
        const confirmed = await this.confirmationHandler.confirmSettingsChange(
          currentSettings,
          mcpSettings
        );
        if (!confirmed) {
          return { success: false, error: 'User cancelled the configuration update' };
        }
      }

      this.settingsProvider.saveMCPSettings(mcpSettings);

      await this.closeAndReset();
      await this.initializeClient();

      if (DEBUG) console.debug('MCPClient: configuration updated successfully');
      return { success: true };
    } catch (error) {
      console.error('MCPClient: Error updating configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Confirms and restarts connections using current settings.
   *
   * @returns Success or cancellation/failure envelope.
   */
  async resetClient(): Promise<{
    /** Whether confirmation and restart succeeded. */
    success: boolean;
    /** Optional cancellation or failure description. */
    error?: string;
  }> {
    try {
      if (this.confirmationHandler) {
        const confirmed = await this.confirmationHandler.confirmOperation(
          'MCP Client Reset',
          'The application wants to reset the MCP client. This will restart all MCP server connections.',
          'Reset MCP client'
        );
        if (!confirmed) {
          return { success: false, error: 'User cancelled the operation' };
        }
      }

      await this.closeAndReset();
      await this.initializeClient();

      return { success: true };
    } catch (error) {
      console.error('MCPClient: Error resetting client:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets persisted per-tool configuration.
   *
   * Before tool-state storage exists, a successful response may contain
   * `config: undefined`. Failures contain an empty configuration.
   *
   * @returns Tool-state envelope.
   */
  getToolsConfig(): {
    /** Whether the read completed without throwing. */
    success: boolean;
    /** Persisted tool state when storage exists. */
    config?: MCPToolsConfig;
    /** Optional read failure description. */
    error?: string;
  } {
    try {
      return { success: true, config: this.mcpToolState?.getConfig() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {},
      };
    }
  }

  /**
   * Confirms and replaces per-tool configuration without restarting connections.
   *
   * Optional chaining means the operation reports success without mutation when
   * tool-state storage has not been created.
   *
   * @param toolsConfig - Complete replacement tool state.
   * @returns Success or cancellation/failure envelope.
   */
  async updateToolsConfig(toolsConfig: MCPToolsConfig): Promise<{
    /** Whether confirmation and the optional update completed without throwing. */
    success: boolean;
    /** Optional cancellation or failure description. */
    error?: string;
  }> {
    try {
      const currentConfig = this.mcpToolState?.getConfig() || {};
      if (this.confirmationHandler) {
        const confirmed = await this.confirmationHandler.confirmToolsConfigChange(
          currentConfig,
          toolsConfig
        );
        if (!confirmed) {
          return { success: false, error: 'User cancelled the operation' };
        }
      }
      this.mcpToolState?.setConfig(toolsConfig);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sets one tool's enabled state without confirmation or connection restart.
   *
   * Optional chaining means this reports success without mutation before
   * tool-state storage exists.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @param enabled - New enabled state.
   * @returns Success or failure envelope.
   */
  setToolEnabled(
    serverName: string,
    toolName: string,
    enabled: boolean
  ): {
    /** Whether the optional update completed without throwing. */
    success: boolean;
    /** Optional failure description. */
    error?: string;
  } {
    try {
      this.mcpToolState?.setToolEnabled(serverName, toolName, enabled);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets persisted state for one tool.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @returns State envelope; successful pre-initialization reads have `stats: undefined`.
   */
  getToolStats(
    serverName: string,
    toolName: string
  ): {
    /** Whether the read completed without throwing. */
    success: boolean;
    /** Tool state, `null` when absent, or `undefined` before storage exists. */
    stats?: MCPToolState | null;
    /** Optional read failure description. */
    error?: string;
  } {
    try {
      return { success: true, stats: this.mcpToolState?.getToolStats(serverName, toolName) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: null,
      };
    }
  }

  /**
   * Handles a non-null single-cluster change.
   *
   * A `null` cluster returns success without calling `handleClustersChange`, so
   * it does not clear or restart the current cluster selection.
   *
   * @param cluster - New cluster name, or `null` for no operation.
   * @returns Success or failure envelope.
   */
  async clusterChange(cluster: string | null): Promise<{
    /** Whether the optional cluster update completed successfully. */
    success: boolean;
    /** Optional failure description. */
    error?: string;
  }> {
    try {
      if (cluster !== null) {
        await this.handleClustersChange([cluster]);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
