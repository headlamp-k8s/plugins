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

import type { ConversationMessage } from '../conversation/types';

/** Model-independent metadata for one available tool. */
export interface RuntimeToolInfo {
  /** Stable tool identifier used for lookup and execution. */
  name: string;
  /** Human-readable explanation of the tool's behavior. */
  description?: string;
}

/** Structured result returned after a tool executes. */
export interface ToolExecutionResult {
  /** Text content produced by the tool. */
  content: string;
  /** Whether the result should be appended to conversation history. */
  shouldAddToHistory: boolean;
  /** Whether the assistant should process the result in a follow-up turn. */
  shouldProcessFollowUp: boolean;
  /** Optional tool-specific result metadata. */
  metadata?: Record<string, unknown>;
  /** Error indicator or message supplied by the tool. */
  error?: boolean | string;
  /** Whether the result represents an error. */
  isError?: boolean;
  /** Human-readable result or error message. */
  message?: string;
  /** Optional structured result payload. */
  data?: unknown;
  /** Whether the tool operation completed successfully. */
  success?: boolean;
  /** Additional tool-specific result fields. */
  [key: string]: unknown;
}

/** Framework-neutral tool inventory, execution, and lifecycle contract. */
export interface ToolRuntime {
  /**
   * Lists the identifiers of all available tools.
   *
   * @returns Available tool identifiers.
   */
  getToolNames(): string[];

  /**
   * Lists metadata for available MCP tools.
   *
   * @returns Available MCP tool metadata.
   */
  getMCPTools(): RuntimeToolInfo[];

  /**
   * Waits until MCP tool discovery has completed.
   *
   * @returns A promise that resolves when MCP tools are ready.
   */
  waitForMCPToolsInitialization(): Promise<void>;

  /**
   * Applies Kubernetes context to tools that need cluster state.
   *
   * @param context - Kubernetes context supplied by the host.
   * @returns No value.
   */
  configureKubernetesContext(context: unknown): void;

  /**
   * Refreshes the available MCP tool inventory.
   *
   * @returns A promise that resolves after the inventory is refreshed.
   */
  refreshMCPTools(): Promise<void>;

  /**
   * Executes a tool with normalized arguments and optional request context.
   *
   * @param toolName - Identifier of the tool to execute.
   * @param args - Arguments supplied to the tool.
   * @param toolCallId - Optional model-generated tool-call identifier.
   * @param pendingPrompt - Optional conversation message awaiting the result.
   * @returns The structured tool execution result.
   */
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string,
    pendingPrompt?: ConversationMessage
  ): Promise<ToolExecutionResult>;
}
