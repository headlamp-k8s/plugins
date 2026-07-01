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

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface MCPResponse {
  success: boolean;
  tools?: MCPTool[];
  result?: any;
  error?: string;
  toolCallId?: string;
}

interface ElectronMCPApi {
  getTools: () => Promise<MCPResponse>;
  executeTool: (
    toolName: string,
    args: Record<string, any>,
    toolCallId?: string
  ) => Promise<MCPResponse>;
  getStatus: () => Promise<{ isInitialized: boolean; hasClient: boolean }>;
  resetClient: () => Promise<MCPResponse>;
  getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateConfig: (config: any) => Promise<MCPResponse>;
  getToolsConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateToolsConfig: (config: any) => Promise<MCPResponse>;
  setToolEnabled: (serverName: string, toolName: string, enabled: boolean) => Promise<MCPResponse>;
  getToolStats: (
    serverName: string,
    toolName: string
  ) => Promise<{ success: boolean; stats?: any; error?: string }>;
}

interface DesktopApi {
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, func: (...args: unknown[]) => void) => void;
  mcp: ElectronMCPApi;
}

declare global {
  interface Window {
    desktopApi?: DesktopApi;
  }
}

export { MCPTool, MCPResponse, ElectronMCPApi, DesktopApi };
