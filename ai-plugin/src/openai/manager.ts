import AIManager from "../ai/manager";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

export interface Prompt {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

class OpenAIManager extends AIManager<OpenAIClient> {
  openApiKey = '';
  gptModel = '';

  constructor() {
    super();
    this.gptModel = localStorage.getItem('gptModel');
    const openApiName = localStorage.getItem('openApiName');
    const currentOpenApiKey = localStorage.getItem('openApiKey');

    if (!this.client || currentOpenApiKey !== this.openApiKey) {
      this.openApiKey = currentOpenApiKey;
      this.client = new OpenAIClient(
        `https://${openApiName}.openai.azure.com/`,
        new AzureKeyCredential(this.openApiKey)
      );
    }
  }

  async send(messages: Prompt[]) {
    const events = await this.client.listChatCompletions(this.gptModel, messages);
    let stream = '';
    try {
      let i = 0
      for await (const event of events) {
        for (const choice of event.choices) {
          const delta = choice.delta?.content;
          if (delta !== undefined) {
            stream += delta;
          }
        }
      }
    } catch (error) {
      console.error('AIPlugin: Error processing prompt response:', error);
      return {
        content: error.message,
        error: true,
        isPartial: false,
      };
    }

    return {
      content: stream,
      error: false,
      isPartial: false,
    };
  }
}

export default OpenAIManager;
