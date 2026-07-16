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
  /** Tool identifier represented by the simulated call. */
  tool: string;
  /** Serialized or display-ready input supplied to the tool. */
  input: string;
  /** Serialized or display-ready output returned by the tool. */
  output: string;
  /** Optional simulated tool duration in milliseconds. */
  durationMs?: number;
}

/** A single step in a scripted agent session. */
export interface ScriptedAgentStep {
  /** Agent lifecycle phase shown for the step. */
  phase: AgentThinkingStep['phase'];
  /** Human-readable progress label. */
  label: string;
  /** Optional simulated tool call associated with the step. */
  toolCall?: ScriptedToolCall;
  /** Optional step duration in milliseconds before speed scaling. */
  durationMs?: number;
}

/** A complete scripted agent session. */
export interface ScriptedAgentSession {
  /** Stable session identifier returned when the session matches. */
  name: string;
  /** Optional session summary shown in listings. */
  description?: string;
  /** Case-insensitive substring pattern used to match user questions. */
  question: string;
  /** Ordered progress steps replayed by the session. */
  steps: ScriptedAgentStep[];
  /** Final answer returned after all steps complete. */
  answer: string;
}

/** Options for creating a scripted agent. */
export interface ScriptedAgentOptions {
  /** Additional sessions searched before built-in sessions. */
  extraSessions?: ScriptedAgentSession[];
  /** Answer returned when no session matches. */
  fallbackAnswer?: string;
  /** Multiplier applied to each simulated step duration; `0` disables delays. */
  speedMultiplier?: number;
}

/** Result from running a scripted agent. */
export interface ScriptedAgentResult {
  /** Final scripted or fallback answer. */
  answer: string;
  /** Progress steps completed during the run. */
  steps: AgentThinkingStep[];
  /** Matched session identifier, or `null` for a fallback result. */
  matchedSession: string | null;
}

/** Agent implementation that replays configured sessions. */
export interface ScriptedAgent {
  /**
   * Replays a matching session or returns the configured fallback.
   *
   * @param question - User question used for session matching.
   * @param onProgress - Optional callback receiving progress snapshots.
   * @returns The completed scripted or fallback result.
   */
  run(question: string, onProgress?: AgentProgressCallback): Promise<ScriptedAgentResult>;

  /**
   * Lists metadata for all configured sessions in matching priority order.
   *
   * @returns Session identifiers, optional descriptions, and question patterns.
   */
  listSessions(): Array<{
    /** Stable session identifier. */
    name: string;
    /** Optional session summary. */
    description?: string;
    /** Question pattern used for matching. */
    question: string;
  }>;
}
