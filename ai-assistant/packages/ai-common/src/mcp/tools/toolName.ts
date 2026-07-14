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
 * Splits a server-qualified MCP tool name into server and tool components.
 *
 * @param fullToolName - Qualified `server__tool` name or an unqualified tool name.
 * @returns Parsed server and tool names, using `default` for an unqualified name.
 */
export function parseMCPToolName(fullToolName: string): {
  /** MCP server qualifier extracted from the full name. */
  serverName: string;
  /** Tool name with any separators after the server qualifier preserved. */
  toolName: string;
} {
  const parts = fullToolName.split('__');
  if (parts.length >= 2) {
    return {
      serverName: parts[0],
      toolName: parts.slice(1).join('__'),
    };
  }
  return {
    serverName: 'default',
    toolName: fullToolName,
  };
}
