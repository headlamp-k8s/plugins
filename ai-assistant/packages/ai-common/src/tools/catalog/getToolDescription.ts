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
 * Maps tool names to human-readable descriptions shown in the approval dialog.
 *
 * MCP names use ordered, case-sensitive keyword matching; other names receive
 * Kubernetes-oriented fallback descriptions.
 */

/**
 * Returns a short, human-readable description for a tool.
 *
 * For MCP tools the description is inferred from keyword patterns in the tool
 * name (e.g. "trace" → tracing description). For built-in Kubernetes tools a
 * generic description is returned.
 *
 * @param toolName  - The full tool identifier (e.g. `"gadget__trace_open"`).
 * @param isMCPTool - Whether the tool comes from an MCP server.
 * @returns A keyword-specific description or a generic description containing the tool name.
 */
export function getToolDescription(toolName: string, isMCPTool: boolean): string {
  if (isMCPTool) {
    // Check exec/run before trace so 'exec_tracer' gets the exec description
    if (toolName.includes('exec') || toolName.includes('run')) {
      return 'Executes commands in containers';
    }
    if (toolName.includes('trace') || toolName.includes('profile')) {
      return 'Traces system calls and processes for debugging';
    }
    if (toolName.includes('network') || toolName.includes('socket')) {
      return 'Monitors network connections and traffic';
    }
    if (toolName.includes('top') || toolName.includes('process')) {
      return 'Shows running processes and resource usage';
    }
    return `Inspektor Gadget debugging tool: ${toolName}`;
  }

  if (toolName.includes('kubernetes')) {
    return 'Executes Kubernetes API operations';
  }
  return `Kubernetes management tool: ${toolName}`;
}
