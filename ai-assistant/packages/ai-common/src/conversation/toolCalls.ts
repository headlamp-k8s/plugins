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

import type { ConversationMessage } from './types';

/** Tool call persisted on assistant messages for result alignment. */
export interface StoredToolCall {
  id: string;
  function?: {
    name: string;
    arguments?: unknown;
  };
}

/** Returns persisted tool calls with valid identifiers. */
export function getStoredToolCalls(message: ConversationMessage | undefined): StoredToolCall[] {
  if (!message?.toolCalls) return [];
  return message.toolCalls.filter((toolCall): toolCall is StoredToolCall => {
    if (typeof toolCall !== 'object' || toolCall === null) return false;
    return 'id' in toolCall && typeof toolCall.id === 'string';
  });
}

/** Returns whether a stored call has a model function payload. */
export function hasFunctionPayload(
  toolCall: StoredToolCall
): toolCall is StoredToolCall & { function: NonNullable<StoredToolCall['function']> } {
  return Boolean(toolCall.function && typeof toolCall.function.name === 'string');
}
