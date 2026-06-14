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

/** Describes a tool call requested by the assistant. */
export type ToolCall = {
  /** Unique identifier for this tool call. */
  id: string;
  /** Tool name shown to the user and execution layer. */
  name: string;
  /** Optional human-readable summary of what the tool does. */
  description?: string;
  /** Arguments that should be passed to the tool. */
  arguments: Record<string, any>;
  /** Source of the tool implementation. */
  type: 'mcp' | 'regular';
};

/** Represents one step in the agent's visible reasoning trace. */
export type AgentThinkingStep = {
  /** Unique identifier for the thinking step. */
  id: string;
  /** Text shown for this reasoning step. */
  content: string;
  /** Category used to render the step in the UI. */
  type: 'tool-start' | 'tool-result' | 'intermediate-text' | 'todo-update';
  /** Unix timestamp for when the step was recorded. */
  timestamp: number;
};

/** Defines a chat prompt or response stored in conversation history. */
export type Prompt = {
  /** Chat role associated with the message. */
  role: string;
  /** Main text content for the message. */
  content: string;
  /** Tool calls attached to the message. */
  toolCalls?: any[];
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
  /** Agent-mode thinking steps shown in a collapsible block. */
  agentThinkingSteps?: AgentThinkingStep[];
  /** Whether the agent run is complete and the thinking block can collapse. */
  agentThinkingDone?: boolean;
  /** Inline approval controls for pending tool execution. */
  toolConfirmation?: {
    /** Tool calls awaiting approval. */
    tools: ToolCall[];
    /** Approves the selected tool call IDs. */
    onApprove: (approvedToolIds: string[]) => void;
    /** Denies the pending tool request. */
    onDeny: () => void;
    /** Whether approval UI should show a loading state. */
    loading?: boolean;
    /** Additional user or conversation context for approval UI. */
    userContext?: any;
  };
};

/** Base contract for AI managers that track history and execute tool workflows. */
export default abstract class AIManager {
  /** Conversation history maintained by the manager. */
  history: Prompt[] = [];
  /** Extra contextual text prepended to requests. */
  currentContext: string = '';

  /** Replaces the current request context with the provided description. */
  setContext(contextDescription: string) {
    this.currentContext = contextDescription;
  }

  /** Appends one contextual line or block to the existing request context. */
  addContextualInfo(info: string) {
    if (this.currentContext) {
      this.currentContext += '\n' + info;
    } else {
      this.currentContext = info;
    }
  }

  /** Clears conversation history and any accumulated context. */
  reset() {
    this.history = [];
    this.currentContext = '';
  }

  /** Sends a user message through the manager and returns the resulting prompt. */
  abstract userSend(message: string): Promise<Prompt>;

  /** Processes queued tool results and returns the next prompt. */
  abstract processToolResponses(): Promise<Prompt>;

  /** Cancels the current in-flight request, if any. */
  abstract abort(): void;

  /** Configures the tools available to the manager for a given context. */
  configureTools?(tools: any[], context: any): void;

  /** Returns suggested prompts for the UI. */
  getPromptSuggestions(): string[] {
    return [];
  }
}
