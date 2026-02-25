import { HttpAgent } from '@ag-ui/client';
import type { AgentSubscriber, RunAgentParameters } from '@ag-ui/client';

/**
 * Default base URL for the Holmes ag-ui server.
 * The experimental server (server-agui.py) runs on this port.
 * Change this if your ag-ui server runs on a different host/port.
 */
export const DEFAULT_AGUI_URL = 'http://localhost:5050';

/**
 * HolmesAgent wraps @ag-ui/client's HttpAgent to communicate directly with the
 * Holmes ag-ui server via SSE.
 *
 * The agent connects to a running Holmes ag-ui server
 * (e.g. `http://localhost:5050/api/agui/chat`) and supports:
 * - Streaming text responses via SSE
 * - Tool call execution with streamed arguments
 * - Conversation history management
 * - Error handling and abort
 *
 * Usage:
 *   const agent = new HolmesAgent('http://localhost:5050');
 *   agent.subscribe({
 *     onTextMessageContentEvent: ({ textMessageBuffer }) => { ... },
 *     onToolCallEndEvent: ({ toolCallName, toolCallArgs }) => { ... },
 *   });
 *   agent.addMessage({ id: '1', role: 'user', content: 'What pods are failing?' });
 *   await agent.runAgent();
 */
export class HolmesAgent {
  private agent: HttpAgent;
  private baseUrl: string;
  private subscriberList: AgentSubscriber[] = [];

  constructor(baseUrl: string = DEFAULT_AGUI_URL) {
    this.baseUrl = baseUrl;
    this.agent = this.createAgent();
  }

  private createAgent(): HttpAgent {
    const url = `${this.baseUrl}/api/agui/chat`;
    console.log('[HolmesAgent] Creating HttpAgent with URL:', url);
    return new HttpAgent({
      url,
      threadId: `thread-${Date.now()}`,
      headers: { 'Content-Type': 'application/json' },
      debug: true,
    });
  }

  /**
   * A human-readable label for the current connection.
   */
  get connectionLabel(): string {
    return this.baseUrl;
  }

  /**
   * Subscribe to agent events (text messages, tool calls, errors, etc.).
   * Returns an object with an unsubscribe method.
   *
   * Key subscriber callbacks:
   * - onRunStartedEvent / onRunFinishedEvent / onRunErrorEvent
   * - onTextMessageStartEvent / onTextMessageContentEvent (with textMessageBuffer) / onTextMessageEndEvent
   * - onToolCallStartEvent / onToolCallArgsEvent (with toolCallBuffer) / onToolCallEndEvent (with toolCallName, toolCallArgs)
   */
  subscribe(subscriber: AgentSubscriber): { unsubscribe: () => void } {
    this.subscriberList.push(subscriber);
    const sub = this.agent.subscribe(subscriber);
    return {
      unsubscribe: () => {
        sub.unsubscribe();
        this.subscriberList = this.subscriberList.filter(s => s !== subscriber);
      },
    };
  }

  /**
   * Add a message to the agent's conversation history.
   * Call before runAgent() to include the latest user message.
   */
  addMessage(message: { id: string; role: string; content: string }): void {
    // Cast needed because @ag-ui/core Message is a Zod discriminated union by role
    this.agent.addMessage(message as any);
  }

  /**
   * Run the agent with optional tools and context.
   * Sends accumulated messages to Holmes and streams back ag-ui events
   * to all registered subscribers.
   */
  async runAgent(params?: RunAgentParameters): Promise<void> {
    await this.agent.runAgent({
      runId: params?.runId || `run-${Date.now()}`,
      tools: params?.tools,
      context: params?.context,
      forwardedProps: params?.forwardedProps,
    });
  }

  /**
   * Abort the currently running agent request.
   */
  abortRun(): void {
    this.agent.abortRun();
  }

  /**
   * Reset the conversation by creating a new agent instance with a fresh thread.
   * All existing subscribers are automatically re-attached.
   */
  resetThread(): void {
    this.agent = this.createAgent();
    for (const sub of this.subscriberList) {
      this.agent.subscribe(sub);
    }
  }

  /**
   * Get the current thread ID.
   */
  getThreadId(): string {
    return this.agent.threadId;
  }
}
