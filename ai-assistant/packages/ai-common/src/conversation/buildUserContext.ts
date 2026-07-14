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

import type { ConversationMessage as Prompt } from '../conversation/types';
import type { UserContext } from '../mcp/tools/types';

/**
 * Derives a `UserContext` object from a conversation history array.
 *
 * The snapshot contains the latest user message, the last ten conversation
 * messages, and the last five tool results. Tool results use the call ID when
 * available and otherwise the tool name; JSON parsing failures preserve text.
 *
 * @param history - Conversation messages used to derive recent user and tool context.
 * @returns Request context containing recent messages, tool results, and the current time.
 */
export function buildUserContext(history: Prompt[]): UserContext {
  const recentUserMessages = history.filter(p => p.role === 'user').slice(-3);

  const userMessage =
    recentUserMessages.length > 0 ? recentUserMessages[recentUserMessages.length - 1].content : '';

  const conversationHistory = history.slice(-10).map(p => ({
    role: p.role,
    content: p.content,
  }));

  const lastToolResults: Record<string, unknown> = {};
  history
    .filter(p => p.role === 'tool')
    .slice(-5)
    .forEach(p => {
      const key = p.toolCallId ?? p.name;
      if (key) {
        try {
          lastToolResults[key] = JSON.parse(p.content);
        } catch {
          lastToolResults[key] = p.content;
        }
      }
    });

  return {
    userMessage,
    conversationHistory,
    lastToolResults,
    timeContext: new Date(),
  };
}
