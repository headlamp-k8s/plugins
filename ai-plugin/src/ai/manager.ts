import { basePrompt } from "./prompts";

export interface Prompt {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

export interface PromptResponse {
  content: string;
  error: boolean;
  isPartial: boolean;
  [key: string]: any;
}

abstract class AIManager<T = unknown> {
  private static _client: unknown;
  protected basePrompt: string;
  protected _history: Prompt[] = [];
  protected _context: string;
  private _realHistoryStartIndex = 0;

  constructor() {
    // if (!this._class.client) {
    //   throw new Error('Client not initialized');
    // }

    this.basePrompt = basePrompt;
    this.reset();
  }

  protected get _class() {
    return this.constructor as typeof AIManager;
  }

  get client() {
    return this._class._client as T;
  }

  set client(client: T) {
    this._class._client = client;
  }

  get context() {
    return this._context;
  }

  get history() {
    return this._history
      // Avoid sending the base training prompts.
      .slice(this._realHistoryStartIndex)
      // System messages are not shown to the user.
      .filter((message) => message.role !== 'system')
      // Discard the Q: prefix
      .map((message) => {
        if (message.role === 'user') {
          return {
            ...message,
            content: message.content.slice(2),
          };
        }
        return message;
      });
  }

  reset() {
    this._history = [];
    this._history.push({
      content: this.basePrompt,
      role: 'system'
    });

    // Makes it easier to update the user visible start index.
    this._realHistoryStartIndex = this._history.length;
  }

  set context(context: string) {
    this._context = context;
    console.debug('>>>>>>>>>>>>>>>>>>>>>>>>>ctx', context)
    this._history.push({
      content: `C:${context}`,
      role: 'system'
    });
  }

  async userSend(prompt: string) {
    this._history.push({
      content: `Q:${prompt}`,
      role: 'user'
    })

    const promptResp = await this.send(this._history);
    if (!promptResp.error) {
      this._history.push({
        content: promptResp.content,
        role: 'assistant'
      });
    }

    return promptResp;
  }

  abstract send(messages: Prompt[]): Promise<PromptResponse>;
}

export default AIManager;