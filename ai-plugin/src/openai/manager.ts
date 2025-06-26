import { OpenAI } from 'openai';
import { AzureOpenAI } from 'openai/index';
import AIManager, { Prompt } from '../ai/manager';

type Tool = {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: object;
  };
};

export default class OpenAIManager extends AIManager {
  client: OpenAI;
  model: string;
  endpoint?: string;
  deploymentName?: string;
  tools: Tool[] = [];
  toolHandler:
    | ((
        url: string,
        method: string,
        body?: string,
        toolCallId?: string,
        pendingPrompt?: Prompt
      ) => Promise<any>)
    | null = null;

  constructor(apiKey: string, model: string, endpoint?: string, deploymentName?: string) {
    super();

    const options: any = {
      apiKey: apiKey,
    };

    // Allow in browser for demo purposes
    options.dangerouslyAllowBrowser = true;
    if (endpoint && deploymentName) {
      // this is Azure OpenAI client
      this.client = new AzureOpenAI({
        endpoint,
        apiKey,
        deploymentName,
        model,
        apiVersion: '2025-01-01-preview',
        dangerouslyAllowBrowser: true,
      });
    } else {
      this.client = new OpenAI(options);
    }
    this.model = model;
    this.endpoint = endpoint;
    this.deploymentName = deploymentName;
  }

  configureTools(
    tools: Tool[],
    handler: (
      url: string,
      method: string,
      body?: string,
      toolCallId?: string,
      pendingPrompt?: Prompt
    ) => Promise<any>
  ) {
    this.tools = tools;
    this.toolHandler = handler;
  }

  async userSend(message: string): Promise<Prompt> {
    const prompt: Prompt = { role: 'user', content: message };
    this.history.push(prompt);
    console.log('User message:', message);

    try {
      const messages = this.constructMessages();

      const params: any = {
        messages,
        model: this.model,
        stream: false,
      };

      // Add tools if configured
      if (this.tools.length > 0) {
        params.tools = this.tools;
      }

      const response = await this.client.chat.completions.create(params);
      const responseContent = response.choices[0].message;

      // Check for content filtering flags
      if (
        response.choices[0].finish_reason === 'content_filter' ||
        !!response.choices[0].content_filter_results?.filtered
      ) {
        const errorPrompt: Prompt = {
          role: 'assistant',
          content:
            'Your request was blocked by content filters. Please focus only on Kubernetes-related questions.',
          contentFilterError: true,
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

      // Handle tool calls - similar to the example
      if (responseContent.tool_calls && responseContent.tool_calls.length > 0) {
        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: responseContent.content || '',
          toolCalls: responseContent.tool_calls,
        };
        this.history.push(assistantPrompt);

        // Process tool calls
        for (const toolCall of responseContent.tool_calls) {
          try {
            let response = null;

            if (toolCall.function.name === 'http_request' && this.toolHandler) {
              const args = JSON.parse(toolCall.function.arguments);

              // For GET requests, call handler immediately
              if (args.method.toUpperCase() === 'GET') {
                response = await this.toolHandler(args.url, args.method, args.body);

                // Add tool response to history
                this.history.push({
                  role: 'tool',
                  content: typeof response === 'string' ? response : JSON.stringify(response),
                  toolCallId: toolCall.id,
                  name: toolCall.function.name,
                });
              } else {
                // For non-GET methods, just call handler which will show confirmation dialog
                // and return a pending status
                await this.toolHandler(
                  args.url,
                  args.method,
                  args.body,
                  toolCall.id,
                  assistantPrompt
                );
                // Skip adding response now - it will be added after confirmation
                continue;
              }
            }
          } catch (error) {
            console.error(`Error handling tool ${toolCall.function.name}:`, error);
            this.history.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: error.message || 'Tool execution error',
              }),
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }

        // Only process follow-up for GET requests
        if (
          responseContent.tool_calls.every(
            tc => JSON.parse(tc.function.arguments).method.toUpperCase() === 'GET'
          )
        ) {
          return await this.processToolResponses();
        }

        return assistantPrompt;
      }

      // Handle normal response
      const assistantPrompt: Prompt = {
        role: 'assistant',
        content: responseContent.content || '',
      };
      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error('Error calling OpenAI:', error);

      // Check if this is a content filter error
      if (error.name === 'ContentFilterError' || error.message?.includes('content_filter')) {
        const errorPrompt: Prompt = {
          role: 'assistant',
          content:
            'Your request was blocked by content filters. Please focus only on Kubernetes administration tasks.',
          contentFilterError: true,
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

      // Handle other errors
      const errorPrompt: Prompt = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  public async processToolResponses(): Promise<Prompt> {
    try {
      const messages = this.constructMessages();

      const params: any = {
        messages,
        model: this.model,
        stream: false,
      };

      if (this.tools.length > 0) {
        params.tools = this.tools;
      }

      const response = await this.client.chat.completions.create(params);
      const responseContent = response.choices[0].message;

      // Check for content filtering in follow-up response
      const hasContentFilter = response.choices[0].finish_reason === 'content_filter';
      const hasFilteredContent = !!response.choices[0].content_filter_results?.filtered;

      if (hasContentFilter || hasFilteredContent) {
        const errorPrompt: Prompt = {
          role: 'assistant',
          content:
            'This response was blocked by content filters. Please focus only on Kubernetes-related topics.',
          contentFilterError: true,
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

      const assistantPrompt: Prompt = {
        role: 'assistant',
        content: responseContent.content || '',
        toolCalls: responseContent.tool_calls,
      };

      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error('Error processing tool responses:', error);

      // Check for content filter errors
      if (
        error.name === 'ContentFilterError' ||
        error.message?.includes('content_filter') ||
        error.message?.includes('content filter')
      ) {
        const errorPrompt: Prompt = {
          role: 'assistant',
          content:
            'This response was blocked by content filters. Please focus only on Kubernetes administration tasks.',
          contentFilterError: true,
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

      const errorPrompt: Prompt = {
        role: 'assistant',
        content: 'Sorry, there was an error processing the tool responses.',
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  private constructMessages() {
    // Build messages including system context and history
    const messages = [];

    // Create system message with context
    let systemContent = `You are a Kubernetes assistant. Help with analyzing Kubernetes resources and providing explanations.
        When you provide YAML examples, format them clearly with proper code blocks.
        Always offer to apply resources through the interface rather than suggesting kubectl commands.`;

    if (this.currentContext) {
      systemContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }

    messages.push({
      role: 'system',
      content: systemContent,
    });

    // Add conversation history
    for (const message of this.history) {
      if (message.role === 'tool' && message.toolCallId) {
        messages.push({
          role: 'tool',
          tool_call_id: message.toolCallId,
          content: message.content,
        });
      } else if (message.role === 'assistant' && message.toolCalls) {
        messages.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.toolCalls,
        });
      } else {
        messages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    return messages;
  }

  // Format context for the AI
  private formatContext() {
    return this.currentContext || '';
  }

  // Other methods remain unchanged
  // ...
}
