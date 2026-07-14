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

import type { ConversationMessage } from '../conversation/types';
import type { KubernetesAssistantContext } from '../kubernetes/types';

/** Stateful assistant conversation lifecycle independent of any model framework. */
export abstract class AssistantSession {
  /** Conversation history maintained by the session. */
  history: ConversationMessage[] = [];
  /** Extra contextual text prepended to requests. */
  currentContext = '';

  /**
   * Replaces the current request context with the provided description.
   *
   * @param contextDescription - Context text to use for subsequent requests.
   * @returns No value.
   */
  setContext(contextDescription: string): void {
    this.currentContext = contextDescription;
  }

  /**
   * Appends one contextual line or block to the existing request context.
   *
   * @param info - Context text to append on a new line when context already exists.
   * @returns No value.
   */
  addContextualInfo(info: string): void {
    this.currentContext = this.currentContext ? `${this.currentContext}\n${info}` : info;
  }

  /**
   * Clears conversation history and any accumulated context.
   *
   * @returns No value.
   */
  reset(): void {
    this.history = [];
    this.currentContext = '';
  }

  /**
   * Sends a user message through the session.
   *
   * @param message - User-authored message to process.
   * @returns The assistant message produced for the request.
   */
  abstract userSend(message: string): Promise<ConversationMessage>;

  /**
   * Processes queued tool results.
   *
   * @returns The next conversation message produced from tool results.
   */
  abstract processToolResponses(): Promise<ConversationMessage>;

  /**
   * Cancels the current in-flight request, if any.
   *
   * @returns No value.
   */
  abstract abort(): void;

  /**
   * Configures the tools available to the session for a given context.
   *
   * @param tools - Tool definitions supplied by the host.
   * @param context - Host-specific context applied to the tools.
   * @returns No value.
   */
  configureTools?(tools: unknown[], context: unknown): void;

  /**
   * Returns the Kubernetes context currently configured for tool execution.
   *
   * @returns Current Kubernetes context, or `undefined` when none is configured.
   */
  getKubernetesContext?(): KubernetesAssistantContext | undefined;

  /**
   * Returns suggested prompts for the UI.
   *
   * @returns Suggested user prompts; empty by default.
   */
  getPromptSuggestions(): string[] {
    return [];
  }
}

export default AssistantSession;
