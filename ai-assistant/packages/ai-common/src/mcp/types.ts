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
 * MCP types shared by the AI assistant and Electron integrations.
 */

/**
 * Describes a single MCP server process.
 */
export interface MCPServer {
  /** Unique server name used in tool prefixes and settings. */
  name: string;
  /** Executable or command used to start the server. */
  command: string;
  /** Arguments passed to the MCP server command. */
  args: string[];
  /** Whether this server should be started by the client. */
  enabled: boolean;
  /** Whether tools from this server may run without prompting. */
  autoApprove?: boolean;
  /** Optional environment variables added to the server process. */
  env?: Record<string, string>;
}
