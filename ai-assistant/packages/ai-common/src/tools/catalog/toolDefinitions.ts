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

/** Describes a tool exposed to the assistant and settings UI. */
export interface ToolInfo {
  /** Stable identifier used to configure and invoke the tool. */
  id: string;
  /** Human-readable tool name shown in settings. */
  name: string;
  /** Summary of the operations the tool performs. */
  description: string;
  /** Catalog source that provides the tool. */
  source: 'built-in' | 'mcp';
}

const AVAILABLE_TOOLS: readonly ToolInfo[] = [
  {
    id: 'kubernetes_api_request',
    name: 'Kubernetes API Request',
    description:
      'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
    source: 'built-in',
  },
];

/**
 * Returns a copy of the built-in tool catalog.
 *
 * @returns A new array containing all built-in tool definitions.
 */
export function getAllAvailableTools(): ToolInfo[] {
  return [...AVAILABLE_TOOLS];
}

/**
 * Checks whether a tool identifier belongs to the built-in catalog.
 *
 * @param toolName - Tool identifier to check.
 * @returns Whether the catalog contains an exact identifier match.
 */
export function isBuiltInTool(toolName: string): boolean {
  return AVAILABLE_TOOLS.some(tool => tool.id === toolName);
}

/**
 * Determines whether a built-in tool call touches sensitive resources and must
 * not be silently auto-approved.
 *
 * Built-in tool calls are normally auto-approved for a smooth read experience,
 * but access to Kubernetes `Secret` objects can expose credential material to
 * the model provider, so those calls are routed through the human approval gate
 * as defense-in-depth (secret values are also redacted before reaching the LLM).
 *
 * @param toolName - Tool identifier being invoked.
 * @param args - Arguments the model supplied for the call.
 * @returns Whether the call should require explicit approval.
 */
export function isSensitiveBuiltInToolCall(toolName: string, args: unknown): boolean {
  if (toolName !== 'kubernetes_api_request') {
    return false;
  }
  const url = (args as { url?: unknown } | null | undefined)?.url;
  if (typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url, 'https://kubernetes.invalid');
    const segments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map(segment => decodeURIComponent(segment).toLowerCase());
    return segments.includes('secrets');
  } catch {
    return true;
  }
}
