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

/**
 * Describes the MCP bridge operations that ToolManager needs.
 *
 * Callers that run inside the Headlamp Electron app pass an ElectronMCPClient
 * instance. Callers that run in other environments (tests, non-Electron web)
 * pass a no-op implementation such as NullMCPClientAdapter.
 */
export interface MCPClientAdapter {
  /** Returns true when the MCP bridge is available in the current runtime. */
  isAvailable(): boolean;

  /** Reads the persisted MCP server configuration. */
  getConfig(): Promise<{ success: boolean; config?: any; error?: string }>;

  /** Reads per-tool MCP configuration including discovery metadata. */
  getToolsConfig(): Promise<{ success: boolean; config?: any; error?: string }>;

  /** Executes a named MCP tool with the given arguments. */
  executeTool(toolName: string, args: Record<string, any>, toolCallId?: string): Promise<any>;

  /** Returns whether a specific tool is currently enabled. */
  isToolEnabled(toolName: string): Promise<boolean>;

  /** Enables or disables a specific tool on its server. */
  setToolEnabled(serverName: string, toolName: string, enabled: boolean): Promise<boolean>;

  /** Retrieves usage statistics for a specific tool. */
  getToolStats(serverName: string, toolName: string): Promise<any | null>;

  /** Updates the persisted per-tool MCP configuration. */
  updateToolsConfig(config: any): Promise<boolean>;

  /**
   * Parses a server-qualified tool name (e.g. "myServer__myTool") into its
   * constituent server name and tool name parts.
   */
  parseToolName(fullToolName: string): { serverName: string; toolName: string };
}

/**
 * A no-op MCPClientAdapter used when no MCP bridge is present.
 * All operations return safe defaults that indicate unavailability.
 */
export class NullMCPClientAdapter implements MCPClientAdapter {
  isAvailable(): boolean {
    return false;
  }
  async getConfig() {
    return { success: false, error: 'MCP not available' };
  }
  async getToolsConfig() {
    return { success: false, error: 'MCP not available' };
  }
  async executeTool(): Promise<any> {
    return null;
  }
  async isToolEnabled(): Promise<boolean> {
    return false;
  }
  async setToolEnabled(): Promise<boolean> {
    return false;
  }
  async getToolStats(): Promise<null> {
    return null;
  }
  async updateToolsConfig(): Promise<boolean> {
    return false;
  }
  parseToolName(fullToolName: string): { serverName: string; toolName: string } {
    const parts = fullToolName.split('__');
    return parts.length >= 2
      ? { serverName: parts[0], toolName: parts.slice(1).join('__') }
      : { serverName: 'default', toolName: fullToolName };
  }
}
