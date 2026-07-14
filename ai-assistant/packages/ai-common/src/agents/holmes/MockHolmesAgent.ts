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
  /**
   * Receives a generic event; this mock does not emit it.
   *
   * @param args - Generic event wrapper.
   * @returns No value.
   */
  onEvent?: (args: {
    /** Generic event payload. */
    event: unknown;
  }) => void;
  /**
   * Receives run initialization before scripted execution.
   *
   * @returns No value.
   */
  onRunInitialized?: () => void;
  /**
   * Receives run start before scripted execution.
   *
   * @returns No value.
   */
  onRunStartedEvent?: () => void;
  /**
   * Receives successful run completion.
   *
   * @returns No value.
   */
  onRunFinishedEvent?: () => void;
  /**
   * Receives errors caught after run-start callbacks complete.
   *
   * @param args - Error event wrapper.
   * @returns No value.
   */
  onRunErrorEvent?: (args: {
    /** Error event payload. */
    event: {
      /** Error message. */
      message: string;
    };
  }) => void;
  /**
   * Receives a generic run failure; this mock does not emit it.
   *
   * @param args - Failure wrapper.
   * @returns No value.
   */
  onRunFailed?: (args: {
    /** Generic failure value. */
    error: unknown;
  }) => void;
  /**
   * Receives run finalization after success or a caught run error.
   *
   * @returns No value.
   */
  onRunFinalized?: () => void;
  /**
   * Receives the start of a thinking or answer message.
   *
   * @param args - Message-start event wrapper.
   * @returns No value.
   */
  onTextMessageStartEvent?: (args: {
    /** Message-start event payload. */
    event: {
      /** Generated message identifier. */
      messageId: string;
    };
  }) => void;
  /**
   * Receives one thinking label or answer chunk.
   *
   * @param args - Message-content event wrapper.
   * @returns No value.
   */
  onTextMessageContentEvent?: (args: {
    /** Message-content event payload. */
    event: {
      /** Text appended to the current message. */
      delta: string;
    };
  }) => void;
  /**
   * Receives the end of a thinking or answer message.
   *
   * @returns No value.
   */
  onTextMessageEndEvent?: () => void;
  /**
   * Receives the start of a scripted executing step.
   *
   * @param args - Tool-call start event wrapper.
   * @returns No value.
   */
  onToolCallStartEvent?: (args: {
    /** Tool-call start event payload. */
    event: {
      /** Generated call identifier based on the scripted step ID. */
      toolCallId: string;
      /** Tool name derived from the scripted step label. */
      toolCallName: string;
    };
  }) => void;
  /**
   * Receives completion of a scripted executing step.
   *
   * @param args - Tool-call completion payload.
   * @returns No value.
   */
  onToolCallEndEvent?: (args: {
    /** Tool name derived from the scripted step label. */
    toolCallName: string;
  }) => void;
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
  private messages: Array<{
    /** Message identifier. */
    id: string;
    /** Message role used to locate the latest user input. */
    role: string;
    /** Message text. */
    content: string;
  }> = [];
  private readonly chunkDelayMs: number;

  /** Label shown in the UI to identify the connection. */
  readonly connectionLabel = 'Mock Testing Agent (local)';

  /**
   * Creates a Holmes-compatible adapter over a scripted agent.
   *
   * The speed multiplier defaults to `0.5`, is passed to the scripted agent,
   * and also sets answer-chunk delay to ten times the multiplier in milliseconds.
   *
   * @param options - Optional scripted sessions, fallback answer, and replay speed.
   */
  constructor(options?: ScriptedAgentOptions) {
    const speedMultiplier = options?.speedMultiplier ?? 0.5;
    this.chunkDelayMs = 10 * speedMultiplier;
    this.mockAgent = createScriptedAgent({
      speedMultiplier: 0.5, // fast but visible
      ...options,
    });
  }

  /**
   * Subscribes to emitted agent events.
   *
   * Unsubscribing removes every registration of the same subscriber object.
   *
   * @param subscriber - Optional event callbacks to register.
   * @returns Handle for removing the subscriber.
   */
  subscribe(subscriber: AgentSubscriber): {
    /**
     * Removes every matching subscriber-object registration.
     *
     * @returns No value.
     */
    unsubscribe: () => void;
  } {
    this.subscribers.push(subscriber);
    return {
      /**
       * Removes every matching subscriber-object registration.
       *
       * @returns No value.
       */
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(s => s !== subscriber);
      },
    };
  }

  /**
   * Adds a message used to select the next scripted question.
   *
   * @param message - Message appended by reference in arrival order.
   * @returns No value.
   */
  addMessage(message: {
    /** Message identifier. */
    id: string;
    /** Message role; the latest `user` role supplies the question. */
    role: string;
    /** Message text. */
    content: string;
  }): void {
    this.messages.push(message);
  }

  /**
   * Run the agent — replays a mock session as ag-ui events.
   *
   * Translates mock agent phases/steps into the event callbacks that the
   * UI's `handleToggleAgentMode` subscriber uses to build the chat UI.
   *
   * Only the latest step in each progress callback is translated. Running
   * executing steps labeled `Running ...` start tool calls, other running steps
   * become thinking text, and completed executing steps end tool calls. The
   * final answer is streamed in 50-character chunks.
   *
   * Start callbacks run before error containment. Errors after that point emit
   * run-error and finalization callbacks; subscriber callback failures may propagate.
   *
   * @param _ - Ignored run parameters accepted for Holmes API compatibility.
   * @returns No value after scripted events and finalization are emitted.
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

  /**
   * Leaves the current scripted run unchanged.
   *
   * @returns No value.
   */
  abortRun(): void {
    // No-op
  }

  /**
   * Clears accumulated messages without resetting subscribers or scripted-agent state.
   *
   * @returns No value.
   */
  resetThread(): void {
    this.messages = [];
  }

  /**
   * Gets the constant mock thread identifier.
   *
   * @returns Always `mock-thread`.
   */
  getThreadId(): string {
    return 'mock-thread';
  }
}

/**
 * Splits text at fixed JavaScript string-character offsets.
 *
 * @param text - Text to split.
 * @param size - Maximum chunk length; callers provide a positive value.
 * @returns Sequential chunks, with a possibly shorter final chunk.
 */
function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Delays answer streaming.
 *
 * @param ms - Delay in milliseconds.
 * @returns No value after the timer fires.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
