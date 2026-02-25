import { HttpAgent } from '@ag-ui/client';

/**
 * Default base URL for the Holmes ag-ui server.
 */
export const DEFAULT_AGUI_URL = 'http://localhost:5050';

/**
 * HolmesAgent wraps @ag-ui/client's HttpAgent to communicate with the
 * Holmes ag-ui server via SSE.
 *
 * Usage:
 *   const agent = new HolmesAgent('http://localhost:5050');
 *   agent.subscribe({ onTextMessageContentEvent: ... });
 *   agent.addMessage({ id: '1', role: 'user', content: 'What pods are failing?' });
 *   await agent.runAgent({ runId: 'run-1' });
 */
export class HolmesAgent {
  private agent: HttpAgent;
  private baseUrl: string;
  private threadId: string;
  private subscriberList: any[] = [];

  // Buffers for accumulating streamed content (since the library's buffers
  // can be unreliable depending on version)
  private toolArgsBuffers: Map<string, string> = new Map();
  private toolNames: Map<string, string> = new Map();

  constructor(baseUrl: string = DEFAULT_AGUI_URL) {
    this.baseUrl = baseUrl;
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
  }

  private createAgent(): HttpAgent {
    const url = `${this.baseUrl}/api/agui/chat`;
    console.log('[HolmesAgent] Creating HttpAgent with URL:', url);
    return new HttpAgent({
      url,
      threadId: this.threadId,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * A human-readable label for the current connection.
   */
  get connectionLabel(): string {
    return this.baseUrl;
  }

  /**
   * Subscribe to agent events.
   *
   * Callbacks:
   * - onRunStartedEvent / onRunFinishedEvent / onRunErrorEvent
   * - onTextMessageStartEvent / onTextMessageContentEvent / onTextMessageEndEvent
   * - onToolCallStartEvent / onToolCallArgsEvent / onToolCallEndEvent
   */
  subscribe(subscriber: any): { unsubscribe: () => void } {
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
   */
  addMessage(message: { id: string; role: string; content: string }): void {
    this.agent.addMessage(message as any);
  }

  /**
   * Run the agent — sends accumulated messages to Holmes and streams back
   * ag-ui events to all registered subscribers.
   */
  async runAgent(params?: {
    runId?: string;
    tools?: any[];
    context?: any[];
    forwardedProps?: Record<string, any>;
  }): Promise<void> {
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
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
    for (const sub of this.subscriberList) {
      this.agent.subscribe(sub);
    }
    this.toolArgsBuffers.clear();
    this.toolNames.clear();
  }

  /**
   * Get the current thread ID.
   */
  getThreadId(): string {
    return this.threadId;
  }
}
