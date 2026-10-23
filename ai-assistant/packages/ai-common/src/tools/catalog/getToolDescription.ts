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
 * When a `catalogDescription` is provided (sourced from the MCP server's own
 * tool manifest) it is returned immediately for MCP tools. This ensures that
 * non-Gadget MCP servers such as Flux or Prometheus display accurate text in
 * the approval dialog rather than Inspektor-Gadget-specific heuristic text.
 *
 * When no catalog description is available the function falls back to keyword
 * heuristics that work well for Inspektor Gadget tool names.
 *
 * @param toolName          - The full tool identifier (e.g. `"gadget__trace_open"`).
 * @param isMCPTool         - Whether the tool comes from an MCP server.
 * @param catalogDescription - Optional description from the MCP server manifest.
 * @returns The catalog description, a keyword-specific description, or a generic fallback.
 */
export function getToolDescription(
  toolName: string,
  isMCPTool: boolean,
  catalogDescription?: string
): string {
  if (isMCPTool) {
    // Prefer the description provided by the MCP server's own manifest.
    if (catalogDescription) {
      return catalogDescription;
    }

    // Keyword heuristics — useful when the catalog description is absent.
    // Check exec/run before trace so 'exec_tracer' gets the exec description.
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
    return `MCP tool: ${toolName}`;
  }

  if (toolName.includes('kubernetes')) {
    return 'Executes Kubernetes API operations';
  }
  return `Kubernetes management tool: ${toolName}`;
}
