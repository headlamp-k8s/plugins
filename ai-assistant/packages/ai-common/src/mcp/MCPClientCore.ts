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
  parseServerNameToolName,
  validateToolArgs,
} from './mcpServerConfig';
import { MCPToolStateStore } from './MCPToolStateStore';
import type { MCPSettings, MCPToolsConfig } from './types';

/**
 * Provides MCP settings (load/save) — implemented by consumers
 * (e.g. Electron settings file, in-memory store for tests).
 */
export interface MCPSettingsProvider {
  /** Loads the currently persisted MCP settings. */
  loadMCPSettings(): MCPSettings | null;
  /** Persists MCP settings after a confirmed update. */
  saveMCPSettings(settings: MCPSettings): void;
}

/**
 * Handles user confirmation for sensitive MCP operations.
 * Consumers supply platform-specific implementations
 * (e.g. Electron dialog boxes, CLI prompts, auto-approve for tests).
 */
export interface MCPConfirmationHandler {
  /** Confirms a pending MCP settings change with the user. */
  confirmSettingsChange(
    currentSettings: MCPSettings | null,
    nextSettings: MCPSettings
  ): Promise<boolean>;
  /** Confirms a pending MCP tools configuration change. */
  confirmToolsConfigChange(
    currentConfig: MCPToolsConfig,
    nextConfig: MCPToolsConfig
  ): Promise<boolean>;
  /** Confirms a generic sensitive MCP operation. */
  confirmOperation(title: string, message: string, operation: string): Promise<boolean>;
}

const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * MCPClientCore — platform-agnostic MCP client logic.
 *
 * Manages the lifecycle of a MultiServerMCPClient (from @langchain/mcp-adapters),
 * tool execution, tool state, cluster-change handling, and settings/config
 * operations.  All platform-specific concerns (Electron IPC, dialog boxes,
 * file I/O) are abstracted behind the MCPSettingsProvider and
 * MCPConfirmationHandler interfaces injected at construction time.
 *
 * Example:
 * ```ts
 *   const core = new MCPClientCore(configPath, settingsProvider, confirmationHandler);
 *   await core.initialize();
 *   await core.handleClustersChange(['cluster-1']);
 *   const result = await core.executeTool('server.tool', [{ arg: 1 }], 'call-1');
 *   await core.cleanup();
 * ```
 */
export class MCPClientCore {
  private mcpToolState: MCPToolStateStore | null = null;
  private clientTools: DynamicStructuredTool[] = [];
  private client: MultiServerMCPClient | null = null;
  private isClientInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private clusters: string[] = [];
  private currentClusters: string[] | null = null;
  private initialized = false;

  /**
   * Creates a platform-agnostic MCP client core.
   */
  constructor(
    private readonly configPath: string,
    private readonly settingsProvider: MCPSettingsProvider,
    private readonly confirmationHandler?: MCPConfirmationHandler
  ) {}

  /**
   * Close the current client and reset initialization state.
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
   * Initialize the MCP client.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.mcpToolState = new MCPToolStateStore(this.configPath);
    await this.initializeClient();
    this.initialized = true;

    if (DEBUG) {
      console.info('MCPClientCore: initialized');
    }
  }

  /**
   * Initialize the underlying MultiServerMCPClient if not already initialized.
   */
  private async initializeClient(): Promise<void> {
    if (DEBUG) {
      console.log('MCPClientCore: initializeClient:', {
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
      console.log('MCPClientCore: initializeClient: Starting doInitialize()...');
    }

    this.initializationPromise = this.doInitializeClient();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization of the MultiServerMCPClient.
   */
  private async doInitializeClient(): Promise<void> {
    try {
      const mcpSettings = this.settingsProvider.loadMCPSettings();
      const mcpServers = makeMcpServers(mcpSettings, this.clusters);

      if (Object.keys(mcpServers).length === 0) {
        if (DEBUG) {
          console.log('MCPClientCore: doInitialize: No enabled MCP servers found');
        }
        this.isClientInitialized = true;
        return;
      }
      if (DEBUG) {
        console.log(
          'MCPClientCore: doInitialize: Initializing with servers:',
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
        console.log(
          'MCPClientCore: doInitialize: initialized with',
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
   * Clean up resources.
   */
  async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    this.initialized = false;

    await this.closeAndReset();
    this.clientTools = [];

    if (DEBUG) {
      console.info('MCPClientCore: cleaned up');
    }
  }

  /**
   * Handle cluster change — restarts the client when cluster-dependent servers exist.
   */
  async handleClustersChange(newClusters: string[] | null): Promise<void> {
    if (DEBUG) {
      console.info('MCPClientCore: clusters changed ->', newClusters);
    }

    if (!this.initialized) {
      throw new Error('MCPClientCore: not initialized');
    }

    if (JSON.stringify(this.currentClusters) === JSON.stringify(newClusters)) {
      return;
    }

    const oldClusters = this.currentClusters;
    this.currentClusters = newClusters;

    const mcpSettings = this.settingsProvider.loadMCPSettings();
    if (!hasClusterDependentServers(mcpSettings)) {
      console.log('No cluster-dependent MCP servers found, skipping restart');
      return;
    }

    try {
      await this.closeAndReset();
      this.clusters = newClusters || [];
      await this.initializeClient();
      console.log('MCP client restarted for new cluster:', newClusters);
    } catch (error) {
      console.error('Error restarting MCP client for cluster change:', error);
      this.currentClusters = oldClusters;
      throw error;
    }
  }

  /**
   * Execute an MCP tool.
   */
  async executeTool(
    toolName: string,
    args: any[],
    toolCallId: string
  ): Promise<{ success: boolean; result?: any; error?: string; toolCallId: string } | undefined> {
    if (!this.mcpToolState) {
      return undefined;
    }
    try {
      await this.initializeClient();
      if (!this.client || this.clientTools.length === 0) {
        throw new Error('MCP client not initialized or no tools available');
      }
      const { serverName, toolName: actualToolName } = parseServerNameToolName(toolName);

      const isEnabled = this.mcpToolState.isToolEnabled(serverName, actualToolName);
      if (!isEnabled) {
        throw new Error(`Tool ${actualToolName} from server ${serverName} is disabled`);
      }
      const tool = this.clientTools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      const validation = validateToolArgs(tool.schema, args);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.error}`);
      }
      console.log(`Executing MCP tool: ${toolName} with args:`, args);
      const result = await tool.invoke(args);
      console.log(`MCP tool ${toolName} executed successfully`);
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
   * Get current status.
   */
  getStatus(): { isInitialized: boolean; hasClient: boolean } {
    return {
      isInitialized: this.isClientInitialized,
      hasClient: this.client !== null,
    };
  }

  /**
   * Get current MCP settings.
   */
  getConfig(): { success: boolean; config: MCPSettings; error?: string } {
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
   * Update MCP settings — confirms with the handler then saves and restarts.
   */
  async updateConfig(mcpSettings: MCPSettings): Promise<{ success: boolean; error?: string }> {
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

      console.log('MCP configuration updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating MCP configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reset and reinitialize the client — confirms with the handler first.
   */
  async resetClient(): Promise<{ success: boolean; error?: string }> {
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
      console.error('Error resetting MCP client:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the tools configuration.
   */
  getToolsConfig(): { success: boolean; config?: MCPToolsConfig; error?: string } {
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
   * Update tools configuration — confirms with the handler first.
   */
  async updateToolsConfig(
    toolsConfig: MCPToolsConfig
  ): Promise<{ success: boolean; error?: string }> {
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
   * Enable or disable a specific tool.
   */
  setToolEnabled(
    serverName: string,
    toolName: string,
    enabled: boolean
  ): { success: boolean; error?: string } {
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
   * Get stats for a specific tool.
   */
  getToolStats(
    serverName: string,
    toolName: string
  ): { success: boolean; stats?: any; error?: string } {
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
   * Handle a single cluster change event.
   */
  async clusterChange(cluster: string | null): Promise<{ success: boolean; error?: string }> {
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
