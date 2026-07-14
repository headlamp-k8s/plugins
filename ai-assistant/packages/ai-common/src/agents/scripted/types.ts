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

import type { AgentProgressCallback, AgentThinkingStep } from '../types';

/** A single simulated tool call in a scripted agent session. */
export interface ScriptedToolCall {
  tool: string;
  input: string;
  output: string;
  durationMs?: number;
}

/** A single step in a scripted agent session. */
export interface ScriptedAgentStep {
  phase: AgentThinkingStep['phase'];
  label: string;
  toolCall?: ScriptedToolCall;
  durationMs?: number;
}

/** A complete scripted agent session. */
export interface ScriptedAgentSession {
  name: string;
  description?: string;
  question: string;
  steps: ScriptedAgentStep[];
  answer: string;
}

/** Options for creating a scripted agent. */
export interface ScriptedAgentOptions {
  extraSessions?: ScriptedAgentSession[];
  fallbackAnswer?: string;
  speedMultiplier?: number;
}

/** Result from running a scripted agent. */
export interface ScriptedAgentResult {
  answer: string;
  steps: AgentThinkingStep[];
  matchedSession: string | null;
}

/** Agent implementation that replays configured sessions. */
export interface ScriptedAgent {
  run(question: string, onProgress?: AgentProgressCallback): Promise<ScriptedAgentResult>;
  listSessions(): Array<{ name: string; description?: string; question: string }>;
}
