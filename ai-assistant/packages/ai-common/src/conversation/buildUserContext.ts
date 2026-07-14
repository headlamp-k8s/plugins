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
 * Extracted from `LangChainManager.buildUserContext()` so it can be
 * unit-tested without instantiating a full manager.
 *
 * **Bugs found during extraction:**
 *
 * 1. `lastToolResults` is keyed by `response.name`, which is the raw tool
 *    function name.  When two different tool calls share the same name (e.g.
 *    two `kubernetes_api_request` calls), the second result silently
 *    overwrites the first.
 *
 * 2. The most-recent user message is taken from the last entry of the slice
 *    `history.filter(user).slice(-3)`, which is equivalent to just the most
 *    recent user message — the 3-message limit has no effect on the result,
 *    only on memory allocated for the intermediate array.
 */
export function buildUserContext(history: Prompt[]): UserContext {
  const recentUserMessages = history.filter(p => p.role === 'user').slice(-3);

  const userMessage =
    recentUserMessages.length > 0 ? recentUserMessages[recentUserMessages.length - 1].content : '';

  const conversationHistory = history.slice(-10).map(p => ({
    role: p.role,
    content: p.content,
  }));

  // Bug fix: key by toolCallId so multiple calls with the same tool name
  // are all preserved rather than the later one overwriting the earlier.
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
