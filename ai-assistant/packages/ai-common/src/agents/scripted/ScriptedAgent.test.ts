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

import { describe, expect, it } from 'vitest';
import type { AgentThinkingStep } from '../types';
import { BUILTIN_SESSIONS } from './fixtures';
import { createScriptedAgent } from './ScriptedAgent';
import type { ScriptedAgentSession } from './types';

describe('ScriptedAgent', () => {
  describe('createScriptedAgent', () => {
    it('returns an object with run and listSessions methods', () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      expect(agent).toBeDefined();
      expect(typeof agent.run).toBe('function');
      expect(typeof agent.listSessions).toBe('function');
    });

    it('lists built-in sessions', () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const sessions = agent.listSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);

      const names = sessions.map(s => s.name);
      expect(names).toContain('pod-troubleshooting');
      expect(names).toContain('cluster-exploration');
    });
  });

  describe('run', () => {
    it('returns a result matching a built-in session', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run('why is my pod failing');

      expect(result.matchedSession).toBe('pod-troubleshooting');
      expect(result.answer).toContain('CrashLoopBackOff');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('returns fallback for unmatched questions', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run('something completely unrelated xyz123');

      expect(result.matchedSession).toBeNull();
      expect(result.answer).toContain('mock testing agent');
      expect(result.steps).toHaveLength(0);
    });

    it('uses custom fallback answer', async () => {
      const agent = createScriptedAgent({
        speedMultiplier: 0,
        fallbackAnswer: 'Custom fallback',
      });
      const result = await agent.run('unknown question xyz');

      expect(result.answer).toBe('Custom fallback');
    });

    it('invokes onProgress callback with thinking steps', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const progressCalls: AgentThinkingStep[][] = [];

      await agent.run('why is my pod failing', steps => {
        progressCalls.push([...steps]);
      });

      // Should be called multiple times (once per step start, once per step complete)
      expect(progressCalls.length).toBeGreaterThan(0);

      // First call should have at least one step
      expect(progressCalls[0].length).toBeGreaterThanOrEqual(1);

      // Last call should have all steps completed
      const lastCall = progressCalls[progressCalls.length - 1];
      for (const step of lastCall) {
        expect(step.status).toBe('completed');
      }
    });

    it('generates correct phases for steps', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run('what is running in my cluster');

      expect(result.matchedSession).toBe('cluster-exploration');

      const initSteps = result.steps.filter(s => s.phase === 'init');
      const planningSteps = result.steps.filter(s => s.phase === 'planning');
      const executingSteps = result.steps.filter(s => s.phase === 'executing');

      expect(initSteps.length).toBeGreaterThan(0);
      expect(planningSteps.length).toBeGreaterThan(0);
      expect(executingSteps.length).toBeGreaterThan(0);
    });

    it('supports extra sessions', async () => {
      const customSession: ScriptedAgentSession = {
        name: 'custom-test',
        question: 'run custom test',
        steps: [{ phase: 'init', label: 'Custom init', durationMs: 0 }],
        answer: 'Custom answer',
      };

      const agent = createScriptedAgent({
        speedMultiplier: 0,
        extraSessions: [customSession],
      });

      const result = await agent.run('run custom test');
      expect(result.matchedSession).toBe('custom-test');
      expect(result.answer).toBe('Custom answer');
      expect(result.steps).toHaveLength(1);
    });

    it('extra sessions take priority over built-in ones', async () => {
      const overrideSession: ScriptedAgentSession = {
        name: 'override-pod',
        question: 'why is my pod failing',
        steps: [],
        answer: 'Override answer',
      };

      const agent = createScriptedAgent({
        speedMultiplier: 0,
        extraSessions: [overrideSession],
      });

      const result = await agent.run('why is my pod failing');
      expect(result.matchedSession).toBe('override-pod');
      expect(result.answer).toBe('Override answer');
    });

    it('matches case-insensitively', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run('WHY IS MY POD FAILING');
      expect(result.matchedSession).toBe('pod-troubleshooting');
    });

    it('matches substring of question', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run(
        'Please help me understand why is my pod failing in the default namespace'
      );
      expect(result.matchedSession).toBe('pod-troubleshooting');
    });

    it('assigns unique IDs to steps', async () => {
      const agent = createScriptedAgent({ speedMultiplier: 0 });
      const result = await agent.run('what is running in my cluster');

      const ids = result.steps.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('builtinFixtures', () => {
    it('BUILTIN_SESSIONS contains expected sessions', () => {
      expect(BUILTIN_SESSIONS.length).toBe(3);

      const podSession = BUILTIN_SESSIONS.find(s => s.name === 'pod-troubleshooting');
      expect(podSession).toBeDefined();
      expect(podSession!.steps.length).toBeGreaterThan(0);
      expect(podSession!.answer.length).toBeGreaterThan(0);

      const clusterSession = BUILTIN_SESSIONS.find(s => s.name === 'cluster-exploration');
      expect(clusterSession).toBeDefined();
      expect(clusterSession!.steps.length).toBeGreaterThan(0);

      const diagnosisSession = BUILTIN_SESSIONS.find(s => s.name === 'event-diagnosis');
      expect(diagnosisSession).toBeDefined();
      expect(diagnosisSession!.steps.length).toBeGreaterThan(0);
      expect(diagnosisSession!.answer.length).toBeGreaterThan(0);
    });

    it('all sessions have required fields', () => {
      for (const session of BUILTIN_SESSIONS) {
        expect(session.name).toBeTruthy();
        expect(session.question).toBeTruthy();
        expect(session.answer).toBeTruthy();
        expect(Array.isArray(session.steps)).toBe(true);

        for (const step of session.steps) {
          expect(['init', 'planning', 'executing']).toContain(step.phase);
          expect(step.label).toBeTruthy();
        }
      }
    });
  });
});
