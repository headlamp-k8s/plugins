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

/**
 * Mock Testing Agent — simulates the full AI agent experience (thinking
 * steps, tool calls, multi-turn reasoning) for testing the agent UI and
 * workflow without a real agent backend.
 *
 * While the `mock-testing-model` provides canned LLM responses, this module
 * simulates the *agent* layer: streaming thinking steps, tool execution
 * cycles, and final answer extraction.
 */

import type { AgentProgressCallback, AgentThinkingStep } from '../agent/agentTypes';
import { BUILTIN_SESSIONS } from './builtinFixtures';

// ── Types ────────────────────────────────────────────────────────────────────

/** A single simulated tool call in an agent session. */
export interface MockToolCall {
  /** Tool name (e.g. "call_kubectl", "web_search"). */
  tool: string;
  /** Simulated input/arguments. */
  input: string;
  /** Simulated tool output. */
  output: string;
  /** Simulated duration in ms (default: 200). */
  durationMs?: number;
}

/** A single step in a scripted agent session. */
export interface MockAgentStep {
  /** Phase of this step. */
  phase: AgentThinkingStep['phase'];
  /** Label shown to the user. */
  label: string;
  /** Optional tool call details for executing-phase steps. */
  toolCall?: MockToolCall;
  /** Simulated duration in ms before this step completes (default: 100). */
  durationMs?: number;
}

/** A complete scripted agent session (question + steps + final answer). */
export interface MockAgentSession {
  /** Short identifier for the session. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** The user question that triggers this session. */
  question: string;
  /** Ordered sequence of thinking steps to simulate. */
  steps: MockAgentStep[];
  /** The final answer returned after all steps complete. */
  answer: string;
}

/** Options for creating a mock testing agent. */
export interface MockTestingAgentOptions {
  /** Additional sessions checked before built-in ones. */
  extraSessions?: MockAgentSession[];
  /** Default answer when no session matches the question. */
  fallbackAnswer?: string;
  /** Speed multiplier for step durations (default: 1.0, use 0 for instant). */
  speedMultiplier?: number;
}

/** Result from running the mock agent. */
export interface MockAgentResult {
  /** The final answer text. */
  answer: string;
  /** All thinking steps generated during the session. */
  steps: AgentThinkingStep[];
  /** The matched session name, or null if fallback was used. */
  matchedSession: string | null;
}

/** The mock testing agent interface. */
export interface MockTestingAgent {
  /** Run a question through the mock agent, simulating thinking steps. */
  run(question: string, onProgress?: AgentProgressCallback): Promise<MockAgentResult>;
  /** List all available session names and their descriptions. */
  listSessions(): Array<{ name: string; description?: string; question: string }>;
}

// ── Implementation ───────────────────────────────────────────────────────────

const DEFAULT_FALLBACK =
  "I'm the mock testing agent. I don't have a scripted session for that question. " +
  'Use listSessions() to see available scenarios.';

/**
 * Matches a user question against a session's question pattern.
 * Case-insensitive substring match.
 */
function matchQuestion(input: string, sessionQuestion: string): boolean {
  return input.toLowerCase().includes(sessionQuestion.toLowerCase());
}

/**
 * Creates a mock testing agent that simulates the full agent experience.
 *
 * The agent matches user questions against scripted sessions and replays
 * thinking steps with configurable timing. This enables testing of:
 * - Agent UI components (thinking step display, progress indicators)
 * - Agent workflow integration (tool call rendering, final answer extraction)
 * - End-to-end agent experience without real infrastructure
 *
 * @example
 * ```typescript
 * import { createMockTestingAgent } from '@headlamp-k8s/ai-common/mock-testing-agent/MockTestingAgent';
 *
 * const agent = createMockTestingAgent({ speedMultiplier: 0 }); // instant
 * const result = await agent.run('list pods', (steps) => {
 *   console.log('Progress:', steps);
 * });
 * console.log(result.answer);
 * ```
 */
export function createMockTestingAgent(options?: MockTestingAgentOptions): MockTestingAgent {
  const {
    extraSessions = [],
    fallbackAnswer = DEFAULT_FALLBACK,
    speedMultiplier = 1.0,
  } = options ?? {};

  // Use built-in sessions plus any extras
  const allSessions: MockAgentSession[] = [...extraSessions, ...BUILTIN_SESSIONS];

  function findSession(question: string): MockAgentSession | undefined {
    for (const session of allSessions) {
      if (matchQuestion(question, session.question)) {
        return session;
      }
    }
    return undefined;
  }

  async function run(
    question: string,
    onProgress?: AgentProgressCallback
  ): Promise<MockAgentResult> {
    const session = findSession(question);
    const steps: AgentThinkingStep[] = [];
    let nextId = 1;

    if (!session) {
      return {
        answer: fallbackAnswer,
        steps: [],
        matchedSession: null,
      };
    }

    for (const mockStep of session.steps) {
      const stepId = nextId++;
      const step: AgentThinkingStep = {
        id: stepId,
        label: mockStep.label,
        status: 'running',
        phase: mockStep.phase,
        timestamp: Date.now(),
      };
      steps.push(step);
      onProgress?.([...steps]);

      // Simulate step duration
      const duration = (mockStep.durationMs ?? 100) * speedMultiplier;
      if (duration > 0) {
        await sleep(duration);
      }

      // Mark step completed
      step.status = 'completed';
      step.timestamp = Date.now();
      onProgress?.([...steps]);
    }

    return {
      answer: session.answer,
      steps,
      matchedSession: session.name,
    };
  }

  function listSessions() {
    return allSessions.map(s => ({
      name: s.name,
      description: s.description,
      question: s.question,
    }));
  }

  return { run, listSessions };
}

/** Promise-based sleep. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Loads mock agent sessions from a JSON file (Node.js only).
 *
 * The JSON file should be an array of `MockAgentSession` objects or a single
 * `MockAgentSession` object.
 *
 * @throws {Error} if called in a browser environment where `fs` is unavailable.
 */
export function loadSessionsFromFile(filePath: string): MockAgentSession[] {
  let fs: typeof import('fs');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fs = require('fs');
  } catch {
    throw new Error(
      'loadSessionsFromFile() requires Node.js (fs module). ' +
        'In browser environments, pass sessions directly via extraSessions instead.'
    );
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [data];
}
