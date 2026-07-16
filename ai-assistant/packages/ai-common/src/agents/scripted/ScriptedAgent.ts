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
 * While the `mock-testing-model` provides canned model responses, this module
 * simulates the *agent* layer: streaming thinking steps, tool execution
 * cycles, and final answer extraction.
 */

import type { AgentProgressCallback, AgentThinkingStep } from '../types';
import { BUILTIN_SESSIONS } from './fixtures';
import type {
  ScriptedAgent,
  ScriptedAgentOptions,
  ScriptedAgentResult,
  ScriptedAgentSession,
} from './types';

// ── Implementation ───────────────────────────────────────────────────────────

const DEFAULT_FALLBACK =
  "I'm the mock testing agent. I don't have a scripted session for that question. " +
  'Use listSessions() to see available scenarios.';

/**
 * Matches a user question against a session's question pattern.
 * Case-insensitive substring match.
 *
 * @param input - User question to search.
 * @param sessionQuestion - Scripted question pattern to find in the input.
 * @returns Whether the input contains the scripted question.
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
 * import { createScriptedAgent } from '@headlamp-k8s/ai-common/agents/scripted/ScriptedAgent';
 *
 * const agent = createScriptedAgent({ speedMultiplier: 0 }); // instant
 * const result = await agent.run('list pods', (steps) => {
 *   console.log('Progress:', steps);
 * });
 * console.log(result.answer);
 * ```
 *
 * @param options - Extra sessions, fallback answer, and timing configuration.
 * @returns A scripted agent with deterministic run and listing operations.
 */
export function createScriptedAgent(options?: ScriptedAgentOptions): ScriptedAgent {
  const {
    extraSessions = [],
    fallbackAnswer = DEFAULT_FALLBACK,
    speedMultiplier = 1.0,
  } = options ?? {};

  // Use built-in sessions plus any extras
  const allSessions: ScriptedAgentSession[] = [...extraSessions, ...BUILTIN_SESSIONS];

  /**
   * Finds the first scripted session matching a question.
   *
   * @param question - User question to match against extra and built-in sessions.
   * @returns The first matching session, or `undefined` when none matches.
   */
  function findSession(question: string): ScriptedAgentSession | undefined {
    for (const session of allSessions) {
      if (matchQuestion(question, session.question)) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Replays the matching session's thinking steps and final answer.
   *
   * @param question - User question used to select a scripted session.
   * @param onProgress - Optional callback receiving copied progress snapshots.
   * @returns The scripted result or configured fallback result.
   */
  async function run(
    question: string,
    onProgress?: AgentProgressCallback
  ): Promise<ScriptedAgentResult> {
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

  /**
   * Lists metadata for every extra and built-in scripted session.
   *
   * @returns Session names, descriptions, and matching questions in priority order.
   */
  function listSessions() {
    return allSessions.map(s => ({
      name: s.name,
      description: s.description,
      question: s.question,
    }));
  }

  return { run, listSessions };
}

/**
 * Waits for a duration using a promise-based timer.
 *
 * @param ms - Delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Loads mock agent sessions from a JSON file (Node.js only).
 *
 * The JSON file should be an array of `ScriptedAgentSession` objects or a single
 * `ScriptedAgentSession` object.
 *
 * @param filePath - UTF-8 JSON file containing one session or an array of sessions.
 * @returns Parsed scripted sessions, wrapping a single object in an array.
 * @throws {Error} if called in a browser environment where `fs` is unavailable.
 */
export function loadSessionsFromFile(filePath: string): ScriptedAgentSession[] {
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
