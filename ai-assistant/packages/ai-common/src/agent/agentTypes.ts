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

// ag-ui types for Holmes agent communication.
// Event types and protocol types are provided by @ag-ui/client and @ag-ui/core.
// This file only defines types specific to the Headlamp–Holmes integration.

/** Identifies the Holmes service endpoint that the agent should contact. */
export interface HolmesServiceInfo {
  /** Kubernetes namespace where the Holmes service runs. */
  namespace: string;
  /** Service name used to reach the Holmes backend. */
  service: string;
  /** Network port exposed by the Holmes service. */
  port: number;
}

/** A single thinking step shown to the user while the agent is working. */
export interface AgentThinkingStep {
  /** Monotonic identifier for the thinking step. */
  id: number;
  /** User-friendly description */
  label: string;
  /** Current state of this step */
  status: 'pending' | 'running' | 'completed';
  /** epoch millis when the step was created / last updated */
  timestamp: number;
  /**
   * Phase this step belongs to.
   * - 'init'      — toolset / model loading
   * - 'planning'  — task list items
   * - 'executing' — tool calls
   */
  phase: 'init' | 'planning' | 'executing';
}

/** Callback invoked repeatedly as the agent streams thinking progress. */
export type AgentProgressCallback = (steps: AgentThinkingStep[]) => void;
