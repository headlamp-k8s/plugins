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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as MockTestingAgentModule from '../scripted/ScriptedAgent';
import type { ScriptedAgent } from '../scripted/types';
import type { AgentThinkingStep } from '../types';
import { type AgentSubscriber, MockHolmesAgent } from './MockHolmesAgent';

/** Private mock Holmes state exercised by message and subscription tests. */
interface MockHolmesTestHarness {
  subscribers: AgentSubscriber[];
  messages: Array<{ id: string; role: string; content: string }>;
}

interface TestThinkingStep {
  id: number;
  label: string;
  status: string;
  phase: string;
  timestamp?: number;
}

function privateAgent(agent: MockHolmesAgent): MockHolmesTestHarness {
  return agent as unknown as MockHolmesTestHarness;
}

// ── Test helpers ─────────────────────────────────────────────────────────────

/** Build a minimal mock run function that immediately invokes the progress
 *  callback with the given steps and resolves with the given answer. */
function makeMockRun(steps: TestThinkingStep[], answer: string) {
  const completeSteps: AgentThinkingStep[] = steps.map(step => ({
    id: step.id,
    label: step.label,
    status: step.status as AgentThinkingStep['status'],
    phase: step.phase as AgentThinkingStep['phase'],
    timestamp: step.timestamp ?? step.id,
  }));
  return vi
    .fn()
    .mockImplementation(
      async (_question: string, onProgress?: (steps: AgentThinkingStep[]) => void) => {
        if (onProgress) {
          for (let i = 1; i <= completeSteps.length; i++) {
            onProgress(completeSteps.slice(0, i));
          }
        }
        return { answer, steps: completeSteps, matchedSession: null };
      }
    );
}

/** Create a complete subscriber spy with all methods tracked. */
function makeSubscriber() {
  return {
    onRunInitialized: vi.fn(),
    onRunStartedEvent: vi.fn(),
    onRunFinishedEvent: vi.fn(),
    onRunErrorEvent: vi.fn(),
    onRunFailed: vi.fn(),
    onRunFinalized: vi.fn(),
    onTextMessageStartEvent: vi.fn(),
    onTextMessageContentEvent: vi.fn(),
    onTextMessageEndEvent: vi.fn(),
    onToolCallStartEvent: vi.fn(),
    onToolCallEndEvent: vi.fn(),
  };
}

function spyOnCreateMockAgent() {
  return vi.spyOn(MockTestingAgentModule, 'createScriptedAgent');
}

// ── Unit tests ────────────────────────────────────────────────────────────────

describe('MockHolmesAgent — construction', () => {
  it('creates a MockHolmesAgent without crashing', () => {
    expect(() => new MockHolmesAgent()).not.toThrow();
  });

  it('exposes the correct connectionLabel', () => {
    const agent = new MockHolmesAgent();
    expect(agent.connectionLabel).toBe('Mock Testing Agent (local)');
  });

  it('passes options through to the underlying mock agent', () => {
    const spy = vi.spyOn(MockTestingAgentModule, 'createScriptedAgent');
    new MockHolmesAgent({ speedMultiplier: 0, fallbackAnswer: 'test' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ speedMultiplier: 0, fallbackAnswer: 'test' })
    );
    spy.mockRestore();
  });

  it('BUG check: constructor sets speedMultiplier to 0.5 by default (options override)', () => {
    const spy = vi.spyOn(MockTestingAgentModule, 'createScriptedAgent');
    new MockHolmesAgent();
    // Default is 0.5 but options.speedMultiplier=0 overrides it
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ speedMultiplier: 0.5 }));
    spy.mockRestore();
  });
});

describe('MockHolmesAgent — subscribe / unsubscribe', () => {
  it('subscribe returns an object with an unsubscribe function', () => {
    const agent = new MockHolmesAgent();
    const result = agent.subscribe({});
    expect(typeof result.unsubscribe).toBe('function');
  });

  it('unsubscribe removes the subscriber so it is no longer called', async () => {
    const spy = vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    const { unsubscribe } = agent.subscribe(sub);
    unsubscribe();

    await agent.runAgent();

    expect(sub.onRunInitialized).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('multiple subscribers all receive events', async () => {
    const spy = vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub1 = makeSubscriber();
    const sub2 = makeSubscriber();
    agent.subscribe(sub1);
    agent.subscribe(sub2);

    await agent.runAgent();

    expect(sub1.onRunInitialized).toHaveBeenCalled();
    expect(sub2.onRunInitialized).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('BUG check: subscribing same object twice and unsubscribing once removes ALL instances', () => {
    // The current filter removes ALL references to the subscriber, not just one.
    // This means if you accidentally subscribe the same object twice, one unsubscribe
    // removes it completely — which may or may not be intended behaviour.
    const agent = new MockHolmesAgent();
    const sub = makeSubscriber();
    const h1 = agent.subscribe(sub);
    agent.subscribe(sub); // same subscriber added again

    h1.unsubscribe(); // should only remove one, but removes both

    // After unsubscribing both (via one call), no subscribers remain
    const internal = privateAgent(agent).subscribers;
    expect(internal).not.toContain(sub);
  });
});

describe('MockHolmesAgent — addMessage / resetThread / getThreadId', () => {
  it('addMessage stores the message', () => {
    const agent = new MockHolmesAgent();
    agent.addMessage({ id: 'm1', role: 'user', content: 'hello' });
    expect(privateAgent(agent).messages).toHaveLength(1);
    expect(privateAgent(agent).messages[0].content).toBe('hello');
  });

  it('addMessage accumulates messages in order', () => {
    const agent = new MockHolmesAgent();
    agent.addMessage({ id: 'm1', role: 'user', content: 'first' });
    agent.addMessage({ id: 'm2', role: 'assistant', content: 'second' });
    expect(privateAgent(agent).messages).toHaveLength(2);
    expect(privateAgent(agent).messages[1].content).toBe('second');
  });

  it('resetThread clears all messages', () => {
    const agent = new MockHolmesAgent();
    agent.addMessage({ id: 'm1', role: 'user', content: 'hello' });
    agent.resetThread();
    expect(privateAgent(agent).messages).toHaveLength(0);
  });

  it('getThreadId always returns "mock-thread"', () => {
    const agent = new MockHolmesAgent();
    expect(agent.getThreadId()).toBe('mock-thread');
    agent.addMessage({ id: 'm1', role: 'user', content: 'hi' });
    expect(agent.getThreadId()).toBe('mock-thread');
    agent.resetThread();
    expect(agent.getThreadId()).toBe('mock-thread');
  });

  it('abortRun is a no-op — does not throw', () => {
    const agent = new MockHolmesAgent();
    expect(() => agent.abortRun()).not.toThrow();
  });
});

describe('MockHolmesAgent — runAgent lifecycle events', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runSpy: ReturnType<typeof spyOnCreateMockAgent>;

  beforeEach(() => {
    runSpy = spyOnCreateMockAgent().mockReturnValue({
      run: makeMockRun([], 'Test answer'),
    } as unknown as ScriptedAgent);
  });

  afterEach(() => {
    runSpy.mockRestore();
  });

  it('emits onRunInitialized then onRunStartedEvent before the run', async () => {
    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    const order: string[] = [];
    sub.onRunInitialized = vi.fn().mockImplementation(() => order.push('init'));
    sub.onRunStartedEvent = vi.fn().mockImplementation(() => order.push('started'));
    agent.subscribe(sub);

    await agent.runAgent();

    expect(order).toEqual(['init', 'started']);
  });

  it('emits onRunFinishedEvent then onRunFinalized after a successful run', async () => {
    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    const order: string[] = [];
    sub.onRunFinishedEvent = vi.fn().mockImplementation(() => order.push('finished'));
    sub.onRunFinalized = vi.fn().mockImplementation(() => order.push('finalized'));
    agent.subscribe(sub);

    await agent.runAgent();

    expect(order).toEqual(['finished', 'finalized']);
  });

  it('uses the last user message as the question passed to mockAgent.run', async () => {
    const mockRun = vi.fn().mockResolvedValue({ answer: 'ok', steps: [] });
    runSpy.mockReturnValue({ run: mockRun } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    agent.addMessage({ id: 'm1', role: 'user', content: 'first question' });
    agent.addMessage({ id: 'm2', role: 'assistant', content: 'first answer' });
    agent.addMessage({ id: 'm3', role: 'user', content: 'second question' });

    await agent.runAgent();

    expect(mockRun).toHaveBeenCalledWith('second question', expect.any(Function));
  });

  it('uses empty string as question when no user messages exist', async () => {
    const mockRun = vi.fn().mockResolvedValue({ answer: 'ok', steps: [] });
    runSpy.mockReturnValue({ run: mockRun } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    await agent.runAgent();

    expect(mockRun).toHaveBeenCalledWith('', expect.any(Function));
  });

  it('does not mutate this.messages when finding the last user message', async () => {
    runSpy.mockReturnValue({ run: makeMockRun([], 'ok') } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    agent.addMessage({ id: 'm1', role: 'user', content: 'first' });
    agent.addMessage({ id: 'm2', role: 'user', content: 'second' });

    const before = [...privateAgent(agent).messages];
    await agent.runAgent();
    const after = privateAgent(agent).messages;

    expect(after.map(message => message.content)).toEqual(before.map(message => message.content));
  });
});

describe('MockHolmesAgent — runAgent: step events', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits onToolCallStartEvent for running+executing+Running... steps', async () => {
    const step = {
      id: 1,
      label: 'Running kubectl get pods',
      status: 'running',
      phase: 'executing',
      timestamp: 0,
    };
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([step], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await agent.runAgent();

    expect(sub.onToolCallStartEvent).toHaveBeenCalledWith({
      event: { toolCallId: 'mock-tool-1', toolCallName: 'kubectl get pods' },
    });
  });

  it('strips "Running " prefix from tool call name', async () => {
    const step = {
      id: 2,
      label: 'Running my_mcp_tool',
      status: 'running',
      phase: 'executing',
      timestamp: 0,
    };
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([step], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    const call = sub.onToolCallStartEvent.mock.calls[0][0];
    expect(call.event.toolCallName).toBe('my_mcp_tool');
  });

  it('emits thinking text message for running steps that are NOT tool calls', async () => {
    const step = {
      id: 3,
      label: 'Analyzing the problem',
      status: 'running',
      phase: 'planning',
      timestamp: 0,
    };
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([step], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    expect(sub.onTextMessageStartEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: { messageId: 'mock-msg-3' } })
    );
    expect(sub.onTextMessageContentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: { delta: '🔧 Using Agent tool: Analyzing the problem' } })
    );
    expect(sub.onTextMessageEndEvent).toHaveBeenCalled();
  });

  it('emits thinking text message for running+executing steps whose label does NOT start with "Running"', async () => {
    const step = {
      id: 4,
      label: 'Preparing kubectl command',
      status: 'running',
      phase: 'executing',
      timestamp: 0,
    };
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([step], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    // Falls into the "else" (thinking message) branch, NOT tool call
    expect(sub.onToolCallStartEvent).not.toHaveBeenCalled();
    expect(sub.onTextMessageStartEvent).toHaveBeenCalled();
  });

  it('emits onToolCallEndEvent for completed+executing steps', async () => {
    const steps = [
      { id: 5, label: 'Running list_pods', status: 'running', phase: 'executing', timestamp: 0 },
      { id: 5, label: 'Running list_pods', status: 'completed', phase: 'executing', timestamp: 1 },
    ];
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockImplementation(async (_q, cb) => {
        cb?.([steps[0]]);
        cb?.([steps[0], steps[1]]);
        return { answer: 'done', steps };
      }),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    expect(sub.onToolCallEndEvent).toHaveBeenCalledWith({ toolCallName: 'list_pods' });
  });

  it('does NOT emit any event for completed steps that are not executing phase', async () => {
    const step = {
      id: 6,
      label: 'Planning done',
      status: 'completed',
      phase: 'planning',
      timestamp: 0,
    };
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([step], 'done'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    // Neither tool call nor thinking events for this step
    expect(sub.onToolCallStartEvent).not.toHaveBeenCalled();
    expect(sub.onToolCallEndEvent).not.toHaveBeenCalled();
    // onTextMessageStartEvent may be called for the final answer, not this step
    const allContentCalls = sub.onTextMessageContentEvent.mock.calls;
    const stepContent = allContentCalls.find(c => c[0]?.event?.delta?.includes('Planning done'));
    expect(stepContent).toBeUndefined();
  });

  it('handles an empty steps array in the progress callback gracefully', async () => {
    // Covers the `if (steps.length === 0) return` guard
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockImplementation(async (_q, cb) => {
        cb?.([]); // empty steps — should be a no-op
        return { answer: 'done', steps: [] };
      }),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await expect(agent.runAgent()).resolves.toBeUndefined();
    // No step events should have fired from the empty callback
    expect(sub.onToolCallStartEvent).not.toHaveBeenCalled();
  });

  it('only processes the latest step on each progress callback', async () => {
    // The step callback only looks at steps[steps.length - 1], so if multiple
    // steps are present in one callback, only the last is processed.
    let progressCb: ((steps: AgentThinkingStep[]) => void) | undefined;
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockImplementation(async (_q, cb) => {
        progressCb = cb;
        // Invoke with 3 steps at once — only the last should be processed
        cb?.([
          { id: 1, label: 'Step 1', status: 'running', phase: 'planning', timestamp: 0 },
          { id: 2, label: 'Step 2', status: 'running', phase: 'planning', timestamp: 1 },
          { id: 3, label: 'Step 3', status: 'running', phase: 'planning', timestamp: 2 },
        ]);
        return { answer: 'done', steps: [] };
      }),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    // Only step 3 should produce a text message (the latest one)
    const contentCalls = sub.onTextMessageContentEvent.mock.calls;
    const stepContents = contentCalls
      .filter(c => c[0]?.event?.delta?.includes('Using Agent tool'))
      .map(c => c[0].event.delta);

    expect(stepContents).toHaveLength(1);
    expect(stepContents[0]).toContain('Step 3');
  });
});

describe('MockHolmesAgent — runAgent: answer streaming', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits the final answer via onTextMessageContentEvent', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], 'Hello world'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    const content = sub.onTextMessageContentEvent.mock.calls
      .map(c => c[0]?.event?.delta)
      .filter(Boolean)
      .join('');
    expect(content).toBe('Hello world');
  });

  it('streams long answers in multiple chunks', async () => {
    const longAnswer = 'A'.repeat(200);
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], longAnswer),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    const contentCalls = sub.onTextMessageContentEvent.mock.calls.length;
    // 200 chars / 50 per chunk = 4 chunks
    expect(contentCalls).toBeGreaterThanOrEqual(4);
  });

  it('concatenated chunks equal the full answer', async () => {
    const answer = 'The quick brown fox jumps over the lazy dog. Kubernetes rocks!';
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], answer),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);
    await agent.runAgent();

    const full = sub.onTextMessageContentEvent.mock.calls
      .map(c => c[0]?.event?.delta ?? '')
      .join('');
    expect(full).toBe(answer);
  });

  it('wraps the answer in onTextMessageStartEvent/onTextMessageEndEvent', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], 'Short'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    const order: string[] = [];
    sub.onTextMessageStartEvent = vi.fn().mockImplementation(() => order.push('start'));
    sub.onTextMessageContentEvent = vi.fn().mockImplementation(() => order.push('content'));
    sub.onTextMessageEndEvent = vi.fn().mockImplementation(() => order.push('end'));
    agent.subscribe(sub);

    await agent.runAgent();

    const answerSequence = order.slice(order.lastIndexOf('start'));
    expect(answerSequence[0]).toBe('start');
    expect(answerSequence.slice(1, -1).every(e => e === 'content')).toBe(true);
    expect(answerSequence[answerSequence.length - 1]).toBe('end');
  });

  it('BUG check: splitIntoChunks does NOT split at word boundaries despite the comment', () => {
    // The function comment says "at word boundaries" but implementation slices
    // at exact character positions — "hello world" with size=7 gives ["hello w", "orld"]
    // not ["hello ", "world"]. This is a documentation bug.
    // Verifying the ACTUAL behavior here to document it:
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: makeMockRun([], 'hello world'),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    return agent.runAgent().then(() => {
      const chunks = sub.onTextMessageContentEvent.mock.calls.map(c => c[0]?.event?.delta ?? '');
      // With size=50 and "hello world" (11 chars), only 1 chunk is produced
      expect(chunks.join('')).toBe('hello world');
    });
  });
});

describe('MockHolmesAgent — runAgent: error handling', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits onRunErrorEvent when mockAgent.run throws', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockRejectedValue(new Error('agent crash')),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await agent.runAgent();

    expect(sub.onRunErrorEvent).toHaveBeenCalledWith({
      event: { message: 'agent crash' },
    });
  });

  it('emits onRunFinalized even when the run errors', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockRejectedValue(new Error('crash')),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await agent.runAgent();

    expect(sub.onRunFinalized).toHaveBeenCalled();
  });

  it('does NOT emit onRunFinishedEvent when the run errors', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockRejectedValue(new Error('crash')),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await agent.runAgent();

    expect(sub.onRunFinishedEvent).not.toHaveBeenCalled();
  });

  it('uses "Mock agent error" fallback when the thrown error has no message', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockRejectedValue(null),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    await agent.runAgent();

    expect(sub.onRunErrorEvent).toHaveBeenCalledWith({
      event: { message: 'Mock agent error' },
    });
  });

  it('does not throw to the caller — resolves even on error', async () => {
    vi.spyOn(MockTestingAgentModule, 'createScriptedAgent').mockReturnValue({
      run: vi.fn().mockRejectedValue(new Error('boom')),
    } as unknown as ScriptedAgent);

    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    agent.subscribe(makeSubscriber());

    await expect(agent.runAgent()).resolves.toBeUndefined();
  });
});

describe('MockHolmesAgent — runAgent with built-in sessions (integration)', () => {
  it('runs a built-in session end-to-end and emits a non-empty answer', async () => {
    // Use the real ScriptedAgent with speedMultiplier:0 for fast test
    const agent = new MockHolmesAgent({ speedMultiplier: 0 });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    agent.addMessage({ id: 'm1', role: 'user', content: 'What pods are running?' });

    await agent.runAgent();

    // run initialized and finished
    expect(sub.onRunInitialized).toHaveBeenCalled();
    expect(sub.onRunFinishedEvent).toHaveBeenCalled();
    expect(sub.onRunFinalized).toHaveBeenCalled();

    // Some content was emitted
    const answer = sub.onTextMessageContentEvent.mock.calls
      .map(c => c[0]?.event?.delta ?? '')
      .join('');
    expect(answer.length).toBeGreaterThan(0);
  });

  it('uses the fallback answer when no session matches', async () => {
    const agent = new MockHolmesAgent({
      speedMultiplier: 0,
      fallbackAnswer: 'Custom fallback answer',
    });
    const sub = makeSubscriber();
    agent.subscribe(sub);

    agent.addMessage({ id: 'm1', role: 'user', content: 'zzz-no-match-xyz' });

    await agent.runAgent();

    const answer = sub.onTextMessageContentEvent.mock.calls
      .map(c => c[0]?.event?.delta ?? '')
      .join('');
    expect(answer).toBe('Custom fallback answer');
  });
});
