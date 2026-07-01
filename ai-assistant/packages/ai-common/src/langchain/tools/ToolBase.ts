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
import { Prompt } from '../../ai/manager';

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

/** Structured response returned after a tool executes. */
export interface ToolResponse {
  /** Tool output content returned to the caller. */
  content: string;
  /** Whether the response should be written into chat history. */
  shouldAddToHistory: boolean;
  /** Whether the assistant should generate a follow-up response from this result. */
  shouldProcessFollowUp: boolean;
  /** Optional metadata about the tool execution. */
  metadata?: Record<string, any>;
}

/** Function signature implemented by concrete tool handlers. */
export interface ToolHandler {
  (args: Record<string, any>, toolCallId?: string, pendingPrompt?: Prompt): Promise<ToolResponse>;
}

/** Base class for tools that can be exposed through LangChain. */
export abstract class ToolBase {
  /** Static metadata used to register the tool. */
  abstract readonly config: ToolConfig;
  /** Execution handler that performs the tool action. */
  abstract handler: ToolHandler;

  /** Creates the LangChain-compatible wrapper for this tool. */
  createLangChainTool() {
    return tool(
      async args => {
        try {
          const response = await this.handler(args as Record<string, any>);
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
