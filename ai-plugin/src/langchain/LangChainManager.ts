import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  FunctionMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { AzureChatOpenAI } from '@langchain/openai';
import sanitizeHtml from 'sanitize-html';
import AIManager, { Prompt } from '../ai/manager';
import { basePrompt } from '../ai/prompts';
import { KubernetesToolContext, ToolManager, ToolResponse } from './tools';

export default class LangChainManager extends AIManager {
  private model: BaseChatModel;
  private boundModel: BaseChatModel | null = null;
  private providerId: string;
  private toolManager: ToolManager;
  private currentAbortController: AbortController | null = null;

  constructor(providerId: string, config: Record<string, any>, enabledTools?: string[]) {
    super();
    this.providerId = providerId;
    const enabledToolIds = enabledTools ?? [];
    console.log(
      'AI Assistant: Initializing with enabled tools:',
      enabledToolIds || 'all tools enabled'
    );
    this.toolManager = new ToolManager(enabledToolIds); // Only enabled tools
    this.model = this.createModel(providerId, config);
  }

  // Method to abort current request
  abort() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  private createModel(providerId: string, config: Record<string, any>): BaseChatModel {
    try {
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
          return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            model: config.model,
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

  configureTools(tools: any[], kubernetesContext: KubernetesToolContext): void {
    // Configure the Kubernetes context for the KubernetesTool
    this.toolManager.configureKubernetesContext(kubernetesContext);

    // Bind all tools to the model
    this.boundModel = this.toolManager.bindToModel(this.model, this.providerId);
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
            additional_kwargs: {},
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

  async userSend(message: string): Promise<Prompt> {
    const userPrompt: Prompt = { role: 'user', content: message };
    this.history.push(userPrompt);

    // Create abort controller for this request
    this.currentAbortController = new AbortController();

    // Create system message with context if available
    let systemPromptContent = basePrompt;
    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    const systemMessage = new SystemMessage(systemPromptContent);

    const messages = this.convertPromptsToMessages(this.history);
    messages.unshift(systemMessage);
    const modelToUse = this.boundModel || this.model;

    try {
      let response;
      if (this.providerId === 'local') {
        const finalMessages = [messages[0], messages[messages.length - 1]];
        response = await modelToUse.invoke(finalMessages, {
          signal: this.currentAbortController.signal,
        });
      } else {
        response = await modelToUse.invoke(messages, {
          signal: this.currentAbortController.signal,
        });
      }

      // Clear abort controller after successful completion
      this.currentAbortController = null;

      if (response.tool_calls?.length) {
        const enabledToolIds = this.toolManager.getToolNames();

        // If no tools are enabled but LLM is returning tool calls, this indicates a bug
        if (enabledToolIds.length === 0) {
          console.warn(
            'LLM returned tool calls but no tools are enabled. This should not happen.',
            {
              toolCalls: response.tool_calls,
              modelUsed: this.boundModel === this.model ? 'original' : 'bound',
            }
          );

          // Treat as regular response since no tools should be available
          const assistantPrompt: Prompt = {
            role: 'assistant',
            content:
              response.content ||
              'I apologize, but I cannot use tools as they have been disabled in your settings.',
          };
          this.history.push(assistantPrompt);
          return assistantPrompt;
        }

        const toolCalls = response.tool_calls.map(tc => ({
          type: 'function',
          id: tc.id,
          function: {
            name: tc.name,
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
        const toolResponses: Array<{ toolCall: any; response: ToolResponse }> = [];

        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);

          try {
            // Execute the tool call using ToolManager
            const toolResponse = await this.toolManager.executeTool(
              toolCall.function.name,
              args,
              toolCall.id,
              assistantPrompt
            );

            toolResponses.push({ toolCall, response: toolResponse });

            // Only add to history if the tool response indicates we should
            if (toolResponse.shouldAddToHistory) {
              this.history.push({
                role: 'tool',
                content: toolResponse.content,
                toolCallId: toolCall.id,
                name: toolCall.function.name,
              });
            }
          } catch (error) {
            console.error('Error executing tool call:', error);

            const errorToolResponse: ToolResponse = {
              content: JSON.stringify({
                error: true,
                message: error.message,
              }),
              shouldAddToHistory: true,
              shouldProcessFollowUp: true,
            };

            toolResponses.push({ toolCall, response: errorToolResponse });

            // ✅ Always add error responses to maintain alignment
            this.history.push({
              role: 'tool',
              content: errorToolResponse.content,
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }

        // Only process follow-up if all tool responses indicate we should
        const shouldProcessFollowUp = toolResponses.every(
          ({ response }) => response.shouldProcessFollowUp
        );

        if (shouldProcessFollowUp) {
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
      // Clear abort controller in case of error
      this.currentAbortController = null;

      console.error('Error in userSend:', error);

      // Handle abort errors
      if (error.message === 'AbortError') {
        const errorPrompt: Prompt = {
          role: 'assistant',
          content: 'Request cancelled.',
          error: true,
        };
        this.history.push(errorPrompt);
        return errorPrompt;
      }

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
    // Check if there are any tool responses in the history
    const hasToolResponses = this.history.some(
      prompt => prompt.role === 'tool' && prompt.toolCallId
    );
    if (!hasToolResponses) {
      // If no tool responses, return the last assistant message
      const lastAssistantMessage = this.history
        .slice()
        .reverse()
        .find(prompt => prompt.role === 'assistant');
      return (
        lastAssistantMessage || {
          role: 'assistant',
          content: 'No tool responses to process.',
        }
      );
    }

    const lastAssistantMessage = this.history
      .slice()
      .reverse()
      .find(prompt => prompt.role === 'assistant' && prompt.toolCalls?.length);

    if (lastAssistantMessage?.toolCalls) {
      const expectedToolCallIds = lastAssistantMessage.toolCalls.map(tc => tc.id);
      const actualToolResponses = this.history.filter(
        prompt => prompt.role === 'tool' && expectedToolCallIds.includes(prompt.toolCallId)
      );

      if (expectedToolCallIds.length !== actualToolResponses.length) {
        console.error('Tool call/response mismatch detected', {
          expectedIds: expectedToolCallIds,
          actualResponses: actualToolResponses.map(r => r.toolCallId),
        });

        // Add missing tool responses
        for (const expectedId of expectedToolCallIds) {
          if (!actualToolResponses.find(r => r.toolCallId === expectedId)) {
            this.history.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: 'Tool execution failed - no response recorded',
              }),
              toolCallId: expectedId,
              name: 'kubernetes_api_request',
            });
          }
        }
      }
    }

    let systemPromptContent = basePrompt;
    if (this.currentContext) {
      systemPromptContent += `\n\nCURRENT CONTEXT:\n${this.currentContext}`;
    }
    const systemMessage = new SystemMessage(systemPromptContent);

    const messages: BaseMessage[] = [systemMessage];

    // Track tool response sizes
    let totalResponseSize = 0;
    const MAX_RESPONSE_SIZE = 500000; // ~500KB limit for total responses

    try {
      // Find the last assistant message that contains tool calls
      let lastAssistantWithToolsIndex = -1;
      for (let i = this.history.length - 1; i >= 0; i--) {
        const prompt = this.history[i];
        if (prompt.role === 'assistant' && prompt.toolCalls && prompt.toolCalls.length > 0) {
          lastAssistantWithToolsIndex = i;
          break;
        }
      }

      // Validate and sanitize tool responses before adding to messages
      // Only include messages up to the last assistant message with tool calls
      const messagesToProcess =
        lastAssistantWithToolsIndex >= 0
          ? this.history.slice(0, lastAssistantWithToolsIndex + 1)
          : this.history;

      for (const prompt of messagesToProcess) {
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
        } else if (
          prompt.role !== 'assistant' ||
          !prompt.toolCalls ||
          prompt.toolCalls.length === 0
        ) {
          // Only include non-assistant messages or assistant messages without tool calls
          // This ensures we don't include the assistant message that contains tool calls
          messages.push(...this.convertPromptsToMessages([prompt]));
        }
      }

      const modelToUse = this.boundModel || this.model;

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

        // Add this to the formatResponse method after getting a tool response
        if (response && typeof response === 'string' && response.includes('"items":')) {
          try {
            // This looks like a list response - add a note not to suggest kubectl
            const enhancedResponse = {
              ...JSON.parse(response),
              note: 'Remember to use the kubernetes_api_request tool for all operations rather than suggesting kubectl commands.',
            };
            response = JSON.stringify(enhancedResponse);
          } catch (e) {}
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

        // Remove any existing assistant messages that come after the last tool call
        // to prevent message order issues
        if (lastAssistantWithToolsIndex >= 0) {
          this.history = this.history.slice(0, lastAssistantWithToolsIndex + 1);
        }

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

      // Use sanitize-html for robust HTML sanitization
      return sanitizeHtml(content, {
        allowedTags: [], // Disallow all HTML tags
        allowedAttributes: {}, // Disallow all attributes
        textFilter: text => {
          // Replace image placeholders for consistency with previous implementation
          return text.replace(/\[IMAGE\]/gi, '[IMAGE]');
        },
      });
    } catch (error) {
      console.warn('Error sanitizing content:', error);
      // If sanitization fails, return a safe version
      return typeof content === 'string'
        ? content.substring(0, 5000) // Limit length for safety
        : JSON.stringify({ error: true, message: 'Content could not be sanitized' });
    }
  }
}
