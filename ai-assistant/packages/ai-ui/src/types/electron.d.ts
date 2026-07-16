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

// Type definitions for the Electron desktop API exposed to the renderer process

import type { MCPSettings, MCPToolsConfig, MCPToolState } from '@headlamp-k8s/ai-common/mcp/types';

/** Metadata for an MCP tool returned through the Electron bridge. */
interface MCPTool {
  /** Fully qualified tool name. */
  name: string;
  /** Optional human-readable tool description. */
  description?: string;
  /** JSON schema describing accepted input arguments. */
  inputSchema?: Record<string, unknown> | null;
}

/** Standard result envelope for Electron MCP operations. */
interface MCPResponse {
  /** Whether the operation completed successfully. */
  success: boolean;
  /** Tools returned by a discovery operation. */
  tools?: MCPTool[];
  /** Raw tool execution result. */
  result?: unknown;
  /** Failure description when the operation is unsuccessful. */
  error?: string;
  /** Optional tool-call correlation identifier. */
  toolCallId?: string;
}

/** MCP operations exposed by the Electron preload bridge. */
interface ElectronMCPApi {
  /** @returns Available MCP tools or an error envelope when supported by the host. */
  getTools?: () => Promise<MCPResponse>;
  /**
   * Executes one MCP tool.
   *
   * @param toolName - Qualified tool name.
   * @param args - Arguments supplied to the tool.
   * @param toolCallId - Optional correlation identifier.
   * @returns Tool result or an error envelope.
   */
  executeTool: (
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string
  ) => Promise<MCPResponse>;
  /** @returns Electron-side MCP initialization and client status. */
  getStatus: () => Promise<{ isInitialized: boolean; hasClient: boolean }>;
  /** @returns Result of resetting the Electron-side MCP client. */
  resetClient: () => Promise<MCPResponse>;
  /** @returns Persisted MCP server configuration or an error. */
  getConfig: () => Promise<{ success: boolean; config?: MCPSettings; error?: string }>;
  /**
   * Replaces persisted MCP server configuration.
   *
   * @param config - MCP settings to persist.
   * @returns Update result envelope.
   */
  updateConfig: (config: MCPSettings) => Promise<MCPResponse>;
  /** @returns Persisted per-tool configuration or an error. */
  getToolsConfig: () => Promise<{ success: boolean; config?: MCPToolsConfig; error?: string }>;
  /**
   * Replaces persisted per-tool configuration.
   *
   * @param config - Tool state grouped by server and tool name.
   * @returns Update result envelope.
   */
  updateToolsConfig: (config: MCPToolsConfig) => Promise<MCPResponse>;
  /**
   * Changes one tool's enabled state.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @param enabled - New enabled state.
   * @returns Update result envelope.
   */
  setToolEnabled: (serverName: string, toolName: string, enabled: boolean) => Promise<MCPResponse>;
  /**
   * Reads persisted state for one tool.
   *
   * @param serverName - MCP server name.
   * @param toolName - Bare tool name within the server.
   * @returns Tool state or an error envelope.
   */
  getToolStats: (
    serverName: string,
    toolName: string
  ) => Promise<{ success: boolean; stats?: MCPToolState | null; error?: string }>;
  /**
   * Notifies the Electron MCP client that the active cluster changed.
   *
   * @param cluster - New cluster identifier, or `null` when no cluster is active.
   * @returns Cluster-change result envelope.
   */
  clusterChange?: (cluster: string | null) => Promise<MCPResponse>;
}

/** Non-MCP Electron operations and the MCP bridge exposed to the renderer. */
interface DesktopApi {
  /**
   * Sends data on an Electron IPC channel.
   *
   * @param channel - IPC channel name.
   * @param data - Payload to send.
   * @returns No value.
   */
  send: (channel: string, data: unknown) => void;
  /**
   * Registers an Electron IPC listener.
   *
   * @param channel - IPC channel name.
   * @param func - Listener invoked with channel arguments.
   * @returns Function that removes the listener, or `undefined` for rejected channels.
   */
  receive: (channel: string, func: (...args: unknown[]) => void) => (() => void) | undefined;
  /**
   * Removes an Electron IPC listener.
   *
   * @param channel - IPC channel name.
   * @param func - Previously registered listener.
   * @returns No value.
   */
  removeListener: (channel: string, func: (...args: unknown[]) => void) => void;
  /** MCP operations exposed to renderer code. */
  mcp: ElectronMCPApi;
  /**
   * Notifies the host process that the active cluster changed.
   *
   * @param cluster - New cluster identifier, or `null` when no cluster is active.
   * @returns No value.
   */
  notifyClusterChange?: (cluster: string | null) => void;
}

declare global {
  /** Browser window with an optional Electron preload bridge. */
  interface Window {
    /** Electron APIs when running in the desktop renderer. */
    desktopApi?: DesktopApi;
  }
}

export { MCPTool, MCPResponse, ElectronMCPApi, DesktopApi };
