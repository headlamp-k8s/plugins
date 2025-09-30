import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Prompt } from '../../ai/manager';

export interface ToolConfig {
  name: string;
  shortDescription: string;
  description: string;
  schema: z.ZodSchema;
}

export interface ToolResponse {
  content: string;
  shouldAddToHistory: boolean;
  shouldProcessFollowUp: boolean;
  metadata?: Record<string, any>;
}

export interface ToolHandler {
  (args: Record<string, any>, toolCallId?: string, pendingPrompt?: Prompt): Promise<ToolResponse>;
}

export abstract class ToolBase {
  abstract readonly config: ToolConfig;
  abstract handler: ToolHandler;

  createLangChainTool() {
    return tool(
      async args => {
        try {
          const response = await this.handler(args);
          // Return just the content for LangChain, metadata is handled by ToolManager
          return response.content;
        } catch (error) {
          console.error(`Error in ${this.config.name} tool:`, error);
          return JSON.stringify({
            error: true,
            message: error.message,
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
