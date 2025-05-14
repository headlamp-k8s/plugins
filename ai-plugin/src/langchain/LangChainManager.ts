import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  FunctionMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOpenAI } from '@langchain/openai';
import { AzureChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import AIManager, { Prompt } from '../ai/manager';

export default class LangChainManager extends AIManager {
  private model: BaseChatModel;
  private boundModel: BaseChatModel | null = null;
  private providerId: string;
  private toolHandler:
    | ((
        url: string,
        method: string,
        body?: string,
        toolCallId?: string,
        pendingPrompt?: Prompt
      ) => Promise<any>)
    | null = null;

  constructor(providerId: string, config: Record<string, any>) {
    super();
    this.providerId = providerId;
    console.log(`Creating LangChainManager with provider: ${providerId}`, config);
    this.model = this.createModel(providerId, config);
  }

  private createModel(providerId: string, config: Record<string, any>): BaseChatModel {
    try {
      console.log(`Initializing ${providerId} model with config:`, config);
      switch (providerId) {
        case 'openai':
          if (!config.apiKey) {
            throw new Error('API key is required for OpenAI');
          }
          return new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'azure':
          if (!config.apiKey || !config.endpoint || !config.deploymentName) {
            throw new Error('Incomplete Azure OpenAI configuration');
          }
          return new AzureChatOpenAI({
            azureOpenAIEndpoint: config.endpoint.replace(/\/+\$/, ''),
            azureOpenAIApiKey: config.apiKey,
            azureOpenAIApiDeploymentName: config.deploymentName,
            azureOpenAIApiVersion: '2024-12-01-preview',
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'anthropic':
          if (!config.apiKey) {
            throw new Error('API key is required for Anthropic');
          }
          return new ChatAnthropic({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'mistral':
          if (!config.apiKey) {
            throw new Error('API key is required for Mistral AI');
          }
          return new ChatMistralAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        case 'gemini': {
          if (!config.apiKey) {
            throw new Error('API key is required for Google Gemini');
          }
          if (
            !['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'].includes(
              config.model
            )
          ) {
            throw new Error(`Invalid Gemini model: ${config.model}`);
          }
          return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            modelName: config.model,
            dangerouslyAllowBrowser: true,
          });
        }
        case 'local':
          if (!config.baseUrl) {
            throw new Error('Base URL is required for local models');
          }
          return new ChatOllama({
            baseUrl: config.baseUrl,
            model: config.model,
            dangerouslyAllowBrowser: true,
          });
        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }
    } catch (error) {
      console.error(`Error creating model for provider ${providerId}:`, error);
      throw error;
    }
  }

  configureTools(
    tools: any[],
    handler: (
      url: string,
      method: string,
      body?: string,
      toolCallId?: string,
      pendingPrompt?: Prompt
    ) => Promise<any>
  ): void {
    // Store the handlers
    this.toolHandler = handler;

    const kubernetesApiSchema = z.object({
      url: z
        .string()
        .describe('URL to request, e.g., /api/v1/pods or /api/v1/namespaces/default/pods/pod-name'),
      method: z.string().describe('HTTP method: GET, POST, PATCH, DELETE'),
      body: z.string().optional().describe('Optional HTTP body'),
    });

    // Create tools array
    const toolsArray = [];

    // API Request tool
    const kubeTool = tool(
      async ({ url, method, body }) => {
        try {
          if (!this.toolHandler) {
            throw new Error('Tool handler is not configured');
          }

          console.log(`Processing kubernetes_api_request tool: ${method} ${url}`);

          // This is our placeholder response for non-GET requests - they will be prompted later
          if (method.toUpperCase() !== 'GET') {
            return JSON.stringify({
              status: 'pending_confirmation',
              message: `This ${method.toUpperCase()} request requires confirmation before proceeding.`,
              request: {
                method: method.toUpperCase(),
                url: url,
                body: body || null,
              },
              // Include full resource info for PATCH requests
              fullResource: method.toUpperCase() === 'PATCH' && body,
            });
          }

          // Only GET requests execute immediately
          const response = await this.toolHandler(url, method, body);

          // Include request metadata with the response
          const enhancedResponse = {
            request: {
              method: method.toUpperCase(),
              url: url,
              body: body || null,
            },
            response: response,
          };

          return JSON.stringify(enhancedResponse);
        } catch (error) {
          console.error('Error in kubeTool:', error);
          return JSON.stringify({
            error: true,
            message: error.message,
            request: {
              method: method.toUpperCase(),
              url: url,
              body: body || null,
            },
          });
        }
      },
      {
        name: 'kubernetes_api_request',
        description:
          'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
        schema: kubernetesApiSchema,
      }
    );
    toolsArray.push(kubeTool);

    try {
      this.boundModel = this.model.bindTools(toolsArray);
    } catch (error) {
      console.error(`Error binding tools to ${this.providerId} model:`, error);
      this.boundModel = this.model;
    }
  }

  private convertPromptsToMessages(prompts: Prompt[]): BaseMessage[] {
    return prompts.map(prompt => {
      switch (prompt.role) {
        case 'system':
          return new SystemMessage(prompt.content);
        case 'user':
          return new HumanMessage(prompt.content);
        case 'assistant':
          return new AIMessage({
            content: prompt.content,
            additional_kwargs:
              this.providerId === 'azure'
                ? {}
                : {
                    tool_calls: prompt.toolCalls || [],
                  },
          });
        case 'tool':
          if (this.providerId === 'azure') {
            return new AIMessage(`Tool Response (${prompt.toolCallId}): ${prompt.content}`);
          } else {
            return new FunctionMessage({
              content: prompt.content,
              name: prompt.name || 'kubernetes_api_request',
              tool_call_id: prompt.toolCallId,
            });
          }
        default:
          return new ChatMessage(prompt.content, prompt.role);
      }
    });
  }

  private formatContext() {
    return Object.entries(this.contexts)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n\n');
  }

  async userSend(message: string): Promise<Prompt> {
    console.log('User message sent:', message);
    const userPrompt: Prompt = { role: 'user', content: message };
    this.history.push(userPrompt);

    const systemMessage = new SystemMessage(
      `You are a Kubernetes assistant. ${this.formatContext()}`
    );

    const messages = this.convertPromptsToMessages(this.history);
    messages.unshift(systemMessage);
    const modelToUse = this.boundModel || this.model;

    try {
      const response = await modelToUse.invoke(messages);
      console.log('Model response received:', response);

      if (response.tool_calls?.length) {
        const toolCalls = response.tool_calls.map(tc => ({
          type: 'function',
          id: tc.id,
          function: {
            name: tc.name || 'kubernetes_api_request',
            arguments: JSON.stringify(tc.args || {}),
          },
        }));

        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: response.content || '',
          toolCalls: toolCalls,
        };
        this.history.push(assistantPrompt);

        // Process each tool call
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Processing tool call:', args);

          try {
            // Execute the tool call
            const result = await this.toolHandler?.(
              args.url,
              args.method,
              args.body,
              toolCall.id,
              assistantPrompt
            );

            // Don't add tool response for non-GET methods - they'll be handled by confirmation dialog
            if (args.method.toUpperCase() !== 'GET') {
              continue;
            }

            // Add response to history for GET requests
            this.history.push({
              role: 'tool',
              content: typeof result === 'string' ? result : JSON.stringify(result),
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          } catch (error) {
            console.error('Error executing tool call:', error);
            this.history.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: error.message,
              }),
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }

        // Only process follow-up for GET requests
        if (
          toolCalls.every(tc => {
            const args = JSON.parse(tc.function.arguments);
            return args.method.toUpperCase() === 'GET';
          })
        ) {
          return await this.processToolResponses();
        }

        return assistantPrompt;
      }

      // Handle regular response
      const assistantPrompt: Prompt = {
        role: 'assistant',
        content: response.content || '',
      };
      this.history.push(assistantPrompt);
      return assistantPrompt;
    } catch (error) {
      console.error('Error in userSend:', error);
      const errorPrompt: Prompt = {
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${error.message}`,
        error: true,
      };
      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  // Change from 'protected' to 'public' to match the base class
  public async processToolResponses(): Promise<Prompt> {
    console.log('Processing tool responses...');

    const systemMessage = new SystemMessage(
      `You are a Kubernetes assistant. ${this.formatContext()}`
    );

    const messages: BaseMessage[] = [systemMessage];

    // Track tool response sizes
    let totalResponseSize = 0;
    const MAX_RESPONSE_SIZE = 500000; // ~500KB limit for total responses

    try {
      // Validate and sanitize tool responses before adding to messages
      for (const prompt of this.history) {
        if (prompt.role === 'tool' && prompt.toolCallId) {
          // Validate the tool response
          if (!prompt.content) {
            // Use a safe placeholder instead of empty content
            continue;
          }
          if (!prompt.content || typeof prompt.content !== 'string') {
            console.warn(`Invalid tool response format for ${prompt.toolCallId}`, prompt);
            // Use a safe placeholder instead of potentially unsafe content
            prompt.content = JSON.stringify({
              error: true,
              message: 'Invalid tool response format',
            });
          }

          // Check response size to prevent memory issues
          const responseSize = prompt.content.length;
          totalResponseSize += responseSize;

          if (totalResponseSize > MAX_RESPONSE_SIZE) {
            console.warn(
              `Tool response size exceeds limit (${totalResponseSize}/${MAX_RESPONSE_SIZE})`
            );
            // Truncate and indicate truncation
            prompt.content =
              prompt.content.substring(0, 100) +
              `... [Response truncated, exceeded size limit of ${MAX_RESPONSE_SIZE} bytes]`;
          }

          // Sanitize response content (basic HTML/script tag removal)
          // This helps prevent potential XSS or script injection if displayed in UI
          const sanitizedContent = this.sanitizeContent(prompt.content);

          console.log('Adding validated tool response to messages:', {
            toolCallId: prompt.toolCallId,
            contentLength: sanitizedContent.length,
            name: prompt.name,
          });

          if (this.providerId === 'azure') {
            messages.push(
              new AIMessage(`Tool Response (${prompt.toolCallId}): ${sanitizedContent}`)
            );
          } else {
            messages.push(
              new FunctionMessage({
                name: prompt.name || 'kubernetes_api_request',
                content: sanitizedContent,
                tool_call_id: prompt.toolCallId,
              })
            );
          }
        } else {
          console.log('Adding non-tool prompt to messages:', {
            role: prompt.role,
            contentLength: prompt.content?.length || 0,
          });
          messages.push(...this.convertPromptsToMessages([prompt]));
        }
      }

      const modelToUse = this.boundModel || this.model;
      console.log(
        'Invoking model with messages:',
        messages.map(m => ({
          type: m.constructor.name,
          // Safely access content without calling _getContent
          length:
            typeof m.content === 'string'
              ? m.content.length
              : m.content
              ? JSON.stringify(m.content).length
              : 0,
        }))
      );

      try {
        // Add timeout for model invocation
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Model invocation timed out')), 60000); // 60 second timeout
        });

        const responsePromise = modelToUse.invoke(messages);
        let response = await Promise.race([responsePromise, timeoutPromise]);

        // Track usage after tool processing with consistent provider naming
        let providerName = 'AI Service';
        let estimatedTokens = 0;

        // Estimate tokens based on messages and response length
        const messagesLength = messages.reduce(
          (acc, msg) => acc + (typeof msg.content === 'string' ? msg.content.length : 0),
          0
        );
        const outputLength = response.content?.length || 0;
        estimatedTokens = Math.ceil((messagesLength + outputLength) / 4);

        switch (this.providerId) {
          case 'openai':
            providerName = 'OpenAI';
            break;
          case 'azure':
            providerName = 'Azure OpenAI'; // Ensure consistent naming
            break;
          case 'anthropic':
            providerName = 'Anthropic';
            break;
          case 'local':
            providerName = 'Local Model';
            break;
        }

        console.log(`${providerName} - Estimated tokens: ${estimatedTokens}`);

        console.log('Model response received:', {
          content:
            response.content?.substring(0, 100) + (response.content?.length > 100 ? '...' : ''),
          toolCallsCount: response.tool_calls?.length || 0,
        });

        // Add this to the formatResponse method after getting a tool response
        if (response && typeof response === 'string' && response.includes('"items":')) {
          try {
            // This looks like a list response - add a note not to suggest kubectl
            const enhancedResponse = {
              ...JSON.parse(response),
              note: 'Remember to use the kubernetes_api_request tool for all operations rather than suggesting kubectl commands.',
            };
            response = JSON.stringify(enhancedResponse);
          } catch (e) {
            // Keep original response if parsing fails
          }
        }

        // Analyze the response content to detect if it might be suggesting kubectl
        if (response.content && typeof response.content === 'string') {
          const lowercaseContent = response.content.toLowerCase();

          // Check for kubectl suggestion indicators
          const hasKubectlSuggestion =
            lowercaseContent.includes('kubectl') ||
            lowercaseContent.includes('run the command') ||
            lowercaseContent.includes('command line') ||
            lowercaseContent.includes('terminal') ||
            lowercaseContent.includes('shell');

          // If it looks like kubectl is being suggested, add a corrective system message
          if (hasKubectlSuggestion) {
            this.history.push({
              role: 'system',
              content:
                'REMINDER: Never suggest kubectl or command line tools. Always use the kubernetes_api_request tool or explain UI actions. The user is using a web dashboard and cannot access the command line.',
            });

            // Request a correction from the model
            const correctionPrompt = new SystemMessage(
              'Your last response suggested using kubectl or command line, which is not available to the user. Please revise your response to use the kubernetes_api_request tool instead.'
            );

            messages.push(correctionPrompt);

            // Try to get a corrected response
            try {
              const correctedResponse = await modelToUse.invoke(messages);
              response = correctedResponse; // Replace with the corrected response
            } catch (error) {
              console.error('Error getting corrected response:', error);
              // Continue with original response if correction fails
            }
          }
        }

        const assistantPrompt: Prompt = {
          role: 'assistant',
          content: response.content || '',
          toolCalls:
            response.tool_calls?.map(tc => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.name || 'kubernetes_api_request',
                arguments: JSON.stringify(tc.args || {}),
              },
            })) || [],
        };

        console.log('Assistant prompt created from response');

        this.history.push(assistantPrompt);
        return assistantPrompt;
      } catch (error) {
        console.error('Error during model invocation in processToolResponses:', error);

        const errorPrompt: Prompt = {
          role: 'assistant',
          content: `Sorry, there was an error processing the tool responses: ${error.message}`,
          error: true,
        };

        this.history.push(errorPrompt);
        return errorPrompt;
      }
    } catch (error) {
      console.error('Error preparing messages for model in processToolResponses:', error);

      const errorPrompt: Prompt = {
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${error.message}`,
        error: true,
      };

      this.history.push(errorPrompt);
      return errorPrompt;
    }
  }

  // Helper method to sanitize content
  private sanitizeContent(content: string): string {
    if (!content) return '';

    try {
      // If it's JSON, parse and re-stringify to ensure it's valid
      if (
        (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
        (content.trim().startsWith('[') && content.trim().endsWith(']'))
      ) {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed);
      }

      // Basic sanitization for non-JSON content
      // Remove potentially harmful HTML/script tags
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<img[^>]*>/gi, '[IMAGE]');
    } catch (error) {
      console.warn('Error sanitizing content:', error);
      // If sanitization fails, return a safe version
      return typeof content === 'string'
        ? content.substring(0, 5000) // Limit length for safety
        : JSON.stringify({ error: true, message: 'Content could not be sanitized' });
    }
  }
}
