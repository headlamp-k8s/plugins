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

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { ToolExecutionResult } from '../ToolRuntime';

/** Configuration used to register a tool with the AI tool system. */
export interface ToolConfig {
  /** Unique name used to identify and invoke the tool. */
  name: string;
  /** Short summary shown in compact tool listings. */
  shortDescription: string;
  /** Full description provided to the language model. */
  description: string;
  /** Zod schema describing the tool input arguments. */
  schema: z.ZodSchema;
}

/** Function signature implemented by concrete tool handlers. */
export interface ToolHandler {
  (
    args: Record<string, unknown>,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ): Promise<ToolExecutionResult>;
}

/** Base class for tools that can be exposed through LangChain. */
export abstract class LangChainTool {
  /** Static metadata used to register the tool. */
  abstract readonly config: ToolConfig;
  /** Execution handler that performs the tool action. */
  abstract handler: ToolHandler;

  /**
   * Creates the LangChain-compatible wrapper for this tool.
   *
   * @returns A callable LangChain tool configured with this tool's handler and schema.
   */
  createLangChainTool() {
    return tool(
      async args => {
        try {
          // toolCallId and pendingPrompt are not available inside the LangChain
          // tool callback — they are assigned by the LLM response and are only
          // accessible to ToolManager which processes the full AI message.
          // Handlers that require toolCallId (e.g. KubernetesTool) must be
          // invoked directly through ToolManager rather than via this wrapper.
          const response = await this.handler(
            args as Record<string, unknown>,
            undefined, // toolCallId — not available in LangChain tool callback
            undefined // pendingPrompt — not available in LangChain tool callback
          );
          // Return just the content for LangChain, metadata is handled by ToolManager
          return response.content;
        } catch (error: unknown) {
          console.error(`Error in ${this.config.name} tool:`, error);
          const message = error instanceof Error ? error.message : String(error);
          return JSON.stringify({
            error: true,
            message,
          });
        }
      },
      {
        name: this.config.name,
        description: this.config.description,
        schema: this.config.schema,
      }
    );
  }
}
