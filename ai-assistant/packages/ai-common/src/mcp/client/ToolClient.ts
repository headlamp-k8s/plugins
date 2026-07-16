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

import type { MCPSettings, MCPToolsConfig, MCPToolState } from '../types';

/** MCP bridge operations required by the tool runtime. */
export interface ToolClient {
  /**
   * Reports whether the host MCP bridge can be used.
   *
   * @returns Whether bridge operations are available.
   */
  isAvailable(): boolean;
  /**
   * Reads MCP server settings.
   *
   * @returns Success envelope containing settings or an error description.
   */
  getConfig(): Promise<{
    /** Whether settings were read successfully. */
    success: boolean;
    /** MCP settings when provided by the bridge. */
    config?: MCPSettings;
    /** Optional failure description. */
    error?: string;
  }>;
  /**
   * Reads persisted per-server tool state.
   *
   * @returns Success envelope containing tool state or an error description.
   */
  getToolsConfig(): Promise<{
    /** Whether tool state was read successfully. */
    success: boolean;
    /** Tool state grouped by server and bare tool name. */
    config?: MCPToolsConfig;
    /** Optional failure description. */
    error?: string;
  }>;
  /**
   * Executes one qualified MCP tool.
   *
   * @param toolName - Qualified `<server>__<tool>` name.
   * @param args - Arguments supplied to the MCP tool.
   * @param toolCallId - Optional caller correlation identifier.
   * @returns Bridge-specific tool result.
   */
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string
  ): Promise<unknown>;
  /**
   * Checks the enabled state of a qualified tool name.
   *
   * @param toolName - Qualified `<server>__<tool>` name.
   * @returns Whether the tool is enabled.
   */
  isToolEnabled(toolName: string): Promise<boolean>;
  /**
   * Sets persisted enabled state using split name components.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @param enabled - New enabled state.
   * @returns Whether the update succeeded.
   */
  setToolEnabled(serverName: string, toolName: string, enabled: boolean): Promise<boolean>;
  /**
   * Reads persisted state for one tool.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @returns Tool state, or `null` when unavailable.
   */
  getToolStats(serverName: string, toolName: string): Promise<MCPToolState | null>;
  /**
   * Replaces persisted per-server tool state.
   *
   * @param config - Tool state grouped by server and bare tool name.
   * @returns Whether the update succeeded.
   */
  updateToolsConfig(config: MCPToolsConfig): Promise<boolean>;
  /**
   * Splits a qualified name into server and bare tool components.
   *
   * @param fullToolName - Name containing an optional `__` separator.
   * @returns First component as server and remaining components as tool; unqualified names use server `default`.
   */
  parseToolName(fullToolName: string): {
    /** Parsed server name. */
    serverName: string;
    /** Parsed bare tool name. */
    toolName: string;
  };
}

/** No-op client used when an MCP bridge is unavailable. */
export class NullToolClient implements ToolClient {
  /**
   * Reports that no MCP bridge is available.
   *
   * @returns Always `false`.
   */
  isAvailable(): boolean {
    return false;
  }

  /**
   * Returns a failed server-settings envelope.
   *
   * @returns Failure indicating MCP is unavailable.
   */
  async getConfig() {
    return { success: false, error: 'MCP not available' };
  }

  /**
   * Returns a failed tool-state envelope.
   *
   * @returns Failure indicating MCP is unavailable.
   */
  async getToolsConfig() {
    return { success: false, error: 'MCP not available' };
  }

  /**
   * Executes no tool.
   *
   * @returns Always `null`.
   */
  async executeTool(): Promise<null> {
    return null;
  }

  /**
   * Reports no tool as enabled.
   *
   * @returns Always `false`.
   */
  async isToolEnabled(): Promise<boolean> {
    return false;
  }

  /**
   * Persists no enabled state.
   *
   * @returns Always `false`.
   */
  async setToolEnabled(): Promise<boolean> {
    return false;
  }

  /**
   * Returns no tool state.
   *
   * @returns Always `null`.
   */
  async getToolStats(): Promise<null> {
    return null;
  }

  /**
   * Persists no tool configuration.
   *
   * @returns Always `false`.
   */
  async updateToolsConfig(): Promise<boolean> {
    return false;
  }

  /**
   * Splits a qualified name without requiring an available bridge.
   *
   * @param fullToolName - Name containing an optional `__` separator.
   * @returns First component as server and remaining components as tool; unqualified names use server `default`.
   */
  parseToolName(fullToolName: string): {
    /** Parsed server name. */
    serverName: string;
    /** Parsed bare tool name. */
    toolName: string;
  } {
    const parts = fullToolName.split('__');
    return parts.length >= 2
      ? { serverName: parts[0], toolName: parts.slice(1).join('__') }
      : { serverName: 'default', toolName: fullToolName };
  }
}
