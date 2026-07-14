/**
 * MockHolmesAgent — a drop-in replacement for HolmesAgent that uses the
 * mock testing agent internally. Conforms to the same subscribe/addMessage/
 * runAgent/resetThread interface so the UI code works without changes.
 *
 * Enable via Developer Options → Mock Testing Agent toggle.
 */

import type { RunAgentParameters } from '@ag-ui/client';
import { createScriptedAgent } from '../scripted/ScriptedAgent';
import type { ScriptedAgent, ScriptedAgentOptions } from '../scripted/types';

/** Subscriber callbacks matching the ag-ui event interface used by HolmesAgent. */
export interface AgentSubscriber {
  onEvent?: (args: { event: unknown }) => void;
  onRunInitialized?: () => void;
  onRunStartedEvent?: () => void;
  onRunFinishedEvent?: () => void;
  onRunErrorEvent?: (args: { event: { message: string } }) => void;
  onRunFailed?: (args: { error: unknown }) => void;
  onRunFinalized?: () => void;
  onTextMessageStartEvent?: (args: { event: { messageId: string } }) => void;
  onTextMessageContentEvent?: (args: { event: { delta: string } }) => void;
  onTextMessageEndEvent?: () => void;
  onToolCallStartEvent?: (args: { event: { toolCallId: string; toolCallName: string } }) => void;
  onToolCallEndEvent?: (args: { toolCallName: string }) => void;
}

/**
 * Adapter that makes the mock testing agent look like a HolmesAgent.
 *
 * It translates mock agent sessions into the ag-ui event stream that the
 * UI's `handleToggleAgentMode` subscriber expects.
 */
export class MockHolmesAgent {
  private mockAgent: ScriptedAgent;
  private subscribers: AgentSubscriber[] = [];
  private messages: Array<{ id: string; role: string; content: string }> = [];
  private readonly chunkDelayMs: number;

  /** Label shown in the UI to identify the connection. */
  readonly connectionLabel = 'Mock Testing Agent (local)';

  constructor(options?: ScriptedAgentOptions) {
    const speedMultiplier = options?.speedMultiplier ?? 0.5;
    this.chunkDelayMs = 10 * speedMultiplier;
    this.mockAgent = createScriptedAgent({
      speedMultiplier: 0.5, // fast but visible
      ...options,
    });
  }

  /** Subscribe to agent events. */
  subscribe(subscriber: AgentSubscriber): { unsubscribe: () => void } {
    this.subscribers.push(subscriber);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(s => s !== subscriber);
      },
    };
  }

  /** Add a message to the conversation. */
  addMessage(message: { id: string; role: string; content: string }): void {
    this.messages.push(message);
  }

  /**
   * Run the agent — replays a mock session as ag-ui events.
   *
   * Translates mock agent phases/steps into the event callbacks that the
   * UI's `handleToggleAgentMode` subscriber uses to build the chat UI.
   */
  async runAgent(_?: RunAgentParameters): Promise<void> {
    // Get the last user message
    const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user');
    const question = lastUserMsg?.content || '';

    // Emit run started
    for (const sub of this.subscribers) {
      sub.onRunInitialized?.();
      sub.onRunStartedEvent?.();
    }

    try {
      const result = await this.mockAgent.run(question, steps => {
        // Convert mock agent steps to ag-ui events
        if (steps.length === 0) return;
        const latest = steps[steps.length - 1];

        if (latest.status === 'running') {
          // Emit as a text message with the step label
          if (latest.phase === 'executing' && latest.label.startsWith('Running')) {
            // Tool call start
            const toolName = latest.label.replace(/^Running\s+/, '');
            for (const sub of this.subscribers) {
              sub.onToolCallStartEvent?.({
                event: {
                  toolCallId: `mock-tool-${latest.id}`,
                  toolCallName: toolName,
                },
              });
            }
          } else {
            // Thinking step as text message
            const msgId = `mock-msg-${latest.id}`;
            for (const sub of this.subscribers) {
              sub.onTextMessageStartEvent?.({ event: { messageId: msgId } });
              sub.onTextMessageContentEvent?.({
                event: { delta: `🔧 Using Agent tool: ${latest.label}` },
              });
              sub.onTextMessageEndEvent?.();
            }
          }
        } else if (latest.status === 'completed' && latest.phase === 'executing') {
          // Tool call end
          const toolName = latest.label.replace(/^Running\s+/, '');
          for (const sub of this.subscribers) {
            sub.onToolCallEndEvent?.({ toolCallName: toolName });
          }
        }
      });

      // Emit the final answer as a text message
      const answerId = `mock-answer-${Date.now()}`;
      for (const sub of this.subscribers) {
        sub.onTextMessageStartEvent?.({ event: { messageId: answerId } });
      }

      // Stream the answer in chunks to simulate typing
      const chunks = splitIntoChunks(result.answer, 50);
      for (const chunk of chunks) {
        for (const sub of this.subscribers) {
          sub.onTextMessageContentEvent?.({ event: { delta: chunk } });
        }
        if (this.chunkDelayMs > 0) {
          await sleep(this.chunkDelayMs);
        }
      }

      for (const sub of this.subscribers) {
        sub.onTextMessageEndEvent?.();
      }

      // Emit run finished
      for (const sub of this.subscribers) {
        sub.onRunFinishedEvent?.();
        sub.onRunFinalized?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Mock agent error';
      for (const sub of this.subscribers) {
        sub.onRunErrorEvent?.({ event: { message } });
        sub.onRunFinalized?.();
      }
    }
  }

  /** Abort the current run (no-op for mock). */
  abortRun(): void {
    // No-op
  }

  /** Reset the conversation thread. */
  resetThread(): void {
    this.messages = [];
  }

  /** Get the current thread ID. */
  getThreadId(): string {
    return 'mock-thread';
  }
}

/** Split text into chunks of approximately `size` characters at word boundaries. */
function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
