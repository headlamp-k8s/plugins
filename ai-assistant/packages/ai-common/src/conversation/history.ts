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

import { getStoredToolCalls } from './toolCalls';
import type { ConversationMessage } from './types';

/**
 * Checks whether history contains an actionable tool response.
 *
 * @param history - Conversation messages to search.
 * @returns Whether a non-display tool message has a tool-call identifier.
 */
export function hasToolResponses(history: ConversationMessage[]): boolean {
  return history.some(message =>
    Boolean(message.role === 'tool' && message.toolCallId && !message.isDisplayOnly)
  );
}

/**
 * Returns the most recent assistant message or a fallback placeholder.
 *
 * @param history - Conversation messages to search from newest to oldest.
 * @returns The latest assistant message or a generated no-response placeholder.
 */
export function getLastAssistantMessage(history: ConversationMessage[]): ConversationMessage {
  return (
    history
      .slice()
      .reverse()
      .find(message => message.role === 'assistant') ?? {
      role: 'assistant',
      content: 'No tool responses to process.',
    }
  );
}

/** Result of comparing expected tool calls with stored tool responses. */
export interface AlignmentResult {
  /** Whether every expected tool-call identifier has a response. */
  aligned: boolean;
  /** Tool-call identifiers requested by the latest applicable assistant message. */
  expectedIds: string[];
  /** Matching tool-response identifiers found anywhere in history. */
  actualIds: string[];
  /** Expected identifiers that do not have matching responses. */
  missingIds: string[];
}

/**
 * Checks that the latest assistant tool calls have matching responses.
 *
 * @param history - Conversation history containing assistant calls and tool responses.
 * @returns Expected, actual, and missing identifiers with overall alignment state.
 */
export function validateToolCallAlignment(history: ConversationMessage[]): AlignmentResult {
  const lastWithTools = history
    .slice()
    .reverse()
    .find(message => message.role === 'assistant' && message.toolCalls?.length);
  if (!lastWithTools) {
    return { aligned: true, expectedIds: [], actualIds: [], missingIds: [] };
  }

  const expectedIds = getStoredToolCalls(lastWithTools).map(toolCall => toolCall.id);
  const actualIds = history
    .filter(message => message.role === 'tool' && expectedIds.includes(message.toolCallId!))
    .map(message => message.toolCallId!);
  const missingIds = expectedIds.filter(id => !actualIds.includes(id));
  return { aligned: missingIds.length === 0, expectedIds, actualIds, missingIds };
}

/**
 * Removes unmatched tool-call metadata and orphan tool responses.
 *
 * @param messages - Conversation messages to repair without mutating the input array.
 * @returns A new message array containing only aligned calls and responses.
 */
export function sanitizeToolAlignment(messages: ConversationMessage[]): ConversationMessage[] {
  const result: ConversationMessage[] = [];

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (message.role === 'assistant' && getStoredToolCalls(message).length > 0) {
      const responseIds = new Set<string>();
      let responseIndex = index + 1;
      while (responseIndex < messages.length && messages[responseIndex].role === 'tool') {
        const id = messages[responseIndex].toolCallId;
        if (id) responseIds.add(id);
        responseIndex++;
      }
      const matchedCalls = getStoredToolCalls(message).filter(call => responseIds.has(call.id));
      result.push({
        ...message,
        toolCalls: matchedCalls.length > 0 ? matchedCalls : undefined,
      });
    } else if (message.role === 'tool') {
      const lastAssistant = [...result].reverse().find(item => item.role === 'assistant');
      const assistantIds = new Set(getStoredToolCalls(lastAssistant).map(call => call.id));
      if (message.toolCallId && assistantIds.has(message.toolCallId)) result.push(message);
    } else {
      result.push(message);
    }
  }

  return result;
}

/**
 * Finds the last assistant message containing valid stored tool calls.
 *
 * @param history - Conversation messages to search from newest to oldest.
 * @returns The message index, or `-1` when no assistant tool calls exist.
 */
export function findLastAssistantWithTools(history: ConversationMessage[]): number {
  for (let index = history.length - 1; index >= 0; index--) {
    const message = history[index];
    if (message.role === 'assistant' && getStoredToolCalls(message).length > 0) return index;
  }
  return -1;
}
