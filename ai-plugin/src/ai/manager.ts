import { basePrompt } from "./prompts";

export interface Prompt {
  content: string;
  role: 'user' | 'assistant' | 'system' | 'context';
  id?: string;
}

export interface PromptResponse {
  content: string;
  error: boolean;
  isPartial: boolean;
  [key: string]: any;
}

export interface ContextMap {
  [id: string]: {
    [key: string]: any;
  }
}

abstract class AIManager<T = unknown> {
  private static _client: unknown;
  protected basePrompt: string;
  protected _history: Prompt[] = [];
  protected _context: ContextMap = {};
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
    this._context = {};

    // Makes it easier to update the user visible start index.
    this._realHistoryStartIndex = this._history.length;
  }

  getContext(id: string = '') {
    if (id === '') {
      return this._context;
    }

    return this._context[id];
  }

  addContext(id: string, content: ContextMap[string]) {
    if (id === '') {
      throw new Error('Context ID cannot be empty');
    }

    this._context[id] = {content}

    // Check whether to replace or to add the context
    // Go from the end until the start of the history, if a context is found with the
    // same ID, before any system message, replace it.
    let shouldReplace = 0;
    let indexToAdd = this._history.length;
    for (let i = this._history.length - 1; i >= this._realHistoryStartIndex; i--) {
      if (this._history[i].id === id) {
        indexToAdd = i;
        shouldReplace = 1;
        break;
      }
      if (this._history[i].role === 'system') {
        break;
      }
    }
const prevHistory = [...this._history]
console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>HISTORY_FROM_CONTEXT', {id}, indexToAdd, prevHistory, [...this._history])
    this._history.splice(indexToAdd, shouldReplace, {
      content: `C:${id}=${JSON.stringify(content)}`,
      role: 'context',
      id
    });

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>HISTORY_FROM_CONTEXT1', {id}, indexToAdd, prevHistory, [...this._history])
  }

  async userSend(prompt: string) {
    console.debug('>>>>>>>>>>>>>>>>>>>>>>>>>AI_HISTORY', [...this._history])

    this._history.push({
      content: `Q:${prompt}`,
      role: 'user'
    })

    const promptResp = await this.send(
      // Keep only the content + role from the history messages.
      this._history.map((message) => ({
        content: message.content,
        role: message.role === 'context' ? 'system' : message.role
      }))
    );

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