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

import type { ToolCall } from '../tools/types';
import type { AssistantRequestContext } from './context';

/** Represents one step in an assistant's visible activity trace. */
export interface AssistantActivityStep {
  /** Unique identifier for the activity step. */
  id: string;
  /** Text shown for this activity step. */
  content: string;
  /** Category used to render the activity. */
  type: 'tool-start' | 'tool-result' | 'intermediate-text' | 'todo-update';
  /** Unix timestamp in milliseconds for when the activity was recorded. */
  timestamp: number;
}

/** Defines a message stored in assistant conversation history. */
export interface ConversationMessage {
  /** Chat role associated with the message. */
  role: string;
  /** Main text content for the message. */
  content: string;
  /** Tool calls attached to the message. */
  toolCalls?: unknown[];
  /** Identifier of the tool call this message belongs to. */
  toolCallId?: string;
  /** Optional display name for the message author. */
  name?: string;
  /** Whether the message represents an error state. */
  error?: boolean;
  /** Whether the message represents a successful result. */
  success?: boolean;
  /** Whether the message was blocked by a content filter. */
  contentFilterError?: boolean;
  /** Whether the message has already been rendered to the user. */
  alreadyDisplayed?: boolean;
  /** Whether the message is for UI display only and should not reach the LLM. */
  isDisplayOnly?: boolean;
  /** Request identifier used to track tool confirmation updates. */
  requestId?: string;
  /** Assistant activity shown in a collapsible block. */
  agentThinkingSteps?: AssistantActivityStep[];
  /** Whether the agent run is complete and the activity block can collapse. */
  agentThinkingDone?: boolean;
  /** Inline approval controls for pending tool execution. */
  toolConfirmation?: {
    /** Tool calls awaiting approval. */
    tools: ToolCall[];
    /**
     * Approves selected pending tool calls.
     *
     * @param approvedToolIds - Identifiers of the tool calls approved for execution.
     * @returns No value.
     */
    onApprove: (approvedToolIds: string[]) => void;
    /**
     * Denies the pending tool request.
     *
     * @returns No value.
     */
    onDeny: () => void;
    /** Whether approval UI should show a loading state. */
    loading?: boolean;
    /** Request identifier used to update this confirmation. */
    requestId?: string;
    /** Additional user or conversation context for approval UI. */
    userContext?: AssistantRequestContext;
  };
}
