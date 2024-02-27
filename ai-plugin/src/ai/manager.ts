export interface Prompt {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  error?: boolean;
  toolCalls?: any[];
  toolCallId?: string;
}

export default abstract class AIManager {
  history: Prompt[] = [];
  contexts: { [key: string]: any } = {};

  abstract userSend(message: string): Promise<Prompt>;

  // Optional method to be implemented by specific AI managers
  configureTools?(
    tools: any[],
    handler: (url: string, method: string, body?: string) => Promise<any>
  ): void;

  addContext(id: string, context: any) {
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
