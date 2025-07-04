export type Prompt = {
  role: string;
  content: string;
  toolCalls?: any[];
  toolCallId?: string;
  name?: string;
  error?: boolean;
  contentFilterError?: boolean;
  alreadyDisplayed?: boolean;
};

export default abstract class AIManager {
  history: Prompt[] = [];
  currentContext: string = '';

  setContext(contextDescription: string) {
    this.currentContext = contextDescription;
  }

  addContextualInfo(info: string) {
    if (this.currentContext) {
      this.currentContext += '\n' + info;
    } else {
      this.currentContext = info;
    }
  }

  reset() {
    this.history = [];
    this.currentContext = '';
  }

  // Abstract method that must be implemented
  abstract userSend(message: string): Promise<Prompt>;

  // Changed from protected to public to allow external calling
  abstract processToolResponses(): Promise<Prompt>;

  // Define configureTools method for tool configuration
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

  getPromptSuggestions(): string[] {
    return [
      'Explain the resources in this list',
      'What are the most critical issues to fix?',
      'Show me a simple pod YAML example',
      'How do I create a LoadBalancer service?',
      'Check for potential security issues',
    ];
  }
}
