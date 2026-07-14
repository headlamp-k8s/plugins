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
  isAvailable(): boolean;
  getConfig(): Promise<{ success: boolean; config?: MCPSettings; error?: string }>;
  getToolsConfig(): Promise<{ success: boolean; config?: MCPToolsConfig; error?: string }>;
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string
  ): Promise<unknown>;
  isToolEnabled(toolName: string): Promise<boolean>;
  setToolEnabled(serverName: string, toolName: string, enabled: boolean): Promise<boolean>;
  getToolStats(serverName: string, toolName: string): Promise<MCPToolState | null>;
  updateToolsConfig(config: MCPToolsConfig): Promise<boolean>;
  parseToolName(fullToolName: string): { serverName: string; toolName: string };
}

/** No-op client used when an MCP bridge is unavailable. */
export class NullToolClient implements ToolClient {
  isAvailable(): boolean {
    return false;
  }

  async getConfig() {
    return { success: false, error: 'MCP not available' };
  }

  async getToolsConfig() {
    return { success: false, error: 'MCP not available' };
  }

  async executeTool(): Promise<null> {
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
