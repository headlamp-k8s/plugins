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
  name: string;
  description?: string;
}

/** Structured result returned after a tool executes. */
export interface ToolExecutionResult {
  content: string;
  shouldAddToHistory: boolean;
  shouldProcessFollowUp: boolean;
  metadata?: Record<string, unknown>;
  error?: boolean | string;
  isError?: boolean;
  message?: string;
  data?: unknown;
  success?: boolean;
  [key: string]: unknown;
}

/** Framework-neutral tool inventory, execution, and lifecycle contract. */
export interface ToolRuntime {
  getToolNames(): string[];
  getMCPTools(): RuntimeToolInfo[];
  waitForMCPToolsInitialization(): Promise<void>;
  configureKubernetesContext(context: unknown): void;
  refreshMCPTools(): Promise<void>;
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
    toolCallId?: string,
    pendingPrompt?: ConversationMessage
  ): Promise<ToolExecutionResult>;
}
