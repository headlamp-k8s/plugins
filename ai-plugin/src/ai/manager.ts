export interface Prompt {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  error?: boolean;
  toolCalls?: any[];
  toolCallId?: string;
  name?: string; // Added for tool responses
  contentFilterError?: boolean; // Add this new flag
}

export default abstract class AIManager {
  history: Prompt[] = [];
  contexts: { [key: string]: any } = {};

  abstract userSend(message: string): Promise<Prompt>;

  // Required method to process tool responses
  async processToolResponses(): Promise<Prompt> {
    // Base implementation returns a default message
    // Should be overridden by specific AI managers
    const response: Prompt = {
      role: 'assistant',
      content: 'Tool response processed.',
    };
    this.history.push(response);
    return response;
  }

  // Optional method to be implemented by specific AI managers
  configureTools?(
    tools: any[],
    handler: (
      url: string,
      method: string,
      body?: string,
      toolCallId?: string,
      pendingPrompt?: Prompt
    ) => Promise<any>
  ): void;

  addContext(id: string, context: any) {
    console.log('Adding context:', { id, context });
    this.contexts[id] = context;
  }

  reset() {
    this.history = [];
    this.contexts = {};
  }

  getPromptSuggestions(): string[] {
    // Return default suggestions based on contexts
    const suggestions = [
      'What is happening in my cluster?',
      'Why is this resource in error state?',
    ];

    if (this.contexts.resourceDetails) {
      suggestions.push('Explain what this resource does');
    }

    if (this.contexts.clusterWarnings) {
      suggestions.push('Analyze these warnings and suggest fixes');
    }

    return suggestions;
  }
}
