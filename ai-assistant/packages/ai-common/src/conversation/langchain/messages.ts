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

import {
  AIMessage,
  type BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { getStoredToolCalls, hasFunctionPayload } from '../toolCalls';
import type { ConversationMessage } from '../types';

/**
 * Converts conversation messages into LangChain message instances.
 *
 * @param messages - Canonical conversation messages to convert in order.
 * @returns LangChain message instances in the same order as the input.
 */
export function convertPromptsToMessages(messages: ConversationMessage[]): BaseMessage[] {
  return messages.map(message => {
    switch (message.role) {
      case 'system':
        return new SystemMessage(message.content);
      case 'user':
        return new HumanMessage(message.content);
      case 'assistant': {
        const toolCalls = getStoredToolCalls(message)
          .filter(hasFunctionPayload)
          .map(call => {
            let args: Record<string, unknown> = {};
            try {
              args =
                typeof call.function.arguments === 'string'
                  ? JSON.parse(call.function.arguments)
                  : call.function.arguments ?? {};
            } catch {
              // Keep malformed model arguments from aborting message conversion.
              // Surface the failure so lost tool arguments are diagnosable rather
              // than silently degraded to an empty object.
              console.warn(
                `Failed to parse tool call arguments for "${call.function.name}" (id: ${call.id}); using empty arguments.`
              );
            }
            return { id: call.id, name: call.function.name, args, type: 'tool_call' as const };
          });
        return new AIMessage({
          content: message.content,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          additional_kwargs: {},
        });
      }
      case 'tool':
        return new ToolMessage({
          content: message.content,
          tool_call_id: message.toolCallId ?? '',
        });
      default:
        return new ChatMessage(message.content, message.role);
    }
  });
}
