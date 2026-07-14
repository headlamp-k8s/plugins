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

import type { KubernetesAssistantContext } from '../kubernetes/types';

/** User, conversation, cluster, and tool context attached to an assistant request. */
export interface AssistantRequestContext {
  /** Latest user message being processed. */
  userMessage?: string;
  /** Recent conversation messages. */
  conversationHistory?: Array<{
    /** Conversation role associated with the message. */
    role: string;
    /** Text content of the message. */
    content: string;
  }>;
  /** Kubernetes context available to tool argument preparation. */
  kubernetesContext?: KubernetesAssistantContext;
  /** Recent tool results keyed by contextual identifier. */
  lastToolResults?: Record<string, unknown>;
  /** Timestamp used for time-sensitive suggestions. */
  timeContext?: Date;
}
